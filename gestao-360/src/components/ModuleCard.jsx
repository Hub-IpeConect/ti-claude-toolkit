import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function ModuleCard({ title, description, icon: Icon, path, color, bgColor, stats }) {
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
      {/* Icone do modulo */}
      <div className={`
        w-14 h-14 rounded-2xl ${bgColor}
        flex items-center justify-center mb-4
        group-hover:scale-110 transition-transform duration-300
      `}>
        <Icon className={`w-7 h-7 ${color}`} />
      </div>

      {/* Conteudo */}
      <h3 className="text-lg font-semibold text-slate-900 mb-1">
        {title}
      </h3>
      <p className="text-sm text-slate-500 mb-4 leading-relaxed">
        {description}
      </p>

      {/* Stats */}
      {stats && (
        <div className="flex gap-4 mb-4">
          {stats.map((stat, index) => (
            <div key={index}>
              <p className="text-xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-[11px] text-slate-400 uppercase tracking-wide">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Link */}
      <div className="
        flex items-center gap-1 text-sm font-medium
        text-primary-600 group-hover:text-primary-700
      ">
        <span>Acessar modulo</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  )
}
