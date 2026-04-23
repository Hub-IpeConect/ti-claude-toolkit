import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

/**
 * Origens de login disponiveis.
 * 'local' = banco de usuarios interno (server/data/users.json)
 * 'ipeconect' = Active Directory via LDAP (config em server/data/ldap-config.json)
 */
const loginSources = [
  { key: 'local',     label: 'Banco de dados local', type: 'local' },
  { key: 'ipeconect', label: 'IPECONECT',            type: 'ldap' },
]

export function AuthProvider({ children }) {
  const [user,            setUser]            = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading,         setLoading]         = useState(true)

  // Restaura sessao salva ao carregar a pagina
  useEffect(() => {
    const savedUser  = sessionStorage.getItem('gestao360_user')
    const savedToken = sessionStorage.getItem('gestao360_token')
    if (savedUser && savedToken) {
      try {
        const parsed = JSON.parse(savedUser)
        setUser(parsed)
        setIsAuthenticated(true)
      } catch {
        sessionStorage.removeItem('gestao360_user')
        sessionStorage.removeItem('gestao360_token')
      }
    }
    setLoading(false)
  }, [])

  /**
   * Realiza o login via API unificada (/api/auth/login).
   * Toda a logica de usuarios locais e LDAP fica no backend.
   */
  const login = async (username, password, source) => {
    if (!username || !password) {
      throw new Error('Usuario e senha sao obrigatorios')
    }

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, source }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Falha na autenticacao')
    }

    // Salva token JWT e dados do usuario
    const userData = {
      ...data.user,
      loginAt: new Date().toISOString(),
    }

    sessionStorage.setItem('gestao360_token', data.token)
    sessionStorage.setItem('gestao360_user',  JSON.stringify(userData))

    setUser(userData)
    setIsAuthenticated(true)

    return userData
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    sessionStorage.removeItem('gestao360_user')
    sessionStorage.removeItem('gestao360_token')
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
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return context
}
