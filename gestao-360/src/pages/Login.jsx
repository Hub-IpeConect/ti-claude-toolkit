import { useState } from 'react'
import { useAuth } from '@hooks/useAuth'
import { Eye, EyeOff, Loader2, AlertCircle, ChevronDown } from 'lucide-react'
import IpeconectLogo from '@components/IpeconectLogo'

export default function Login() {
  const { login, loginSources } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [source, setSource] = useState(loginSources[1]?.key || loginSources[0]?.key)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sourceOpen, setSourceOpen] = useState(false)

  const selectedSource = loginSources.find(s => s.key === source)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(username, password, source)
    } catch (err) {
      setError(err.message || 'Erro ao autenticar. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Grafismos de fundo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg className="absolute -top-20 -right-20 w-96 h-96 text-primary-500 opacity-[0.04]" viewBox="0 0 200 200">
          <path d="M20 160 L100 20 L180 160 Q180 180 160 180 L40 180 Q20 180 20 160Z" fill="currentColor" />
        </svg>
        <svg className="absolute -bottom-16 -left-16 w-80 h-80 text-accent-400 opacity-[0.05]" viewBox="0 0 200 200">
          <path d="M20 160 L100 20 L180 160 Q180 180 160 180 L40 180 Q20 180 20 160Z" fill="currentColor" />
        </svg>
        <svg className="absolute top-1/3 left-10 w-32 h-32 text-primary-300 opacity-[0.03] rotate-45" viewBox="0 0 200 200">
          <path d="M20 160 L100 20 L180 160 Q180 180 160 180 L40 180 Q20 180 20 160Z" fill="currentColor" />
        </svg>
      </div>

      {/* Card de login */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <IpeconectLogo height={48} darkText={false} />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-2">
            <h1 className="text-xl font-bold text-slate-900 text-center">
              Faca login para sua conta
            </h1>
            <div className="w-16 h-0.5 bg-accent-400 mx-auto mt-3 rounded-full" />
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-5">
            {/* Erro */}
            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Usuario */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Seu usuario"
                autoComplete="username"
                autoFocus
                className="
                  w-full px-4 py-3 text-sm rounded-xl
                  bg-white border border-slate-200
                  focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
                  placeholder:text-slate-300 transition-all
                "
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  autoComplete="current-password"
                  className="
                    w-full px-4 py-3 pr-11 text-sm rounded-xl
                    bg-white border border-slate-200
                    focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
                    placeholder:text-slate-300 transition-all
                  "
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Origem de login */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Origem de login
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSourceOpen(!sourceOpen)}
                  className="
                    w-full px-4 py-3 text-sm rounded-xl text-left
                    bg-white border border-slate-200
                    focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
                    transition-all flex items-center justify-between
                  "
                >
                  <span className={selectedSource ? 'text-slate-900' : 'text-slate-300'}>
                    {selectedSource?.label || 'Selecione a origem'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${sourceOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {sourceOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 z-20 overflow-hidden">
                    {loginSources.map((src) => (
                      <button
                        key={src.key}
                        type="button"
                        onClick={() => {
                          setSource(src.key)
                          setSourceOpen(false)
                        }}
                        className={`
                          w-full text-left px-4 py-3 text-sm transition-colors
                          flex items-center justify-between
                          ${source === src.key
                            ? 'bg-accent-400 text-white font-medium'
                            : 'text-slate-700 hover:bg-slate-50'
                          }
                        `}
                      >
                        <span>{src.label}</span>
                        {src.type === 'ldap' && source !== src.key && (
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">AD</span>
                        )}
                        {src.type === 'local' && source !== src.key && (
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Local</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                {selectedSource?.type === 'ldap'
                  ? 'Autenticacao via Active Directory'
                  : 'Autenticacao via banco de dados local do sistema'
                }
              </p>
            </div>

            {/* Botao de login */}
            <button
              type="submit"
              disabled={loading || !username || !password}
              className="
                w-full py-3 px-4 rounded-xl text-sm font-semibold
                bg-gradient-to-r from-primary-500 to-primary-600
                text-white shadow-lg shadow-primary-500/20
                hover:from-primary-600 hover:to-primary-700
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all flex items-center justify-center gap-2
              "
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Autenticando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Gestao 360° &copy; {new Date().getFullYear()} Ipeconect. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
