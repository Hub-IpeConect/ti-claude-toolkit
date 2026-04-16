import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import ldapRoutes from './routes/ldap.js'
import processosRoutes from './routes/processos.js'
import opensquadRoutes from './routes/opensquad.js'
import terminalRoutes from './routes/terminal.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middlewares
app.use(cors({ origin: 'http://localhost:3000', credentials: true }))
app.use(express.json())

// Log de requisicoes
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`)
  next()
})

// Rotas
app.use('/api/ldap', ldapRoutes)
app.use('/api/processos', processosRoutes)
app.use('/api/opensquad', opensquadRoutes)
app.use('/api/terminal', terminalRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Inicia o servidor
app.listen(PORT, '127.0.0.1', () => {
  console.log('')
  console.log('===========================================')
  console.log('  Gestao 360 - Backend API')
  console.log(`  Rodando em http://localhost:${PORT}`)
  console.log('===========================================')
  console.log('')
})
