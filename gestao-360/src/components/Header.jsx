import { Bell, Search, Moon, Sun, Menu } from 'lucide-react'
import { useState } from 'react'

export default function Header({ title, subtitle }) {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200/60">
      <div className="flex items-center justify-between px-8 py-4">
        {/* Titulo da pagina */}
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Acoes do header */}
        <div className="flex items-center gap-2">
          {/* Busca */}
          <div className={`
            flex items-center transition-all duration-300
            ${searchOpen ? 'w-64' : 'w-10'}
          `}>
            {searchOpen && (
              <input
                type="text"
                placeholder="Buscar..."
                className="
                  w-full px-4 py-2 text-sm rounded-xl
                  bg-slate-100 border border-slate-200
                  focus:outline-none focus:ring-2 focus:ring-primary-500/30
                  focus:border-primary-500 transition-all
                "
                autoFocus
                onBlur={() => setSearchOpen(false)}
              />
            )}
            {!searchOpen && (
              <button
                onClick={() => setSearchOpen(true)}
                className="
                  w-10 h-10 rounded-xl bg-slate-100
                  flex items-center justify-center
                  hover:bg-slate-200 transition-colors
                  text-slate-500 hover:text-slate-700
                "
              >
                <Search className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Notificacoes */}
          <button className="
            relative w-10 h-10 rounded-xl bg-slate-100
            flex items-center justify-center
            hover:bg-slate-200 transition-colors
            text-slate-500 hover:text-slate-700
          ">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full" />
          </button>
        </div>
      </div>
    </header>
  )
}
