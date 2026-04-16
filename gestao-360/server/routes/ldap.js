import { Router } from 'express'
import ldap from 'ldapjs'

const router = Router()

/**
 * Helper: cria um cliente LDAP e faz bind com as credenciais fornecidas.
 */
function createLdapClient(config) {
  return new Promise((resolve, reject) => {
    const url = `ldap://${config.servidor}:${config.portaLdap || 389}`

    const client = ldap.createClient({
      url,
      connectTimeout: 10000,
      timeout: 15000,
    })

    client.on('error', (err) => {
      reject(new Error(`Falha ao conectar em ${url}: ${err.message}`))
    })

    client.on('connectError', (err) => {
      reject(new Error(`Servidor inacessivel ${url}: ${err.message}`))
    })

    if (config.usarVinculacao === 'sim' && config.rootDn) {
      client.bind(config.rootDn, config.senha || '', (err) => {
        if (err) {
          client.destroy()
          reject(new Error(`Falha no bind com ${config.rootDn}: ${err.message}`))
        } else {
          resolve(client)
        }
      })
    } else {
      resolve(client)
    }
  })
}

/**
 * Helper: faz bind direto com credenciais do usuario no AD.
 * No AD, o usuario pode fazer bind com dominio\\usuario ou usuario@dominio.
 */
function bindAsUser(config, username, password) {
  return new Promise((resolve, reject) => {
    const url = `ldap://${config.servidor}:${config.portaLdap || 389}`

    const client = ldap.createClient({
      url,
      connectTimeout: 10000,
      timeout: 15000,
    })

    client.on('error', (err) => {
      reject(new Error(`Erro de conexao: ${err.message}`))
    })

    // Extrai o dominio do baseDN (dc=grupoprestacon,dc=local -> grupoprestacon.local)
    const domainParts = (config.baseDn || '')
      .split(',')
      .filter(p => p.trim().toLowerCase().startsWith('dc='))
      .map(p => p.split('=')[1])
    const domain = domainParts.join('.')

    // Tenta diferentes formatos de bind do AD
    const bindDNs = [
      `${username}@${domain}`,                              // usuario@dominio.local (UPN)
      `${domainParts[0] || 'dominio'}\\${username}`,        // DOMINIO\usuario (NetBIOS)
    ]

    // Tenta o primeiro formato
    client.bind(bindDNs[0], password, (err) => {
      if (!err) {
        resolve({ client, bindUsed: bindDNs[0] })
        return
      }

      // Se falhou, tenta o segundo formato
      const client2 = ldap.createClient({ url, connectTimeout: 10000, timeout: 15000 })
      client2.on('error', () => {})
      client.destroy()

      client2.bind(bindDNs[1], password, (err2) => {
        if (!err2) {
          resolve({ client: client2, bindUsed: bindDNs[1] })
        } else {
          client2.destroy()
          reject(new Error('Usuario ou senha incorretos'))
        }
      })
    })
  })
}

/**
 * POST /api/ldap/test
 * Testa a conexao com o servidor LDAP.
 */
router.post('/test', async (req, res) => {
  const config = req.body

  if (!config.servidor) {
    return res.status(400).json({
      success: false,
      message: 'Endereco do servidor e obrigatorio',
    })
  }

  let client = null

  try {
    console.log(`[LDAP Test] Conectando a ${config.servidor}:${config.portaLdap || 389}...`)

    client = await createLdapClient(config)
    console.log('[LDAP Test] Bind realizado com sucesso!')

    let userCount = 0
    if (config.baseDn) {
      try {
        const searchResult = await new Promise((resolve, reject) => {
          const opts = {
            filter: config.filtroConexao || '(objectClass=user)',
            scope: 'sub',
            sizeLimit: 10,
            attributes: ['sAMAccountName', 'cn', 'mail'],
          }

          client.search(config.baseDn, opts, (err, searchRes) => {
            if (err) {
              reject(new Error(`Erro na busca: ${err.message}`))
              return
            }

            const entries = []
            searchRes.on('searchEntry', (entry) => {
              entries.push({
                dn: entry.dn.toString(),
              })
            })

            searchRes.on('error', (err) => {
              // "Size Limit Exceeded" = ha mais usuarios que o limite, conexao OK
              if (err.name === 'SizeLimitExceededError' || err.message?.includes('Size Limit')) {
                console.log(`[LDAP Test] Limite de busca atingido - ${entries.length} usuarios ate agora`)
                resolve(entries)
                return
              }
              // "Operations Error" = comum no AD, mas bind funcionou
              if (err.message?.includes('Operations Error')) {
                console.log('[LDAP Test] Operations Error na busca (referral do AD) - bind OK')
                resolve(entries)
                return
              }
              reject(new Error(`Erro na busca LDAP: ${err.message}`))
            })

            searchRes.on('end', (result) => {
              resolve(entries)
            })
          })
        })

        userCount = searchResult.length
        console.log(`[LDAP Test] Encontrados ${userCount} usuarios`)
      } catch (searchErr) {
        // Se a busca falhou mas o bind funcionou, ainda e sucesso parcial
        console.log(`[LDAP Test] Busca falhou (${searchErr.message}), mas bind OK`)
        userCount = -1 // Indica que a busca nao foi possivel
      }
    }

    console.log('[LDAP Test] Teste concluido com sucesso!')

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
    res.status(500).json({
      success: false,
      message: error.message,
    })
  } finally {
    if (client) {
      client.unbind(() => {})
      client.destroy()
    }
  }
})

/**
 * POST /api/ldap/auth
 * Autentica um usuario no Active Directory via LDAP.
 * Estrategia: bind direto com as credenciais do usuario (mais confiavel no AD).
 *
 * Body: { username, password, ldapConfig? }
 */
