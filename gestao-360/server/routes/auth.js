/**
 * Rota de autenticacao unificada.
 * POST /api/auth/login — autentica local (users.json) ou LDAP (ldap-config.json).
 * Retorna JWT com payload do usuario.
 */
import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import { sign } from '../lib/jwt.js'
import { bindAsUser, searchUserData, checkGroupMembership } from '../lib/ldapAuth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()

const DATA_DIR  = path.join(__dirname, '..', 'data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')
const LDAP_CONFIG_FILE = path.join(DATA_DIR, 'ldap-config.json')

const JWT_SECRET  = process.env.JWT_SECRET  || 'gestao360-jwt-mudar-em-producao-2024'
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h'

// ============================================================
// INICIALIZACAO: cria users.json na primeira execucao
// ============================================================
function ensureUsersFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (fs.existsSync(USERS_FILE)) return

  const defaultPassword = process.env.ADMIN_PASSWORD || 'gestao360@admin'
  const hash = hashPassword(defaultPassword)

  const users = [{
    username: 'admin',
    passwordHash: hash,
    displayName: 'Administrador',
    email: 'admin@ipeconect.com.br',
    role: 'admin',
  }]

  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8')

  console.log('\n\x1b[33m╔═══════════════════════════════════════════╗\x1b[0m')
  console.log('\x1b[33m║  GESTAO 360 — Primeiro acesso             ║\x1b[0m')
  console.log('\x1b[33m║  Usuario: admin                           ║\x1b[0m')
  console.log(`\x1b[33m║  Senha:   ${defaultPassword.padEnd(31)}║\x1b[0m`)
  console.log('\x1b[33m║  Altere a senha em: Configuracao > Usuarios║\x1b[0m')
  console.log('\x1b[33m╚═══════════════════════════════════════════╝\x1b[0m\n')
}

// ============================================================
// HASHING DE SENHA (PBKDF2 — nativo do Node.js)
// ============================================================
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password, stored) {
  const [salt, storedHash] = stored.split(':')
  if (!salt || !storedHash) return false
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  // Comparacao em tempo constante
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'))
  } catch { return false }
}

// Inicializa ao carregar o modulo
ensureUsersFile()

// ============================================================
// POST /api/auth/login
// ============================================================
router.post('/login', async (req, res) => {
  const { username, password, source } = req.body

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Usuario e senha sao obrigatorios' })
  }

  // Delay anti-brute-force (fixo, independente de sucesso/falha)
  await new Promise(r => setTimeout(r, 800))

  // ===== AUTENTICACAO LOCAL =====
  if (source === 'local' || !source) {
    try {
      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'))
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase())

      if (!user || !verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({ success: false, message: 'Usuario ou senha incorretos' })
      }

      const payload = {
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        source: 'local',
        sourceLabel: 'Banco de dados local',
      }

      const token = sign(payload, JWT_SECRET, JWT_EXPIRES)
      console.log(`[Auth] Login local: ${user.username} (${user.role})`)
      return res.json({ success: true, token, user: payload })
    } catch (err) {
      console.error('[Auth] Erro no login local:', err.message)
      return res.status(500).json({ success: false, message: 'Erro ao verificar credenciais locais' })
    }
  }

  // ===== AUTENTICACAO LDAP =====
  try {
    // Carrega config LDAP do servidor
    let ldapConfig = null
    if (fs.existsSync(LDAP_CONFIG_FILE)) {
      const configs = JSON.parse(fs.readFileSync(LDAP_CONFIG_FILE, 'utf8'))
      ldapConfig = configs.find(c => c.ativo === 'sim') || configs[0] || null
    }

    // Fallback para variaveis de ambiente se nao houver config salva
    if (!ldapConfig) {
      ldapConfig = {
        servidor: process.env.LDAP_URL?.replace('ldap://', '').split(':')[0] || '10.0.1.4',
        portaLdap: '389',
        baseDn: process.env.LDAP_BASE_DN || 'dc=grupoprestacon,dc=local',
        usarVinculacao: 'sim',
        rootDn: process.env.LDAP_BIND_DN || '',
        senha: process.env.LDAP_BIND_PASSWORD || '',
        filtroConexao: process.env.LDAP_SEARCH_FILTER || '(&(objectClass=user)(objectCategory=person))',
        campoLogin: process.env.LDAP_LOGIN_ATTRIBUTE || 'samaccountname',
      }
    }

    console.log(`[Auth] Login LDAP: "${username}" via ${ldapConfig.servidor}...`)

    // Bind direto com credenciais do usuario
    const { client: userClient, bindUsed } = await bindAsUser(ldapConfig, username, password)
    console.log(`[Auth] LDAP bind OK com: ${bindUsed}`)

    // Busca dados extras do usuario
    let userData = { username, displayName: username, email: '', department: '', title: '', dn: '' }

    try {
      const info = await searchUserData(userClient, ldapConfig, username)
      if (info) {
        userData = {
          username: info.sAMAccountName || username,
          displayName: info.displayName || info.cn || username,
          email: info.mail || '',
          department: info.department || '',
          title: info.title || '',
          dn: info.dn || '',
        }

        // Verifica grupo AD (lanca erro se nao pertencer)
        checkGroupMembership(ldapConfig, info.memberOf, username)
      } else if (ldapConfig.grupoAD) {
        userClient.unbind(() => {}); userClient.destroy()
        return res.status(403).json({
          success: false,
          message: 'Nao foi possivel verificar sua permissao de acesso. Contate o administrador.',
        })
      }
    } catch (groupErr) {
      userClient.unbind(() => {}); userClient.destroy()
      if (groupErr.message.includes('Acesso negado')) {
        return res.status(403).json({ success: false, message: groupErr.message })
      }
      console.log(`[Auth] Busca de dados falhou: ${groupErr.message} — continuando com dados basicos`)
    }

    userClient.unbind(() => {}); userClient.destroy()

    const payload = {
      username: userData.username,
      displayName: userData.displayName,
      email: userData.email,
      department: userData.department,
      title: userData.title,
      role: 'user',
      source,
      sourceLabel: 'IPECONECT',
    }

    const token = sign(payload, JWT_SECRET, JWT_EXPIRES)
    console.log(`[Auth] Login LDAP bem-sucedido: ${userData.displayName}`)
    return res.json({ success: true, token, user: payload })
  } catch (err) {
    console.error(`[Auth] Falha LDAP para "${username}":`, err.message)

    if (err.message.includes('fetch') || err.message.includes('ECONNREFUSED')) {
      return res.status(503).json({
        success: false,
        message: 'Servidor LDAP indisponivel. Use o banco local como alternativa.',
      })
    }

    return res.status(401).json({ success: false, message: err.message })
  }
})

