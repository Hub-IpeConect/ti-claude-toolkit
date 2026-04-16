import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

/**
 * Origens de login disponiveis.
 * A primeira e sempre o banco local (fallback se o AD estiver fora).
 * As demais vem da configuracao LDAP salva.
 *
 * Futuramente isso sera carregado da API/backend.
 */
const loginSources = [
  { key: 'local', label: 'Banco de dados local', type: 'local' },
  { key: 'ipeconect', label: 'IPECONECT', type: 'ldap' },
]

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // Verifica se existe sessao salva ao carregar
  useEffect(() => {
    const savedUser = sessionStorage.getItem('gestao360_user')
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser)
        setUser(parsed)
        setIsAuthenticated(true)
      } catch (e) {
        sessionStorage.removeItem('gestao360_user')
      }
    }
    setLoading(false)
  }, [])

  /**
   * Realiza o login.
   * Futuramente, fara chamada ao backend que valida no AD ou banco local.
   * Por enquanto simula a autenticacao.
   */
  /**
   * Usuarios do banco local.
   * Futuramente sera substituido por um backend real com banco de dados.
   */
  const localUsers = [
    {
      username: 'admin',
      password: 'admin',
      displayName: 'Administrador',
      email: 'admin@ipeconect.com.br',
      role: 'admin',
    },
  ]

  const login = async (username, password, source) => {
    // Simula delay de autenticacao
    await new Promise(resolve => setTimeout(resolve, 1200))

    if (!username || !password) {
      throw new Error('Usuario e senha sao obrigatorios')
    }

    // Autenticacao via banco local
    if (source === 'local') {
      const localUser = localUsers.find(
        u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
      )
      if (!localUser) {
        throw new Error('Usuario ou senha incorretos')
      }
    }

    // Autenticacao via LDAP/AD
    if (source !== 'local') {
      try {
        // Carrega a config LDAP salva para enviar grupoAD e demais campos
        let ldapConfig = null
        try {
          const savedConfigs = localStorage.getItem('gestao360_ldap_configs')
          if (savedConfigs) {
            const configs = JSON.parse(savedConfigs)
            // Busca a config ativa (servidor padrao = sim) ou a primeira
            ldapConfig = configs.find(c => c.ativo === 'sim') || configs[0] || null
          }
        } catch (e) { /* ignora erro de parse */ }

        const response = await fetch('/api/ldap/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, ldapConfig }),
        })

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.message || 'Falha na autenticacao LDAP')
        }

        // Login AD bem-sucedido
        const userData = {
          username: data.user.username,
          displayName: data.user.displayName,
          email: data.user.email,
          department: data.user.department,
          title: data.user.title,
          role: 'user',
          source: source,
          sourceLabel: loginSources.find(s => s.key === source)?.label || source,
          loginAt: new Date().toISOString(),
        }

        setUser(userData)
        setIsAuthenticated(true)
        sessionStorage.setItem('gestao360_user', JSON.stringify(userData))
        return userData
      } catch (err) {
        if (err.message.includes('fetch')) {
          throw new Error('Backend indisponivel. Verifique se o servidor esta rodando ou use o banco local.')
        }
        throw err
      }
    }

    // Login local bem-sucedido
    const localUser = localUsers.find(
      u => u.username.toLowerCase() === username.toLowerCase()
    )

    const userData = {
      username,
      displayName: localUser?.displayName || username.charAt(0).toUpperCase() + username.slice(1),
      email: localUser?.email || `${username}@ipeconect.com.br`,
      role: localUser?.role || 'user',
      source: source,
      sourceLabel: loginSources.find(s => s.key === source)?.label || source,
      loginAt: new Date().toISOString(),
    }

    setUser(userData)
    setIsAuthenticated(true)
    sessionStorage.setItem('gestao360_user', JSON.stringify(userData))

    return userData
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    sessionStorage.removeItem('gestao360_user')
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      loading,
      login,
      logout,
      loginSources,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
