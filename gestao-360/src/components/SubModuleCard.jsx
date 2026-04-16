import { ArrowRight, Construction } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function SubModuleCard({ title, description, icon: Icon, path, color, bgColor, index }) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(path)}
      className="
        group relative bg-white rounded-2xl border border-slate-200/60
        p-6 cursor-pointer transition-all duration-300
        hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300/60
        hover:-translate-y-1
      "
    >
      {/* Numero do sub-modulo */}
      <div className="absolute top-4 right-4 text-[11px] font-bold text-slate-200 uppercase tracking-wider">
        #{String(index + 1).padStart(2, '0')}
      </div>

      {/* Icone */}
      <div className={`
        w-12 h-12 rounded-xl ${bgColor || 'bg-slate-50'}
        flex items-center justify-center mb-4
        group-hover:scale-110 transition-transform duration-300
      `}>
        <Icon className={`w-6 h-6 ${color || 'text-slate-400'}`} />
      </div>

      {/* Conteudo */}
      <h3 className="text-base font-semibold text-slate-900 mb-1">
        {title}
      </h3>
      <p className="text-sm text-slate-500 mb-5 leading-relaxed">
        {description}
      </p>

      {/* Status */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-50 text-accent-700 rounded-lg text-xs font-medium">
          <Construction className="w-3.5 h-3.5" />
          Em desenvolvimento
        </div>

        <div className="
          flex items-center gap-1 text-sm font-medium
          text-primary-500 group-hover:text-primary-600
        ">
          <span className="text-xs">Acessar</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  )
}
