import Header from '@components/Header'
import SubModuleCard from '@components/SubModuleCard'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

/**
 * Pagina de modulo - exibe os 3 sub-modulos do modulo selecionado.
 */
export default function ModulePage({ moduleConfig }) {
  const navigate = useNavigate()
  const { title, description, icon: Icon, color, bgColor, subModules, path } = moduleConfig

  return (
    <div>
      <Header title={title} subtitle={description} />

      <main className="p-8">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Painel
        </button>

        {/* Banner do modulo */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 mb-6 flex items-center gap-5">
          <div className={`
            w-16 h-16 rounded-2xl ${bgColor}
            flex items-center justify-center flex-shrink-0
          `}>
            <Icon className={`w-8 h-8 ${color}`} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Modulo {title}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{description}</p>
          </div>
        </div>

        {/* Titulo da secao */}
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Sub-modulos</h3>
          <p className="text-sm text-slate-500">Selecione um sub-modulo para acessar</p>
        </div>

        {/* Grid de sub-modulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {subModules.map((sub, index) => (
            <SubModuleCard
              key={sub.key}
              title={sub.title}
              description={sub.description}
              icon={sub.icon}
              path={`${path}/${sub.key}`}
              color={color}
              bgColor={bgColor}
              index={index}
            />
          ))}
        </div>
      </main>
    </div>
  )
}
