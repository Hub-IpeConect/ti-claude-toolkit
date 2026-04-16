import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatsCard({ title, value, change, changeType, icon: Icon, color, bgColor }) {
  const isPositive = changeType === 'positive'

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl ${bgColor} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>

      {change && (
        <div className="flex items-center gap-1.5 mt-3">
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-rose-500" />
          )}
          <span className={`text-sm font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {change}
          </span>
          <span className="text-xs text-slate-400">vs. mes anterior</span>
        </div>
      )}
    </div>
  )
}
