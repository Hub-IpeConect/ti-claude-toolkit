import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  User,
} from 'lucide-react'
import { useState } from 'react'
import { useSidebar } from '@hooks/useSidebar'
import { useAuth } from '@hooks/useAuth'
import { modulesConfig } from '@/config/modules'
import IpeconectLogo from '@components/IpeconectLogo'

// Grafismo da marca - triangulo inspirado no logo Ipeconect
function BrandTriangle({ className = '' }) {
  return (
    <svg viewBox="0 0 40 35" fill="currentColor" className={className}>
      <path d="M2 30 L20 3 L38 30 Q38 33 35 33 L5 33 Q2 33 2 30Z" opacity="0.07" />
    </svg>
  )
}

export default function Sidebar() {
  const { collapsed, toggle } = useSidebar()
  const { user, logout } = useAuth()
  const location = useLocation()
  const [expandedModule, setExpandedModule] = useState(null)

  // Verifica se estamos dentro de um modulo (para expandir automaticamente)
  const currentModuleKey = modulesConfig.find(m =>
    location.pathname.startsWith(m.path)
  )?.key

  const handleModuleClick = (key) => {
    if (collapsed) return // Nao expande quando colapsado
    setExpandedModule(prev => prev === key ? null : key)
  }

  // Expande automaticamente o modulo ativo
  const isExpanded = (key) => {
    if (collapsed) return false
    return expandedModule === key || currentModuleKey === key
  }

  return (
    <aside
      className={`
        fixed top-0 left-0 h-screen bg-sidebar-bg
        flex flex-col transition-all duration-300 ease-in-out z-50
        ${collapsed ? 'w-20' : 'w-72'}
        overflow-hidden
      `}
    >
      {/* Grafismo decorativo de fundo */}
      <div className="absolute bottom-0 right-0 text-primary-300 pointer-events-none">
        <BrandTriangle className="w-32 h-32 rotate-12" />
      </div>
      <div className="absolute top-20 -left-4 text-accent-400 pointer-events-none">
        <BrandTriangle className="w-16 h-16 -rotate-45" />
      </div>

      {/* Logo / Titulo */}
      <div className="flex items-center justify-center px-4 py-5 border-b border-white/5 relative">
        {collapsed ? (
          <IpeconectLogo height={34} white={true} onlyMark={true} />
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <IpeconectLogo height={34} white={true} />
            <span className="text-white/35 text-[10px] tracking-widest uppercase font-medium">
              Gestao 360°
            </span>
          </div>
        )}
      </div>

      {/* Navegacao */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto relative z-10">
        {/* Painel Inicial */}
        <div className={`${!collapsed ? 'px-2' : ''} mb-2`}>
          {!collapsed && (
            <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-text/50">
              Inicio
            </span>
          )}
        </div>

        <NavLink
          to="/"
          className={`
            group flex items-center gap-3 px-3 py-2.5 rounded-xl mb-3
            transition-all duration-200 relative
            ${location.pathname === '/'
              ? 'bg-primary-500/15 text-white'
              : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'
            }
            ${collapsed ? 'justify-center' : ''}
          `}
          title={collapsed ? 'Painel Inicial' : ''}
        >
          {location.pathname === '/' && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent-400 rounded-r-full" />
          )}
          <div className={`
            w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
            ${location.pathname === '/'
              ? 'bg-primary-500 text-white'
              : 'bg-white/5 text-sidebar-text group-hover:bg-white/10'
            }
          `}>
            <LayoutDashboard className="w-5 h-5" />
          </div>
          {!collapsed && (
            <span className="text-sm font-medium">Painel Inicial</span>
          )}
        </NavLink>

        {/* Separador - Modulos */}
        <div className={`${!collapsed ? 'px-2' : ''} mb-2 mt-4`}>
          {!collapsed && (
            <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-text/50">
              Modulos
            </span>
          )}
        </div>

        {/* Lista de modulos com sub-modulos */}
        <ul className="space-y-1">
          {modulesConfig.map((module) => {
            const Icon = module.icon
            const isActive = location.pathname.startsWith(module.path)
            const expanded = isExpanded(module.key)

            return (
              <li key={module.key}>
                {/* Item do modulo */}
                <div className="flex flex-col">
                  <NavLink
                    to={module.path}
                    onClick={(e) => {
                      if (!collapsed && module.subModules?.length > 0) {
                        handleModuleClick(module.key)
                      }
                    }}
                    className={`
                      group flex items-center gap-3 px-3 py-2.5 rounded-xl
                      transition-all duration-200 relative
                      ${isActive
                        ? 'bg-primary-500/15 text-white'
                        : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'
                      }
                      ${collapsed ? 'justify-center' : ''}
                    `}
                    title={collapsed ? module.title : ''}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent-400 rounded-r-full" />
                    )}

                    <div className={`
                      w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                      ${isActive
                        ? 'bg-primary-500 text-white'
                        : `${module.iconBg || 'bg-white/5'} ${module.iconColor || 'text-sidebar-text'} group-hover:bg-white/10`
                      }
                    `}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {!collapsed && (
                      <>
                        <div className="flex-1 overflow-hidden">
                          <span className="text-sm font-medium block">
                            {module.title}
                          </span>
                        </div>

                        {/* Seta de expandir */}
                        {module.subModules?.length > 0 && (
                          <ChevronDown
                            className={`
                              w-4 h-4 text-sidebar-text/50 transition-transform duration-200
                              ${expanded ? 'rotate-180' : ''}
                            `}
                          />
                        )}
                      </>
                    )}
                  </NavLink>

                  {/* Sub-modulos (expandiveis) */}
                  {!collapsed && expanded && module.subModules?.length > 0 && (
                    <ul className="mt-1 ml-6 pl-4 border-l border-white/5 space-y-0.5">
                      {module.subModules.map((sub) => {
                        const SubIcon = sub.icon
                        const subPath = `${module.path}/${sub.key}`
                        const isSubActive = location.pathname === subPath

                        return (
                          <li key={sub.key}>
                            <NavLink
                              to={subPath}
                              className={`
                                group flex items-center gap-2.5 px-3 py-2 rounded-lg
                                transition-all duration-200 text-sm
                                ${isSubActive
                                  ? 'bg-primary-500/10 text-white font-medium'
                                  : 'text-sidebar-text/70 hover:bg-sidebar-hover hover:text-white'
                                }
                              `}
                            >
                              <SubIcon className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{sub.title}</span>
                              {sub.defined && (
                                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-400 flex-shrink-0" />
                              )}
                            </NavLink>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer da sidebar */}
      <div className="border-t border-white/5 p-3 relative z-10">
        {/* Perfil do usuario */}
        <div className={`
          flex items-center gap-3 px-3 py-2.5 rounded-xl
          hover:bg-sidebar-hover transition-colors cursor-pointer
          ${collapsed ? 'justify-center' : ''}
        `}>
          <div className="w-9 h-9 rounded-full bg-accent-400/20 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-accent-400" />
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">
                {user?.displayName || 'Usuario'}
              </p>
              <p className="text-[11px] text-sidebar-text truncate">
                {user?.sourceLabel || 'Local'}
              </p>
            </div>
          )}
          {!collapsed && (
            <button onClick={logout} title="Sair">
              <LogOut className="w-4 h-4 text-sidebar-text hover:text-white cursor-pointer" />
            </button>
          )}
        </div>

        {/* Botao colapsar */}
        <button
          onClick={toggle}
          className="
            mt-2 w-full flex items-center justify-center gap-2 py-2
            text-sidebar-text hover:text-white hover:bg-sidebar-hover
            rounded-lg transition-colors text-xs
          "
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Recolher menu</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
