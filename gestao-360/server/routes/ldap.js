import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createLdapClient, bindAsUser, searchUserData, checkGroupMembership } from '../lib/ldapAuth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()

const DATA_DIR = path.join(__dirname, '..', 'data')
const LDAP_CONFIG_FILE = path.join(DATA_DIR, 'ldap-config.json')

// ============================================================
// LDAP CONFIG — leitura e gravacao no servidor
// ============================================================

function readLdapConfigs() {
  if (!fs.existsSync(LDAP_CONFIG_FILE)) {
    // Cria configuracao inicial a partir das variaveis de ambiente
    const defaults = [{
      id: 1,
      nome: 'IPECONECT',
      servidorPadrao: 'sim',
      ativo: 'sim',
      servidor: process.env.LDAP_URL?.replace('ldap://', '').split(':')[0] || '10.0.1.4',
      portaLdap: '389',
      comentarios: '',
      filtroConexao: process.env.LDAP_SEARCH_FILTER ||
        '(&(objectClass=user)(objectCategory=person)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))',
      baseDn: process.env.LDAP_BASE_DN || 'dc=grupoprestacon,dc=local',
      usarVinculacao: 'sim',
      rootDn: process.env.LDAP_BIND_DN || '',
      senha: process.env.LDAP_BIND_PASSWORD || '',
      campoLogin: process.env.LDAP_LOGIN_ATTRIBUTE || 'samaccountname',
      campoSincronizacao: '',
      grupoAD: '',
    }]
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.writeFileSync(LDAP_CONFIG_FILE, JSON.stringify(defaults, null, 2), 'utf8')
    console.log('[LDAP] Arquivo de config criado com valores padrao do .env')
    return defaults
  }
  return JSON.parse(fs.readFileSync(LDAP_CONFIG_FILE, 'utf8'))
}

// GET /api/ldap/config — admin only
router.get('/config', (req, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Acesso restrito a administradores' })
  }
  try {
    const configs = readLdapConfigs()
    res.json({ success: true, configs })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// POST /api/ldap/config — admin only
router.post('/config', (req, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Acesso restrito a administradores' })
  }
  const { configs } = req.body
  if (!Array.isArray(configs)) {
    return res.status(400).json({ success: false, message: 'configs deve ser um array' })
  }
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.writeFileSync(LDAP_CONFIG_FILE, JSON.stringify(configs, null, 2), 'utf8')
    console.log(`[LDAP] Config salva por ${req.user.username}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ============================================================
// POST /api/ldap/test — testa conexao LDAP (admin only)
// ============================================================
router.post('/test', async (req, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Acesso restrito a administradores' })
  }

  const config = req.body
  if (!config.servidor) {
    return res.status(400).json({ success: false, message: 'Endereco do servidor e obrigatorio' })
  }

  let client = null
  try {
    console.log(`[LDAP Test] Conectando a ${config.servidor}:${config.portaLdap || 389}...`)
    client = await createLdapClient(config)
    console.log('[LDAP Test] Bind realizado com sucesso!')

    let userCount = 0
    if (config.baseDn) {
      try {
        const opts = {
          filter: config.filtroConexao || '(objectClass=user)',
          scope: 'sub',
          sizeLimit: 10,
          attributes: ['sAMAccountName', 'cn', 'mail'],
        }

        const entries = await new Promise((resolve, reject) => {
          const results = []
          client.search(config.baseDn, opts, (err, searchRes) => {
            if (err) { reject(new Error(`Erro na busca: ${err.message}`)); return }

            searchRes.on('searchEntry', entry => results.push({ dn: entry.dn.toString() }))
            searchRes.on('error', err => {
              if (err.name === 'SizeLimitExceededError' || err.message?.includes('Size Limit')) {
                resolve(results); return
              }
              if (err.message?.includes('Operations Error')) { resolve(results); return }
              reject(new Error(`Erro na busca LDAP: ${err.message}`))
            })
            searchRes.on('end', () => resolve(results))
          })
        })

        userCount = entries.length
        console.log(`[LDAP Test] Encontrados ${userCount} usuarios`)
      } catch (searchErr) {
        console.log(`[LDAP Test] Busca falhou (${searchErr.message}), mas bind OK`)
        userCount = -1
      }
    }

    res.json({
      success: true,
      message: userCount === -1
        ? 'Conexao e autenticacao OK! Busca de usuarios limitada pelo AD.'
        : 'Conexao realizada com sucesso!',
      details: {
        servidor: config.servidor,
        porta: config.portaLdap || 389,
        baseDn: config.baseDn,
        bind: config.usarVinculacao === 'sim' ? 'Autenticado' : 'Anonimo',
        usuariosEncontrados: userCount === -1 ? 'N/A (restrito pelo AD)' : userCount,
      },
    })
  } catch (error) {
    console.error('[LDAP Test] Erro:', error.message)
    res.status(500).json({ success: false, message: error.message })
  } finally {
    if (client) { client.unbind(() => {}); client.destroy() }
  }
})

// ============================================================
// POST /api/ldap/auth — mantido como fallback interno
// (o login agora passa por /api/auth/login, mas este endpoint
//  permanece por compatibilidade)
// ============================================================
router.post('/auth', async (req, res) => {
  const { username, password, ldapConfig } = req.body

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Usuario e senha sao obrigatorios' })
  }

  const config = ldapConfig || readLdapConfigs().find(c => c.ativo === 'sim') || readLdapConfigs()[0]

  try {
    console.log(`[LDAP Auth] Autenticando "${username}" via ${config.servidor}...`)

    const { client: userClient, bindUsed } = await bindAsUser(config, username, password)
    console.log(`[LDAP Auth] Bind OK: ${bindUsed}`)

    let userData = { username, displayName: username, email: '', department: '', title: '', dn: '' }

    try {
      const info = await searchUserData(userClient, config, username)
      if (info) {
        userData = {
          username: info.sAMAccountName || username,
          displayName: info.displayName || info.cn || username,
          email: info.mail || '',
          department: info.department || '',
          title: info.title || '',
          dn: info.dn || '',
        }
        checkGroupMembership(config, info.memberOf, username)
      } else if (config.grupoAD) {
        userClient.unbind(() => {}); userClient.destroy()
        return res.status(403).json({ success: false, message: 'Nao foi possivel verificar sua permissao de acesso.' })
      }
    } catch (groupErr) {
      userClient.unbind(() => {}); userClient.destroy()
      if (groupErr.message.includes('Acesso negado')) {
        return res.status(403).json({ success: false, message: groupErr.message })
      }
      console.log(`[LDAP Auth] Busca falhou: ${groupErr.message}`)
    }

    userClient.unbind(() => {}); userClient.destroy()
    console.log(`[LDAP Auth] Sucesso: ${userData.displayName}`)
    res.json({ success: true, user: { ...userData, source: 'ldap' } })
  } catch (error) {
    console.error(`[LDAP Auth] Falha para "${username}":`, error.message)
    res.status(401).json({ success: false, message: error.message })
  }
})

export default router