// ============================================================
// GET /api/auth/me — retorna dados do usuario autenticado
// ============================================================
router.get('/me', (req, res) => {
  // req.user ja foi preenchido pelo middleware JWT
  res.json({ success: true, user: req.user })
})

// ============================================================
// GET /api/auth/users — lista usuarios locais (admin only)
// POST /api/auth/users — cria usuario local (admin only)
// DELETE /api/auth/users/:username — remove usuario local (admin only)
// ============================================================
router.get('/users', (req, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Acesso restrito a administradores' })
  }
  try {
    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'))
    const safe = users.map(({ passwordHash, ...u }) => u)
    res.json({ success: true, users: safe })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

router.post('/users', (req, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Acesso restrito a administradores' })
  }

  const { username, password, displayName, email, role } = req.body
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username e senha sao obrigatorios' })
  }

  try {
    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'))

    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return res.status(409).json({ success: false, message: 'Usuario ja existe' })
    }

    const newUser = {
      username: username.toLowerCase(),
      passwordHash: hashPassword(password),
      displayName: displayName || username,
      email: email || '',
      role: role === 'admin' ? 'admin' : 'user',
    }

    users.push(newUser)
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8')

    console.log(`[Auth] Usuario criado: ${newUser.username} (${newUser.role}) por ${req.user.username}`)
    const { passwordHash, ...safe } = newUser
    res.json({ success: true, user: safe })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

router.post('/users/:username/senha', (req, res) => {
  const { username } = req.params
  const { senhaAtual, novaSenha } = req.body

  // Admins podem mudar senha de qualquer um; usuarios so a propria
  const isAdmin = req.user?.role === 'admin'
  const isSelf = req.user?.username === username

  if (!isAdmin && !isSelf) {
    return res.status(403).json({ success: false, message: 'Sem permissao para alterar esta senha' })
  }

  if (!novaSenha || novaSenha.length < 6) {
    return res.status(400).json({ success: false, message: 'Nova senha deve ter pelo menos 6 caracteres' })
  }

  try {
    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'))
    const idx = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase())

    if (idx === -1) return res.status(404).json({ success: false, message: 'Usuario nao encontrado' })

    // Se nao e admin, verifica senha atual
    if (!isAdmin && !verifyPassword(senhaAtual || '', users[idx].passwordHash)) {
      return res.status(401).json({ success: false, message: 'Senha atual incorreta' })
    }

    users[idx].passwordHash = hashPassword(novaSenha)
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8')

    console.log(`[Auth] Senha alterada: ${username} por ${req.user.username}`)
    res.json({ success: true, message: 'Senha alterada com sucesso' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

router.delete('/users/:username', (req, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Acesso restrito a administradores' })
  }

  const { username } = req.params

  if (username === req.user.username) {
    return res.status(400).json({ success: false, message: 'Nao e possivel remover o proprio usuario' })
  }

  try {
    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'))
    const filtered = users.filter(u => u.username.toLowerCase() !== username.toLowerCase())

    if (filtered.length === users.length) {
      return res.status(404).json({ success: false, message: 'Usuario nao encontrado' })
    }

    fs.writeFileSync(USERS_FILE, JSON.stringify(filtered, null, 2), 'utf8')
    console.log(`[Auth] Usuario removido: ${username} por ${req.user.username}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

export default router
