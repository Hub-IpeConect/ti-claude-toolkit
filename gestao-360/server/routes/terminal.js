import express from 'express'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// Carrega node-pty dinamicamente — se falhar, os endpoints respondem com erro legivel
let pty = null
let ptyLoadError = null
try {
  const mod = await import('node-pty')
  // node-pty e CommonJS — expoe spawn em default ou no namespace
  pty = mod.default || mod
  if (typeof pty.spawn !== 'function') {
    throw new Error('spawn nao encontrado no modulo node-pty')
  }
  console.log('[terminal] node-pty carregado com sucesso')
} catch (err) {
  ptyLoadError = err
  console.error('[terminal] FALHA ao carregar node-pty:', err.message)
  console.error('[terminal] Execute "npm install" na pasta server/ para instalar as dependencias.')
  console.error('[terminal] O backend continuara funcionando, mas o terminal do Claude Code nao estara disponivel.')
}

// Sessoes de pty ativas
// session: { id, cwd, command, ptyProcess, buffer, subscribers: Set, createdAt, closedAt }
const sessions = new Map()

const PROJECTS_DIR = path.resolve(__dirname, '..', 'opensquad-projects')

function sanitizeName(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

function newSessionId() {
  return `ses-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * POST /api/terminal/start
 * Body: { projectName, command?, cols?, rows? }
 * Cria nova sessao pty rodando o comando (default: claude) dentro do projeto.
 * Se command for "shell", abre apenas o shell nativo (cmd.exe ou bash).
 */
router.post('/start', (req, res) => {
  if (!pty) {
    return res.status(500).json({
      error: `node-pty nao disponivel: ${ptyLoadError?.message || 'modulo nao carregado'}. Execute "npm install" na pasta server/ para instalar node-pty.`,
    })
  }

  const { projectName, command = 'claude', cols = 80, rows = 24 } = req.body || {}
  const safeName = sanitizeName(projectName)
  const cwd = path.join(PROJECTS_DIR, safeName)

  if (!safeName || !fs.existsSync(cwd)) {
    return res.status(404).json({ error: 'Projeto nao encontrado.' })
  }

  const isWindows = process.platform === 'win32'
  const shell = isWindows ? 'cmd.exe' : (process.env.SHELL || 'bash')

  // Se comando for "shell", abre apenas o shell.
  // Caso contrario roda o shell e executa o comando inicial dentro dele.
  let shellArgs = []
  let initialInput = null

  if (command === 'shell') {
    // shell interativo puro
  } else {
    // cmd.exe /K mantem o shell aberto depois do comando
    // bash -i roda interativo e enviamos o comando como input
    if (isWindows) {
      shellArgs = ['/K', command]
    } else {
      initialInput = `${command}\n`
    }
  }

  let ptyProcess
  try {
    ptyProcess = pty.spawn(shell, shellArgs, {
      name: 'xterm-color',
      cols,
      rows,
      cwd,
      env: { ...process.env, TERM: 'xterm-256color' },
    })
  } catch (err) {
    console.error('[terminal] erro ao spawnar pty:', err)
    return res.status(500).json({
      error: `Nao foi possivel iniciar o terminal: ${err.message}. Verifique se node-pty esta instalado.`,
    })
  }

  const session = {
    id: newSessionId(),
    cwd,
    command,
    ptyProcess,
    buffer: '',      // buffer acumulado (para clientes que conectam depois)
    subscribers: new Set(), // SSE response objects
    createdAt: new Date().toISOString(),
    closedAt: null,
    exitCode: null,
  }
  sessions.set(session.id, session)

  ptyProcess.onData((data) => {
    session.buffer += data
    // Limita buffer a 500KB para nao explodir memoria
    if (session.buffer.length > 500_000) {
      session.buffer = session.buffer.slice(-250_000)
    }
    // Broadcast para todos os subscribers SSE
    for (const sub of session.subscribers) {
      try {
        sub.write(`data: ${JSON.stringify({ type: 'output', data })}\n\n`)
      } catch {}
    }
  })

  ptyProcess.onExit(({ exitCode, signal }) => {
    session.closedAt = new Date().toISOString()
    session.exitCode = exitCode
    for (const sub of session.subscribers) {
      try {
        sub.write(`data: ${JSON.stringify({ type: 'exit', exitCode, signal })}\n\n`)
        sub.end()
      } catch {}
    }
    session.subscribers.clear()
    console.log(`[terminal:${session.id}] finalizado (code=${exitCode})`)
  })

  // Se for comando linux, envia apos spawn
  if (initialInput) {
    setTimeout(() => {
      try { ptyProcess.write(initialInput) } catch {}
    }, 100)
  }

  console.log(`[terminal:${session.id}] iniciado em ${cwd} (${command})`)
  res.json({ sessionId: session.id })
})

/**
 * GET /api/terminal/stream/:id  (Server-Sent Events)
 * Retorna o buffer atual imediatamente e depois faz streaming de novos dados.
 */
router.get('/stream/:id', (req, res) => {
  const session = sessions.get(req.params.id)
  if (!session) {
    return res.status(404).json({ error: 'Sessao nao encontrada.' })
  }

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  res.flushHeaders?.()

  // Envia o buffer acumulado primeiro
  if (session.buffer) {
    res.write(`data: ${JSON.stringify({ type: 'output', data: session.buffer })}\n\n`)
  }

  if (session.closedAt) {
    res.write(`data: ${JSON.stringify({ type: 'exit', exitCode: session.exitCode })}\n\n`)
    res.end()
    return
  }

  session.subscribers.add(res)

  // Heartbeat a cada 30s para manter conexao viva
  const heartbeat = setInterval(() => {
    try { res.write(': ping\n\n') } catch {}
  }, 30000)

  req.on('close', () => {
    clearInterval(heartbeat)
    session.subscribers.delete(res)
  })
})

/**
 * POST /api/terminal/input/:id
 * Body: { data }
 * Envia dados (teclas) para o stdin do pty.
 */
router.post('/input/:id', (req, res) => {
  const session = sessions.get(req.params.id)
  if (!session) return res.status(404).json({ error: 'Sessao nao encontrada.' })
  if (session.closedAt) return res.status(410).json({ error: 'Sessao ja finalizada.' })

  const { data } = req.body || {}
  if (data === undefined) return res.status(400).json({ error: 'Campo data obrigatorio.' })

  try {
    session.ptyProcess.write(data)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * POST /api/terminal/resize/:id
 * Body: { cols, rows }
 */
router.post('/resize/:id', (req, res) => {
  const session = sessions.get(req.params.id)
  if (!session) return res.status(404).json({ error: 'Sessao nao encontrada.' })
  const { cols, rows } = req.body || {}
  try {
    session.ptyProcess.resize(cols || 80, rows || 24)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * POST /api/terminal/close/:id
 */
router.post('/close/:id', (req, res) => {
  const session = sessions.get(req.params.id)
  if (!session) return res.status(404).json({ error: 'Sessao nao encontrada.' })
  try {
    session.ptyProcess.kill()
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
