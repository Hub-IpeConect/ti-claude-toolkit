import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { fileURLToPath } from 'url'

import { jwtMiddleware } from './middleware/auth.js'
import authRoutes      from './routes/auth.js'
import ldapRoutes      from './routes/ldap.js'
import processosRoutes from './routes/processos.js'
import opensquadRoutes from './routes/opensquad.js'
import terminalRoutes  from './routes/terminal.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

const app  = express()
const PORT = process.env.PORT || 3001

const isProd = process.env.NODE_ENV === 'production' ||
  !fs.existsSync(path.join(__dirname, '..', 'node_modules', 'vite'))

app.use(cors({ origin: isProd ? '*' : 'http://localhost:3000', credentials: true }))
app.use(express.json({ limit: '10mb' }))

// Log de requisicoes
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`)
  next()
})

// ============================================================
// ROTAS PUBLICAS (sem autenticacao JWT)
// ============================================================
app.use('/api/auth', authRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ============================================================
// MIDDLEWARE JWT — todas as rotas montadas ABAIXO exigem token
// ============================================================
app.use(jwtMiddleware)

// ============================================================
// ROTAS PROTEGIDAS
// ============================================================
app.use('/api/ldap',      ldapRoutes)
app.use('/api/processos', processosRoutes)
app.use('/api/opensquad', opensquadRoutes)
app.use('/api/terminal',  terminalRoutes)

// ============================================================
// FRONTEND (producao) — serve dist/ se existir
// ============================================================
const distPath = path.join(__dirname, '..', 'dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
  console.log('[server] Servindo frontend de:', distPath)
} else {
  console.log('[server] Pasta dist/ nao encontrada — rode "npm run build" na raiz do projeto.')
}

// ============================================================
// START
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
  const jwtOk = (process.env.JWT_SECRET || '').length > 10 &&
    !process.env.JWT_SECRET?.includes('mudar-em-producao')

  console.log('')
  console.log('===========================================')
  console.log('  Gestao 360 - Ipeconect')
  console.log(`  Local:   http://localhost:${PORT}`)
  console.log(`  Rede:    http://${getLocalIP()}:${PORT}`)
  console.log(`  JWT:     ${jwtOk ? 'OK' : 'AVISO: use JWT_SECRET personalizado no .env!'}`)
  console.log('===========================================')
  console.log('')
})

function getLocalIP() {
  try {
    const nets = os.networkInterfaces()
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) return net.address
      }
    }
  } catch {}
  return '0.0.0.0'
}
