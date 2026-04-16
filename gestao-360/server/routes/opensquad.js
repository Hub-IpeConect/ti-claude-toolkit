import express from 'express'
import { spawn, execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
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
  // 1. Bloco ```json ... ```
  const fenced = text.match(/```json\s*([\s\S]*?)```/)
  if (fenced) { try { return JSON.parse(fenced[1].trim()) } catch {} }
  // 2. Primeiro { ... } que contenha "segment" ou "description"
  const objMatch = text.match(/\{[^{}]*(?:"segment"|"description")[^{}]*\}/)
  if (objMatch) { try { return JSON.parse(objMatch[0]) } catch {} }
  // 3. { ... } generico (mais amplo, ultima tentativa)
  const generic = text.match(/\{[\s\S]*?\}/)
  if (generic) { try { const p = JSON.parse(generic[0]); if (p && typeof p === 'object') return p } catch {} }
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
 * POST /api/opensquad/research-profile
 * Body: { projectName, entityType, name, source }
 *
 * Usa a skill sherlock do OpenSquad para pesquisar automaticamente
 * o perfil com base no nome + site/perfil social fornecido.
 * Retorna um JSON com os campos preenchidos (description, audience,
 * segment, tone, objectives, differentials).
 */
router.post('/research-profile', (req, res) => {
  const { projectName, entityType, name, source, timeoutMs = 300000 } = req.body || {}
  const safeName = sanitizeName(projectName)
  const projectPath = path.join(PROJECTS_DIR, safeName)

  if (!safeName || !fs.existsSync(projectPath)) {
    return res.status(404).json({ error: 'Squad nao encontrado.' })
  }
  if (!name) {
    return res.status(400).json({ error: 'Campo name obrigatorio.' })
  }

  const typeLabel = entityType === 'pj' ? 'empresa (PJ)' : 'pessoa fisica (PF)'
  const sourceLine = source ? `Site/perfil: ${source}` : '(sem site/perfil informado — pesquise publicamente)'

  // Prompt que solicita o sherlock + retorno em JSON estruturado
  const prompt = [
    'Use a skill sherlock do OpenSquad para pesquisar o perfil abaixo e extrair informacoes de marketing.',
    '',
    `Tipo: ${typeLabel}`,
    `Nome: ${name}`,
    sourceLine,
    '',
    'Apos a pesquisa, retorne APENAS um objeto JSON valido (sem markdown, sem texto antes/depois) com as chaves:',
    '{',
    '  "segment": "segmento/nicho de atuacao",',
    '  "description": "descricao do que faz em 2-3 frases",',
    '  "audience": "publico-alvo detalhado",',
    '  "tone": "tom de voz recomendado (uma palavra: Profissional, Amigavel, Consultivo, Divertido, Inspirador, Tecnico, Educativo)",',
    '  "objectives": "objetivos de marketing recomendados",',
    '  "differentials": "diferenciais identificados",',
    '  "extra": "outras informacoes relevantes"',
    '}',
    '',
    'Responda SOMENTE com o JSON. Nao inclua explicacoes, crases, markdown ou qualquer texto fora do JSON.',
  ].join('\n')

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
    res.status(500).json({ error: `Falha ao pesquisar: ${err.message}` })
  })

  child.on('close', (code) => {
    clearTimeout(timer)
    const durationMs = Date.now() - startedAt
    const cleanOutput = stripAnsi(stdout).trim()

    if (code !== 0) {
      return res.status(500).json({
        error: stripAnsi(stderr).trim() || `claude saiu com codigo ${code}`,
        rawOutput: cleanOutput,
        exitCode: code,
      })
    }

    // Tenta extrair JSON da resposta (tolerante a markdown/code fences)
    let profile = null
    try {
      // Remove eventuais code fences
      let cleaned = cleanOutput
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim()
      // Se houver texto antes/depois, tenta pegar o primeiro { ... }
      const match = cleaned.match(/\{[\s\S]*\}/)
      if (match) cleaned = match[0]
      profile = JSON.parse(cleaned)
    } catch (err) {
      return res.status(500).json({
        error: 'Nao foi possivel interpretar a resposta da pesquisa como JSON.',
        rawOutput: cleanOutput,
        parseError: err.message,
      })
    }

    res.json({ ok: true, profile, durationMs })
  })
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
  const sourceLine = source ? `Site/perfil: ${source}` : '(sem site/perfil — pesquise publicamente)'
  const propositoLine = proposito ? `Proposito do squad: ${proposito}` : ''

  const prompt = [
    'Use a skill sherlock do OpenSquad para pesquisar o perfil abaixo.',
    'Mostre cada etapa da pesquisa (o que esta buscando, o que encontrou).',
    propositoLine,
    `Tipo: ${typeLabel}`,
    `Nome: ${name}`,
    sourceLine,
    '',
    'Ao FINAL da pesquisa, apos mostrar os resultados, inclua um bloco JSON com esta estrutura exata:',
    '```json',
    '{',
    '  "segment": "...",',
    '  "description": "...",',
    '  "audience": "...",',
    '  "tone": "Profissional|Amigavel|Consultivo|Divertido|Inspirador|Tecnico|Educativo",',
    '  "objectives": "...",',
    '  "differentials": "...",',
    '  "extra": "..."',
    '}',
    '```',
  ].filter(Boolean).join('\n')

  const isWindows = process.platform === 'win32'
  const escaped = prompt.replace(/"/g, '\\"')
  const cmd = isWindows
    ? `chcp 65001 >nul && claude --print --output-format text "${escaped}"`
    : `claude --print --output-format text "${escaped}"`

  let fullOutput = ''

  const child = spawn(cmd, [], {
    cwd: projectPath,
    shell: true,
    env: { ...process.env, FORCE_COLOR: '0', PYTHONIOENCODING: 'utf-8' },
  })

  const timer = setTimeout(() => {
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
    // Nao envia stderr pro usuario — so loga no servidor
    process.stderr.write(`[sherlock:${safeName}] ${text}`)
  })

  child.on('error', (err) => {
    clearTimeout(timer); clearInterval(heartbeat)
    send({ type: 'error', message: `Falha ao executar claude: ${err.message}` })
    res.end()
  })

  child.on('close', (code) => {
    clearTimeout(timer); clearInterval(heartbeat)

    // Tenta extrair o JSON do final da saida
    let profile = tryExtractJson(fullOutput)

    if (profile) {
      send({ type: 'done', profile })
      res.end()
      return
    }

    // JSON nao encontrado — faz segunda chamada rapida so para estruturar o output
    send({ type: 'chunk', text: '\n\n🔄 Estruturando dados encontrados...\n' })

    const structurePrompt = `Com base nas informacoes abaixo sobre "${name}", retorne SOMENTE um JSON valido (sem markdown, sem texto extra):
{"segment":"...","description":"...","audience":"...","tone":"Profissional","objectives":"...","differentials":"...","extra":"..."}

Informacoes coletadas:
${fullOutput.slice(0, 3000)}`

    const escapedSP = structurePrompt.replace(/"/g, '\\"')
    const cmd2 = isWindows
      ? `chcp 65001 >nul && claude --print --output-format text "${escapedSP}"`
      : `claude --print --output-format text "${escapedSP}"`

    let out2 = ''
    const child2 = spawn(cmd2, [], {
      cwd: projectPath,
      shell: true,
      env: { ...process.env, FORCE_COLOR: '0', PYTHONIOENCODING: 'utf-8' },
    })
    const t2 = setTimeout(() => { try { child2.kill() } catch {} }, 60000)

    child2.stdout.on('data', (d) => { out2 += stripAnsi(d.toString('utf8')) })
    child2.on('close', () => {
      clearTimeout(t2)
      const profile2 = tryExtractJson(out2)
      send({ type: 'done', profile: profile2, raw: fullOutput.slice(-500) })
      res.end()
    })
    child2.on('error', () => {
      clearTimeout(t2)
      send({ type: 'done', profile: null, raw: fullOutput.slice(-500) })
      res.end()
    })
  })

  req.on('close', () => {
    clearTimeout(timer); clearInterval(heartbeat)
    try { child.kill() } catch {}
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