router.post('/auth', async (req, res) => {
  const { username, password, ldapConfig } = req.body

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Usuario e senha sao obrigatorios',
    })
  }

  const config = ldapConfig || {
    servidor: process.env.LDAP_URL?.replace('ldap://', '').split(':')[0] || '10.0.1.4',
    portaLdap: '389',
    baseDn: process.env.LDAP_BASE_DN || 'dc=grupoprestacon,dc=local',
    usarVinculacao: 'sim',
    rootDn: process.env.LDAP_BIND_DN || '',
    senha: process.env.LDAP_BIND_PASSWORD || '',
    filtroConexao: process.env.LDAP_SEARCH_FILTER || '(&(objectClass=user)(objectCategory=person))',
    campoLogin: process.env.LDAP_LOGIN_ATTRIBUTE || 'samaccountname',
  }

  try {
    console.log(`[LDAP Auth] Autenticando "${username}" via ${config.servidor}...`)

    // PASSO 1: Bind direto com as credenciais do usuario
    // No AD, isso e a forma mais confiavel de autenticar
    const { client: userClient, bindUsed } = await bindAsUser(config, username, password)
    console.log(`[LDAP Auth] Bind do usuario OK com: ${bindUsed}`)

    // PASSO 2: Buscar dados do usuario (nome, email, departamento)
    let userData = {
      username: username,
      displayName: username,
      email: '',
      department: '',
      title: '',
      dn: '',
    }

    try {
      const loginAttr = config.campoLogin || 'sAMAccountName'
      const searchFilter = `(&(objectClass=user)(${loginAttr}=${username}))`

      const userInfo = await new Promise((resolve, reject) => {
        userClient.search(config.baseDn, {
          filter: searchFilter,
          scope: 'sub',
          sizeLimit: 1,
          attributes: ['dn', 'cn', 'sAMAccountName', 'mail', 'displayName', 'department', 'title', 'memberOf'],
        }, (err, searchRes) => {
          if (err) {
            reject(err)
            return
          }

          let found = null
          searchRes.on('searchEntry', (entry) => {
            const attrs = {}
            if (entry.attributes) {
              entry.attributes.forEach(attr => {
                attrs[attr.type] = attr.values?.length > 1 ? attr.values : (attr.values?.[0] || '')
              })
            }
            found = { dn: entry.dn.toString(), ...attrs }
          })

          searchRes.on('error', (err) => {
            // Se busca falhou mas bind OK, nao e critico
            console.log(`[LDAP Auth] Busca de dados falhou: ${err.message}`)
            resolve(null)
          })

          searchRes.on('end', () => resolve(found))
        })
      })

      if (userInfo) {
        userData = {
          username: userInfo.sAMAccountName || username,
          displayName: userInfo.displayName || userInfo.cn || username,
          email: userInfo.mail || '',
          department: userInfo.department || '',
          title: userInfo.title || '',
          dn: userInfo.dn || '',
        }
        console.log(`[LDAP Auth] Dados do usuario: ${userData.displayName} (${userData.email})`)

        // PASSO 3: Verificar se o usuario pertence ao grupo AD configurado
        if (config.grupoAD) {
          const grupoAD = config.grupoAD.trim().toLowerCase()
          // memberOf pode ser string (1 grupo) ou array (varios grupos)
          let memberOf = userInfo.memberOf || []
          if (typeof memberOf === 'string') {
            memberOf = [memberOf]
          }

          const pertenceAoGrupo = memberOf.some(
            grupo => grupo.toLowerCase() === grupoAD
          )

          if (!pertenceAoGrupo) {
            console.log(`[LDAP Auth] Usuario "${username}" NAO pertence ao grupo: ${config.grupoAD}`)
            console.log(`[LDAP Auth] Grupos do usuario:`, memberOf)
            userClient.unbind(() => {})
            userClient.destroy()
            return res.status(403).json({
              success: false,
              message: 'Acesso negado. Voce nao pertence ao grupo autorizado para acessar o sistema.',
            })
          }
          console.log(`[LDAP Auth] Usuario "${username}" pertence ao grupo autorizado!`)
        }
      } else {
        // Se nao conseguiu buscar dados e grupo e obrigatorio, bloqueia
        if (config.grupoAD) {
          console.log(`[LDAP Auth] Nao foi possivel verificar grupo do usuario "${username}" - acesso negado`)
          userClient.unbind(() => {})
          userClient.destroy()
          return res.status(403).json({
            success: false,
            message: 'Nao foi possivel verificar sua permissao de acesso. Contate o administrador.',
          })
        }
        console.log('[LDAP Auth] Nao conseguiu buscar dados extras, usando username como displayName')
      }
    } catch (searchErr) {
      // Se busca falhou e grupo e obrigatorio, bloqueia
      if (config.grupoAD) {
        console.log(`[LDAP Auth] Busca falhou e grupo obrigatorio - acesso negado: ${searchErr.message}`)
        userClient.unbind(() => {})
        userClient.destroy()
        return res.status(403).json({
          success: false,
          message: 'Nao foi possivel verificar sua permissao de acesso. Contate o administrador.',
        })
      }
      console.log(`[LDAP Auth] Busca de dados falhou: ${searchErr.message} - continuando com dados basicos`)
    }

    // Cleanup
    userClient.unbind(() => {})
    userClient.destroy()

    console.log(`[LDAP Auth] Autenticacao bem-sucedida para "${username}"!`)

    res.json({
      success: true,
      user: {
        ...userData,
        source: 'ldap',
      },
    })
  } catch (error) {
    console.error(`[LDAP Auth] Falha para "${username}":`, error.message)
    res.status(401).json({
      success: false,
      message: error.message,
    })
  }
})

export default router
