import express from 'express'
import { spawn, execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// Diretorio onde os projetos OpenSquad serao criados
const PROJECTS_DIR = path.resolve(__dirname, '..', 'opensquad-projects')

// Garante que o diretorio existe
if (!fs.existsSync(PROJECTS_DIR)) {
  fs.mkdirSync(PROJECTS_DIR, { recursive: true })
}

// Armazena execucoes em andamento
// job: { id, projectName, projectPath, rawLog, log, status, exitCode, startedAt, finishedAt, child }
const runningJobs = new Map()

function sanitizeName(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

// Tenta extrair um objeto JSON valido de uma string (tolerante a markdown/texto extra)
function tryExtractJson(text) {
  if (!text) return null

  // 1. Bloco ```json ... ``` (greedy para pegar o maior bloco)
  const fenced = text.match(/```json\s*([\s\S]*?)```/i)
  if (fenced) {
    try { return JSON.parse(fenced[1].trim()) } catch {}
  }

  // 2. Bloco ``` generico (sem tipo explicito)
  const fencedGeneric = text.match(/```\s*(\{[\s\S]*?\})\s*```/)
  if (fencedGeneric) {
    try { return JSON.parse(fencedGeneric[1].trim()) } catch {}
  }

  // 3. Encontra o maior bloco { ... } que contenha as chaves esperadas
  //    Usa match greedy e tenta parsear todas as ocorrencias de maior para menor
  const allBlocks = []
  let depth = 0, start = -1
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      if (depth === 0) start = i
      depth++
    } else if (text[i] === '}') {
      depth--
      if (depth === 0 && start !== -1) {
        allBlocks.push(text.slice(start, i + 1))
        start = -1
      }
    }
  }
  // Tenta do maior para o menor bloco
  allBlocks.sort((a, b) => b.length - a.length)
  for (const block of allBlocks) {
    try {
      const parsed = JSON.parse(block)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        // Valida que tem pelo menos uma das chaves esperadas
        if (parsed.segment || parsed.description || parsed.audience || parsed.tone) {
          return parsed
        }
      }
    } catch {}
  }
  // Ultima tentativa: qualquer objeto valido
  for (const block of allBlocks) {
    try {
      const parsed = JSON.parse(block)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
    } catch {}
  }

  return null
}

// Remove sequencias ANSI de escape para exibicao limpa no frontend
function stripAnsi(str) {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-9;?]*[a-zA-Z]/g, '')
            .replace(/\x1B\][^\x07]*\x07/g, '')
            .replace(/\x1B[=>]/g, '')
            .replace(/\r/g, '\n')
}

/**
 * POST /api/opensquad/init
 * Body: { projectName }
 */
