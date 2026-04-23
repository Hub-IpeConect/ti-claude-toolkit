/**
 * Funcoes compartilhadas de autenticacao LDAP.
 * Usadas em server/routes/ldap.js e server/routes/auth.js.
 */
import ldap from 'ldapjs'

/**
 * Cria cliente LDAP e faz bind com credenciais de servico (rootDN).
 */
export function createLdapClient(config) {
  return new Promise((resolve, reject) => {
    const url = `ldap://${config.servidor}:${config.portaLdap || 389}`
    const client = ldap.createClient({ url, connectTimeout: 10000, timeout: 15000 })

    client.on('error', err => reject(new Error(`Falha ao conectar em ${url}: ${err.message}`)))
    client.on('connectError', err => reject(new Error(`Servidor inacessivel ${url}: ${err.message}`)))

    if (config.usarVinculacao === 'sim' && config.rootDn) {
      client.bind(config.rootDn, config.senha || '', err => {
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
 * Faz bind direto com as credenciais do usuario no AD.
 * Tenta usuario@dominio e depois DOMINIO\usuario.
 */
export function bindAsUser(config, username, password) {
  return new Promise((resolve, reject) => {
    const url = `ldap://${config.servidor}:${config.portaLdap || 389}`

    const client = ldap.createClient({ url, connectTimeout: 10000, timeout: 15000 })
    client.on('error', err => reject(new Error(`Erro de conexao: ${err.message}`)))

    const domainParts = (config.baseDn || '')
      .split(',')
      .filter(p => p.trim().toLowerCase().startsWith('dc='))
      .map(p => p.split('=')[1])
    const domain = domainParts.join('.')

    const bindDNs = [
      `${username}@${domain}`,
      `${domainParts[0] || 'dominio'}\\${username}`,
    ]

    client.bind(bindDNs[0], password, err => {
      if (!err) { resolve({ client, bindUsed: bindDNs[0] }); return }

      const client2 = ldap.createClient({ url, connectTimeout: 10000, timeout: 15000 })
      client2.on('error', () => {})
      client.destroy()

      client2.bind(bindDNs[1], password, err2 => {
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
 * Busca dados do usuario no LDAP apos bind.
 * Retorna objeto com username, displayName, email, department, title, dn, memberOf.
 */
export function searchUserData(client, config, username) {
  return new Promise((resolve, reject) => {
    const loginAttr = config.campoLogin || 'sAMAccountName'
    const filter = `(&(objectClass=user)(${loginAttr}=${username}))`

    client.search(config.baseDn, {
      filter,
      scope: 'sub',
      sizeLimit: 1,
      attributes: ['dn', 'cn', 'sAMAccountName', 'mail', 'displayName', 'department', 'title', 'memberOf'],
    }, (err, searchRes) => {
      if (err) { reject(err); return }

      let found = null
      searchRes.on('searchEntry', entry => {
        const attrs = {}
        if (entry.attributes) {
          entry.attributes.forEach(attr => {
            attrs[attr.type] = attr.values?.length > 1 ? attr.values : (attr.values?.[0] || '')
          })
        }
        found = { dn: entry.dn.toString(), ...attrs }
      })
      searchRes.on('error', err => {
        console.log(`[LDAP] Busca de dados falhou: ${err.message}`)
        resolve(null)
      })
      searchRes.on('end', () => resolve(found))
    })
  })
}

/**
 * Verifica se o usuario pertence ao grupoAD configurado.
 * Retorna true se nao ha restricao ou se pertence. Lanca erro se nao pertencer.
 */
export function checkGroupMembership(config, memberOf, username) {
  if (!config.grupoAD) return true

  const grupoAD = config.grupoAD.trim().toLowerCase()
  let groups = memberOf || []
  if (typeof groups === 'string') groups = [groups]

  const ok = groups.some(g => g.toLowerCase() === grupoAD)
  if (!ok) {
    throw new Error('Acesso negado. Voce nao pertence ao grupo autorizado para acessar o sistema.')
  }
  return true
}
