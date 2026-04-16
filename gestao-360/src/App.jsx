import { Routes, Route } from 'react-router-dom'
import Sidebar from '@components/Sidebar'
import Home from '@pages/Home'
import ModulePage from '@pages/ModulePage'
import SubModulePage from '@pages/SubModulePage'
import LdapConfig from '@pages/LdapConfig'
import RelatoriosProcessuais from '@pages/RelatoriosProcessuais'
import OpenSquadPage from '@pages/OpenSquadPage'
import Login from '@pages/Login'
import { useSidebar } from '@hooks/useSidebar'
import { useAuth } from '@hooks/useAuth'
import { modulesConfig } from '@/config/modules'
import { Loader2 } from 'lucide-react'

function App() {
  const { collapsed } = useSidebar()
  const { isAuthenticated, loading } = useAuth()

  // Tela de carregamento enquanto verifica sessao
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  // Se nao autenticado, mostra tela de login
  if (!isAuthenticated) {
    return <Login />
  }

  // App autenticado
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar fixa */}
      <Sidebar />

      {/* Area de conteudo principal - reage ao colapso da sidebar */}
      <div className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-72'}`}>
        <Routes>
          <Route path="/" element={<Home />} />

          {/* Rotas dos modulos */}
          {modulesConfig.map((module) => (
            <Route
              key={module.key}
              path={module.path}
              element={<ModulePage moduleConfig={module} />}
            />
          ))}

          {/* Rotas customizadas de sub-modulos */}
          <Route path="/configuracao/autenticacao" element={<LdapConfig />} />
          <Route path="/juridico/relatorios-processuais" element={<RelatoriosProcessuais />} />
          <Route path="/marketing/opensquad" element={<OpenSquadPage />} />

          {/* Rotas genericas dos sub-modulos: /:moduleKey/:subKey */}
          <Route path="/:moduleKey/:subKey" element={<SubModulePage />} />

          {/* Rota 404 */}
          <Route
            path="*"
            element={
              <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-slate-200">404</h1>
                  <p className="text-slate-500 mt-2">Pagina nao encontrada</p>
                </div>
              </div>
            }
          />
        </Routes>
      </div>
    </div>
  )
}

export default App