router.post('/init', (req, res) => {
  const { projectName } = req.body || {}
  const safeName = sanitizeName(projectName)

  if (!safeName) {
    return res.status(400).json({ error: 'Nome de projeto invalido.' })
  }

  const projectPath = path.join(PROJECTS_DIR, safeName)
  if (fs.existsSync(projectPath)) {
    return res.status(409).json({ error: 'Ja existe um squad com esse nome.' })
  }

  try {
    fs.mkdirSync(projectPath, { recursive: true })
  } catch (err) {
    return res.status(500).json({ error: `Nao foi possivel criar a pasta: ${err.message}` })
  }

  // Usa claude --print para inicializar a skill opensquad de forma nao-interativa.
  // Isso evita o menu interativo do "npx opensquad init" que requer setas+Enter.
  const isWindows = process.platform === 'win32'
  const prompt = 'Use a skill opensquad para inicializar este projeto. Configure a estrutura basica de pastas e arquivos (.agent/, CLAUDE.md, .mcp.json) necessaria para o opensquad funcionar. Responda apenas com "OK - squad inicializado." quando terminar.'
  const escaped = prompt.replace(/"/g, '\\"')
  const cmd = isWindows
    ? `chcp 65001 >nul && claude --print --output-format text "${escaped}"`
    : `claude --print --output-format text "${escaped}"`

  const startedAt = Date.now()
  let stdout = ''
  let stderr = ''

  const child = spawn(cmd, [], {
    cwd: projectPath,
    shell: true,
    env: { ...process.env, FORCE_COLOR: '0', PYTHONIOENCODING: 'utf-8' },
  })

  // Timeout de 3 minutos
  const timer = setTimeout(() => {
    try { child.kill() } catch {}
  }, 180000)

  child.stdout.on('data', (d) => { stdout += d.toString('utf8') })
  child.stderr.on('data', (d) => { stderr += d.toString('utf8') })

  child.on('error', (err) => {
    clearTimeout(timer)
    // Se claude nao estiver disponivel, apenas entrega a pasta criada
    console.warn('[opensquad/init] claude nao disponivel, entregando pasta vazia:', err.message)
    res.json({ ok: true, projectName: safeName, projectPath, warning: 'claude nao disponivel — pasta criada sem inicializacao da skill.' })
  })

  child.on('close', (code) => {
    clearTimeout(timer)
    const output = stripAnsi(stdout).trim()
    console.log(`[opensquad/init:${safeName}] finalizado (code=${code})`)
    // Mesmo se claude retornar erro nao-zero, consideramos ok se a pasta foi criada
    res.json({ ok: true, projectName: safeName, projectPath, output, exitCode: code })
  })
})

/**
 * POST /api/opensquad/stdin/:jobId
 * Body: { data } — string a ser enviada para o stdin do processo
 * Permite enviar teclas (setas, enter, letras) para o CLI interativo
 */
router.post('/stdin/:jobId', (req, res) => {
  const job = runningJobs.get(req.params.jobId)
  if (!job) return res.status(404).json({ error: 'Job nao encontrado.' })
  if (!job.child) return res.status(410).json({ error: 'Processo ja finalizado.' })

  const { data } = req.body || {}
  if (data === undefined || data === null) {
    return res.status(400).json({ error: 'Campo "data" obrigatorio.' })
  }

  try {
    job.child.stdin.write(data)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/opensquad/status/:jobId
 */
router.get('/status/:jobId', (req, res) => {
  const job = runningJobs.get(req.params.jobId)
  if (!job) return res.status(404).json({ error: 'Job nao encontrado.' })
  res.json({
    id: job.id,
    projectName: job.projectName,
    status: job.status,
    exitCode: job.exitCode,
    log: job.log,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt || null,
  })
})

/**
 * GET /api/opensquad/projects
 */
router.get('/projects', (req, res) => {
  try {
    const entries = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => {
        const dir = path.join(PROJECTS_DIR, e.name)
        const stat = fs.statSync(dir)
        const files = fs.readdirSync(dir)
        return {
          name: e.name,
          createdAt: stat.birthtime,
          modifiedAt: stat.mtime,
          filesCount: files.length,
          hasOpenSquadConfig: files.includes('.opensquad') ||
                              files.includes('opensquad.config.js') ||
                              files.includes('opensquad.json'),
        }
      })
      .sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt))

    res.json({ projects: entries, projectsDir: PROJECTS_DIR })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/opensquad/project/:name
 */
router.get('/project/:name', (req, res) => {
  const safeName = sanitizeName(req.params.name)
  const projectPath = path.join(PROJECTS_DIR, safeName)

  if (!fs.existsSync(projectPath)) {
    return res.status(404).json({ error: 'Projeto nao encontrado.' })
  }

  try {
    const files = []
    function walk(dir, relative = '') {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.name.startsWith('.git')) continue
        if (entry.name === 'node_modules') continue
        const rel = path.join(relative, entry.name)
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          files.push({ path: rel, type: 'dir' })
          walk(full, rel)
        } else {
          const stat = fs.statSync(full)
          files.push({ path: rel, type: 'file', size: stat.size })
        }
      }
    }
    walk(projectPath)
    res.json({ name: safeName, projectPath, files })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * POST /api/opensquad/run
 * Body: { projectName, command } — executa um comando customizado dentro do projeto
 */
router.post('/run', (req, res) => {
  const { projectName, command } = req.body || {}
  const safeName = sanitizeName(projectName)
  const projectPath = path.join(PROJECTS_DIR, safeName)

  if (!safeName || !fs.existsSync(projectPath)) {
    return res.status(404).json({ error: 'Projeto nao encontrado.' })
  }
  if (!command || !command.trim()) {
    return res.status(400).json({ error: 'Comando vazio.' })
  }

  const jobId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const job = {
    id: jobId,
    projectName: safeName,
    projectPath,
    rawLog: '',
    log: '',
    status: 'running',
    exitCode: null,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    child: null,
  }
  runningJobs.set(jobId, job)

  try {
    const isWindows = process.platform === 'win32'
    // Prefixa com chcp 65001 no Windows para forcar UTF-8 no output
    const fullCommand = isWindows
      ? `chcp 65001 >nul && ${command}`
      : command

    const child = spawn(fullCommand, [], {
      cwd: projectPath,
      shell: true,
      env: { ...process.env, FORCE_COLOR: '1', PYTHONIOENCODING: 'utf-8' },
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    job.child = child

    const onData = (data) => {
      const str = data.toString()
      job.rawLog += str
      job.log += stripAnsi(str)
    }

    child.stdout.on('data', onData)
    child.stderr.on('data', onData)

    child.on('close', (code) => {
      job.status = code === 0 ? 'completed' : 'error'
      job.exitCode = code
      job.finishedAt = new Date().toISOString()
      job.child = null
    })

    child.on('error', (err) => {
      job.status = 'error'
      job.log += `\n[ERRO] ${err.message}\n`
      job.exitCode = -1
      job.child = null
    })

    res.json({ jobId })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * POST /api/opensquad/open-vscode
 * Body: { projectName }
 * Abre a pasta do projeto no VS Code usando o comando `code`.
 * (Funciona apenas quando o servidor roda na mesma maquina do usuario)
 */
router.post('/open-vscode', (req, res) => {
  const { projectName } = req.body || {}
  const safeName = sanitizeName(projectName)
  const projectPath = path.join(PROJECTS_DIR, safeName)

  if (!safeName || !fs.existsSync(projectPath)) {
    return res.status(404).json({ error: 'Projeto nao encontrado.' })
  }

  try {
    const isWindows = process.platform === 'win32'
    // "code" precisa estar no PATH (instalado com a opcao "Add to PATH" do VS Code)
    const child = spawn('code', [projectPath], {
      shell: isWindows,
      detached: true,
      stdio: 'ignore',
    })
    child.on('error', (err) => {
      console.error('[open-vscode] erro:', err)
    })
    child.unref()
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * DELETE /api/opensquad/project/:name
 * Exclui um projeto (pasta completa)
 */
router.delete('/project/:name', (req, res) => {
  const safeName = sanitizeName(req.params.name)
  const projectPath = path.join(PROJECTS_DIR, safeName)

  if (!safeName || !fs.existsSync(projectPath)) {
    return res.status(404).json({ error: 'Squad nao encontrado.' })
  }

  const isWindows = process.platform === 'win32'

  // No Windows, fs.rmSync falha com EPERM quando arquivos estao bloqueados
  // ou tem atributos somente-leitura. Usamos rmdir /s /q que e mais robusto.
  if (isWindows) {
    try {
      execSync(`rmdir /s /q "${projectPath}"`, { stdio: 'pipe' })
      return res.json({ ok: true, deleted: safeName })
    } catch (err) {
      return res.status(500).json({ error: `Nao foi possivel excluir o squad: ${err.message}` })
    }
  }

  try {
    fs.rmSync(projectPath, { recursive: true, force: true })
    res.json({ ok: true, deleted: safeName })
  } catch (err) {
    res.status(500).json({ error: `Nao foi possivel excluir o squad: ${err.message}` })
  }
})

/**
 * POST /api/opensquad/setup-profile
 * Body: { projectName, profile }
 *
 * Aplica o perfil do squad rodando `claude -p` com um prompt estruturado.
 * Substitui o fluxo interativo do /opensquad por um formulario.
 */
router.post('/setup-profile', (req, res) => {
  const { projectName, profile, timeoutMs = 300000 } = req.body || {}
  const safeName = sanitizeName(projectName)
  const projectPath = path.join(PROJECTS_DIR, safeName)

  if (!safeName || !fs.existsSync(projectPath)) {
    return res.status(404).json({ error: 'Squad nao encontrado.' })
  }
  if (!profile || typeof profile !== 'object') {
    return res.status(400).json({ error: 'Campo profile obrigatorio.' })
  }

  // Monta o prompt estruturado para a skill opensquad
  const lines = [
    'Use a skill opensquad para configurar o perfil deste squad com os dados abaixo.',
    'Execute a configuracao completa que o comando /opensquad faria, gravando os',
    'arquivos de contexto necessarios (.agent/, CLAUDE.md, etc).',
    '',
    `Tipo: ${profile.entityType === 'pj' ? 'Empresa (PJ)' : 'Pessoa Fisica (PF)'}`,
    `Nome: ${profile.name}`,
  ]
  if (profile.website) lines.push(`Site/perfil: ${profile.website}`)
  if (profile.segment) lines.push(`Segmento/nicho: ${profile.segment}`)
  if (profile.description) lines.push(`Descricao: ${profile.description}`)
  if (profile.audience) lines.push(`Publico-alvo: ${profile.audience}`)
  if (profile.tone) lines.push(`Tom de voz: ${profile.tone}`)
  if (profile.objectives) lines.push(`Objetivos principais: ${profile.objectives}`)
  if (profile.differentials) lines.push(`Diferenciais: ${profile.differentials}`)
  if (profile.extra) lines.push(`Informacoes extras: ${profile.extra}`)
  lines.push('')
  lines.push('Ao final, responda com um resumo curto (max 5 linhas) confirmando o que foi configurado.')

  const prompt = lines.join('\n')
  const isWindows = process.platform === 'win32'
  const escapedPrompt = prompt.replace(/"/g, '\\"')
  const cmd = isWindows
    ? `chcp 65001 >nul && claude --print --output-format text "${escapedPrompt}"`
    : `claude --print --output-format text "${escapedPrompt}"`

  const startedAt = Date.now()
  let stdout = ''
  let stderr = ''

  const child = spawn(cmd, [], {
    cwd: projectPath,
    shell: true,
    env: { ...process.env, FORCE_COLOR: '0', PYTHONIOENCODING: 'utf-8' },
  })

  const timer = setTimeout(() => { try { child.kill() } catch {} }, timeoutMs)

  child.stdout.on('data', (chunk) => { stdout += chunk.toString('utf8') })
  child.stderr.on('data', (chunk) => { stderr += chunk.toString('utf8') })

  child.on('error', (err) => {
    clearTimeout(timer)
    res.status(500).json({ error: `Falha ao configurar squad: ${err.message}` })
  })

  child.on('close', (code) => {
    clearTimeout(timer)
    const durationMs = Date.now() - startedAt
    const cleanOutput = stripAnsi(stdout).trim()
    const cleanError = stripAnsi(stderr).trim()

    // Salva o perfil tambem em JSON pra consulta rapida
    try {
      const profilePath = path.join(projectPath, '.squad-profile.json')
      fs.writeFileSync(profilePath, JSON.stringify({ ...profile, configuredAt: new Date().toISOString() }, null, 2), 'utf8')
    } catch {}

    if (code !== 0) {
      return res.status(500).json({
        error: cleanError || `claude saiu com codigo ${code}`,
        output: cleanOutput,
        exitCode: code,
        durationMs,
      })
    }

    res.json({ ok: true, output: cleanOutput, durationMs })
  })
})

/**
 * POST /api/opensquad/action
 * Body: { projectName, prompt, timeoutMs? }
 *
 * Roda `claude -p "<prompt>"` em modo headless dentro do projeto.
 * Usado pelo cat\u00e1logo de a\u00e7\u00f5es (UI sem terminal).
 */
router.post('/action', (req, res) => {
  const { projectName, prompt, timeoutMs = 180000 } = req.body || {}
  const safeName = sanitizeName(projectName)
  const projectPath = path.join(PROJECTS_DIR, safeName)

  if (!safeName || !fs.existsSync(projectPath)) {
    return res.status(404).json({ error: 'Projeto nao encontrado.' })
  }
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Campo prompt obrigatorio.' })
  }

  const isWindows = process.platform === 'win32'
  // Usa --print (headless) e --output-format text para saida limpa
  // Escapa aspas duplas no prompt
  const escapedPrompt = prompt.replace(/"/g, '\\"')
  const cmd = isWindows
    ? `chcp 65001 >nul && claude --print --output-format text "${escapedPrompt}"`
    : `claude --print --output-format text "${escapedPrompt}"`

  const startedAt = Date.now()
  let stdout = ''
  let stderr = ''

  const child = spawn(cmd, [], {
    cwd: projectPath,
    shell: true,
    env: { ...process.env, FORCE_COLOR: '0', PYTHONIOENCODING: 'utf-8' },
  })

  const timer = setTimeout(() => {
    try { child.kill() } catch {}
  }, timeoutMs)

  child.stdout.on('data', (chunk) => { stdout += chunk.toString('utf8') })
  child.stderr.on('data', (chunk) => { stderr += chunk.toString('utf8') })

  child.on('error', (err) => {
    clearTimeout(timer)
    res.status(500).json({ error: `Falha ao executar claude: ${err.message}` })
  })

  child.on('close', (code) => {
    clearTimeout(timer)
    const durationMs = Date.now() - startedAt
    const cleanOutput = stripAnsi(stdout).trim()
    const cleanError = stripAnsi(stderr).trim()

    if (code !== 0) {
      return res.status(500).json({
        error: cleanError || `claude saiu com codigo ${code}`,
        output: cleanOutput,
        exitCode: code,
        durationMs,
      })
    }

    res.json({
      ok: true,
      output: cleanOutput,
      durationMs,
    })
  })
})

/**
 * POST /api/opensquad/research-profile
 * Body: { projectName, entityType, name, source, proposito }
 *
 * Versao NAO-streaming: espera o Claude terminar e retorna JSON.
 * Evita problemas de SSE com proxy do Vite no Windows.
 */
router.post('/research-profile', (req, res) => {
  const { projectName, entityType, name, source, proposito, timeoutMs = 300000 } = req.body || {}
  const safeName = sanitizeName(projectName)
  const projectPath = path.join(PROJECTS_DIR, safeName)

  if (!safeName || !fs.existsSync(projectPath)) {
    return res.status(404).json({ error: 'Squad nao encontrado.' })
  }
  if (!name) {
    return res.status(400).json({ error: 'Campo name obrigatorio.' })
  }

  const typeLabel = entityType === 'pj' ? 'empresa (PJ)' : 'pessoa fisica (PF)'
  const sourceLine = source ? 'Site/perfil para consulta: ' + source : '(sem site/perfil informado)'
  const propositoLine = proposito ? 'Proposito do squad de marketing: ' + proposito : ''

  const prompt = [
    'Voce e um especialista em marketing digital.',
    'Analise o perfil abaixo e extraia informacoes de marketing.',
    'Tipo: ' + typeLabel + '.',
    'Nome/Empresa: ' + name + '.',
    sourceLine + '.',
    propositoLine ? propositoLine + '.' : '',
    'Com base no que voce sabe sobre esta empresa/pessoa e no site informado, retorne SOMENTE um objeto JSON valido.',
    'Nao use marcadores de codigo, nao use crases, nao escreva nada antes ou depois do JSON.',
    'Seja especifico. Se nao souber um campo, use seu conhecimento sobre o segmento para inferir.',
    'Formato exato (JSON): {"segment":"(segmento ou nicho de atuacao)","description":"(descricao do que a empresa faz em 2 a 3 frases)","audience":"(publico-alvo: quem sao, faixa etaria, necessidades)","tone":"(um de: Profissional, Amigavel, Consultivo, Divertido, Inspirador, Tecnico, Educativo)","objectives":"(objetivos de marketing recomendados)","differentials":"(diferenciais competitivos identificados)","extra":"(outras informacoes relevantes)"}',
  ].filter(Boolean).join(' ')

  const isWindows = process.platform === 'win32'
  const serverDir = path.resolve(__dirname, '..')
  const escaped = prompt.replace(/"/g, '\\"')
  const shellCmd = isWindows
    ? 'chcp 65001 >nul && claude --print --output-format text "' + escaped + '"'
    : 'claude --print --output-format text "' + escaped + '"'

  console.log('[sherlock:' + safeName + '] Prompt (' + prompt.length + ' chars) — modo sincrono')

  let stdout = ''
  let stderr = ''

  const child = spawn(shellCmd, [], {
    cwd: serverDir,
    shell: true,
    env: { ...process.env, FORCE_COLOR: '0', PYTHONIOENCODING: 'utf-8' },
  })

  console.log('[sherlock:' + safeName + '] child.pid=' + child.pid)

  const timer = setTimeout(() => {
    try { child.kill() } catch (e) {}
    res.status(504).json({ error: 'Timeout: Sherlock demorou mais que 5 minutos.' })
  }, timeoutMs)

  child.stdout.on('data', (d) => { stdout += d.toString('utf8') })
  child.stderr.on('data', (d) => { stderr += d.toString('utf8') })

  child.on('error', (err) => {
    clearTimeout(timer)
    console.error('[sherlock:' + safeName + '] erro ao executar:', err.message)
    res.status(500).json({ error: 'Falha ao executar claude: ' + err.message })
  })

  child.on('close', (code, signal) => {
    clearTimeout(timer)
    const fullOutput = stripAnsi(stdout)
    console.log('[sherlock:' + safeName + '] finalizado (code=' + code + ', signal=' + signal + ', output=' + fullOutput.length + ' chars)')

    let profile = tryExtractJson(fullOutput)

    if (profile) {
      console.log('[sherlock:' + safeName + '] JSON extraido com sucesso')
      return res.json({ ok: true, profile, raw: fullOutput.slice(0, 6000) })
    }

    if (!fullOutput.trim()) {
      console.log('[sherlock:' + safeName + '] Output vazio')
      return res.json({ ok: true, profile: null, raw: '' })
    }

    // Tem output mas nao e JSON — tenta segunda chamada para estruturar
    console.log('[sherlock:' + safeName + '] Tentando estruturar output em JSON...')

    const structPrompt = [
      'Converta as informacoes abaixo sobre ' + name + ' em um objeto JSON valido.',
      'Retorne SOMENTE o JSON, sem texto antes ou depois, sem marcadores de codigo.',
      "Formato: {" + '"segment":"...","description":"...","audience":"...","tone":"Profissional","objectives":"...","differentials":"...","extra":"..."' + "}.",
      'Informacoes coletadas:',
      fullOutput.slice(0, 2000).replace(/\n/g, ' ').replace(/"/g, "'"),
    ].join(' ')

    const esc2 = structPrompt.replace(/"/g, '\\"')
    const cmd2 = isWindows
      ? 'chcp 65001 >nul && claude --print --output-format text "' + esc2 + '"'
      : 'claude --print --output-format text "' + esc2 + '"'

    let out2 = ''
    const child2 = spawn(cmd2, [], {
      cwd: serverDir,
      shell: true,
      env: { ...process.env, FORCE_COLOR: '0', PYTHONIOENCODING: 'utf-8' },
    })

    const t2 = setTimeout(() => { try { child2.kill() } catch (e) {} }, 60000)

    child2.stdout.on('data', (d) => { out2 += stripAnsi(d.toString('utf8')) })
    child2.on('close', () => {
      clearTimeout(t2)
      const profile2 = tryExtractJson(out2)
      console.log('[sherlock:' + safeName + '] 2a tentativa:', profile2 ? 'OK' : 'FALHOU')
      res.json({ ok: true, profile: profile2, raw: fullOutput.slice(0, 6000) })
    })
    child2.on('error', () => {
      clearTimeout(t2)
      res.json({ ok: true, profile: null, raw: fullOutput.slice(0, 6000) })
    })
  })
})

/**
 * POST /api/opensquad/research-profile-stream
 * Body: { projectName, entityType, name, source, proposito }
 *
 * Igual ao research-profile mas usa SSE para transmitir o output
 * do Sherlock em tempo real para o frontend.
 * Eventos: { type: 'chunk', text } | { type: 'done', profile } | { type: 'error', message }
 */
router.post('/research-profile-stream', (req, res) => {
  const { projectName, entityType, name, source, proposito, timeoutMs = 300000 } = req.body || {}
  const safeName = sanitizeName(projectName)
  const projectPath = path.join(PROJECTS_DIR, safeName)

  if (!safeName || !fs.existsSync(projectPath)) {
    return res.status(404).json({ error: 'Squad nao encontrado.' })
  }
  if (!name) {
    return res.status(400).json({ error: 'Campo name obrigatorio.' })
  }

  // Configura SSE
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  res.flushHeaders?.()

  const send = (data) => {
    try { res.write(`data: ${JSON.stringify(data)}\n\n`) } catch {}
  }

  const typeLabel = entityType === 'pj' ? 'empresa (PJ)' : 'pessoa fisica (PF)'
  const sourceLine = source ? `Site/perfil para consulta: ${source}` : '(sem site/perfil informado)'
  const propositoLine = proposito ? `Proposito do squad de marketing: ${proposito}` : ''

  // Prompt direto — achatado em uma unica linha para funcionar como argumento
  // no Windows cmd.exe (mesma abordagem da rota /init que funciona).
  // IMPORTANTE: nao usar crases (backticks) nem newlines no prompt.
  const prompt = [
    `Voce e um especialista em marketing digital.`,
    `Analise o perfil abaixo e extraia informacoes de marketing.`,
    `Tipo: ${typeLabel}.`,
    `Nome/Empresa: ${name}.`,
    sourceLine + '.',
    propositoLine ? propositoLine + '.' : '',
    'Com base no que voce sabe sobre esta empresa/pessoa e no site informado, retorne SOMENTE um objeto JSON valido.',
    'Nao use marcadores de codigo, nao use crases, nao escreva nada antes ou depois do JSON.',
    'Seja especifico. Se nao souber um campo, use seu conhecimento sobre o segmento para inferir.',
    'Formato exato (JSON): {"segment":"(segmento ou nicho de atuacao)","description":"(descricao do que a empresa faz em 2 a 3 frases)","audience":"(publico-alvo: quem sao, faixa etaria, necessidades)","tone":"(um de: Profissional, Amigavel, Consultivo, Divertido, Inspirador, Tecnico, Educativo)","objectives":"(objetivos de marketing recomendados)","differentials":"(diferenciais competitivos identificados)","extra":"(outras informacoes relevantes)"}',
  ].filter(Boolean).join(' ')

  const isWindows = process.platform === 'win32'
  // Usa o diretorio do servidor (ja confiavel para o Claude) em vez do projeto novo
  // para evitar prompts interativos de permissao que travam a execucao
  const serverDir = path.resolve(__dirname, '..')

  let fullOutput = ''

  // Escapa aspas duplas e monta o comando como argumento direto (igual ao /init).
  // Nao usar stdin pipe, redirecionamento < ou arquivo temp — nenhum funciona
  // com o wrapper .cmd do Claude no Windows (SIGTERM / output vazio).
  const escaped = prompt.replace(/"/g, '\\"')
  const shellCmd = isWindows
    ? `chcp 65001 >nul && claude --print --output-format text "${escaped}"`
    : `claude --print --output-format text "${escaped}"`

  console.log(`[sherlock:${safeName}] Prompt (${prompt.length} chars)`)
  console.log(`[sherlock:${safeName}] Executando claude --print como argumento direto...`)

  // SEM stdio customizado — usa default ['pipe','pipe','pipe'] igual ao /init que funciona.
  // stdin:'ignore' pode causar SIGTERM no Claude CLI.
  const child = spawn(shellCmd, [], {
    cwd: serverDir,
    shell: true,
    env: { ...process.env, FORCE_COLOR: '0', PYTHONIOENCODING: 'utf-8' },
  })

  console.log(`[sherlock:${safeName}] child.pid=${child.pid}`)

  const timer = setTimeout(() => {
    console.log(`[sherlock:${safeName}] TIMEOUT — matando processo`)
    try { child.kill() } catch {}
    send({ type: 'error', message: 'Timeout: Sherlock demorou mais que 5 minutos.' })
    res.end()
  }, timeoutMs)

  // Heartbeat para manter conexao viva
  const heartbeat = setInterval(() => {
    try { res.write(': ping\n\n') } catch {}
  }, 20000)

  child.stdout.on('data', (chunk) => {
    const text = stripAnsi(chunk.toString('utf8'))
    fullOutput += text
    send({ type: 'chunk', text })
  })

  child.stderr.on('data', (chunk) => {
    const text = stripAnsi(chunk.toString('utf8'))
    console.error(`[sherlock:${safeName}] stderr: ${text}`)
  })

  child.on('error', (err) => {
    clearTimeout(timer); clearInterval(heartbeat)
    // (sem arquivo temp para limpar)
    send({ type: 'error', message: `Falha ao executar claude: ${err.message}` })
    res.end()
  })

  child.on('close', (code, signal) => {
    clearTimeout(timer); clearInterval(heartbeat)
    // (sem arquivo temp para limpar)

    console.log(`[sherlock:${safeName}] finalizado (code=${code}, signal=${signal}, output=${fullOutput.length} chars)`)

    // Tenta extrair o JSON do final da saida
    let profile = tryExtractJson(fullOutput)

    if (profile) {
      console.log(`[sherlock:${safeName}] JSON extraido na 1a tentativa:`, JSON.stringify(profile).slice(0, 200))
      send({ type: 'done', profile, raw: fullOutput.slice(0, 6000) })
      res.end()
      return
    }

    console.log(`[sherlock:${safeName}] JSON nao encontrado na 1a tentativa — output: "${fullOutput.slice(0, 200)}"`)

    // Se o output esta vazio, nao adianta tentar estruturar — envia erro direto
    if (!fullOutput.trim()) {
      console.log(`[sherlock:${safeName}] Output vazio — abortando 2a tentativa`)
      send({ type: 'done', profile: null, raw: '' })
      res.end()
      return
    }

    // JSON nao encontrado mas temos conteudo — faz segunda chamada para estruturar
    send({ type: 'chunk', text: '\n\n🔄 Estruturando dados encontrados...\n' })

    // Segunda chamada — tambem como argumento direto, em uma linha
    const structurePrompt = [
      `Converta as informacoes abaixo sobre ${name} em um objeto JSON valido.`,
      'Retorne SOMENTE o JSON, sem texto antes ou depois, sem marcadores de codigo.',
      'Formato: {"segment":"...","description":"...","audience":"...","tone":"Profissional","objectives":"...","differentials":"...","extra":"..."}.',
      'Informacoes coletadas:',
      fullOutput.slice(0, 2000).replace(/\n/g, ' ').replace(/"/g, "'"),
    ].join(' ')

    const escaped2 = structurePrompt.replace(/"/g, '\\"')
    const shellCmd2 = isWindows
      ? `chcp 65001 >nul && claude --print --output-format text "${escaped2}"`
      : `claude --print --output-format text "${escaped2}"`

    let out2 = ''
    const child2 = spawn(shellCmd2, [], {
      cwd: serverDir,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '0', PYTHONIOENCODING: 'utf-8' },
    })

    const t2 = setTimeout(() => { try { child2.kill() } catch {} }, 60000)

    child2.stdout.on('data', (d) => { out2 += stripAnsi(d.toString('utf8')) })
    child2.on('close', () => {
      clearTimeout(t2)
      const profile2 = tryExtractJson(out2)
      console.log(`[sherlock:${safeName}] 2a tentativa JSON:`, profile2 ? JSON.stringify(profile2).slice(0, 200) : 'FALHOU — out2=' + out2.slice(0, 300))
      send({ type: 'done', profile: profile2, raw: fullOutput.slice(0, 6000) })
      res.end()
    })
    child2.on('error', () => {
      clearTimeout(t2)
      console.log(`[sherlock:${safeName}] Erro na 2a tentativa`)
      send({ type: 'done', profile: null, raw: fullOutput.slice(0, 6000) })
      res.end()
    })
  })


  // NAO matar o child quando req.on('close') dispara.
  // O proxy do Vite fecha a conexao SSE prematuramente, mas o processo
  // Claude deve continuar rodando. O child.on('close') ainda sera chamado
  // quando o processo terminar naturalmente, e os dados serao processados.
  // O send() usa try/catch entao nao quebra se a conexao estiver fechada.
  req.on('close', () => {
    console.log(`[sherlock:${safeName}] req.on('close') disparou (conexao fechada pelo proxy) — child continua rodando`)
    clearTimeout(timer); clearInterval(heartbeat)
    // NÃO faz child.kill() aqui — deixa o processo terminar
  })
})

/**
 * GET /api/opensquad/config
 */
router.get('/config', (req, res) => {
  res.json({
    projectsDir: PROJECTS_DIR,
    platform: process.platform,
    nodeVersion: process.version,
  })
})

export default router
