import Header from '@components/Header'
import { ArrowLeft, Construction, Zap } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { getModuleByKey, getSubModule } from '@/config/modules'

/**
 * Pagina de sub-modulo - placeholder para desenvolvimento futuro.
 * Cada sub-modulo sera desenvolvido independentemente.
 */
export default function SubModulePage() {
  const navigate = useNavigate()
  const { moduleKey, subKey } = useParams()

  const moduleConfig = getModuleByKey(moduleKey)
  const subModule = getSubModule(moduleKey, subKey)

  if (!moduleConfig || !subModule) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-slate-200">404</h1>
          <p className="text-slate-500 mt-2">Sub-modulo nao encontrado</p>
        </div>
      </div>
    )
  }

  const ModuleIcon = moduleConfig.icon
  const SubIcon = subModule.icon
  const isDefined = subModule.defined === true

  return (
    <div>
      <Header
        title={subModule.title}
        subtitle={`${moduleConfig.title} > ${subModule.title}`}
      />

      <main className="p-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <button
            onClick={() => navigate('/')}
            className="hover:text-primary-600 transition-colors"
          >
            Painel
          </button>
          <span className="text-slate-300">/</span>
          <button
            onClick={() => navigate(moduleConfig.path)}
            className="hover:text-primary-600 transition-colors"
          >
            {moduleConfig.title}
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-medium">{subModule.title}</span>
        </div>

        {/* Conteudo */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center max-w-2xl mx-auto">
          {/* Icones do modulo + sub-modulo */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className={`w-14 h-14 rounded-2xl ${moduleConfig.bgColor} flex items-center justify-center`}>
              <ModuleIcon className={`w-7 h-7 ${moduleConfig.color}`} />
            </div>
            <div className="text-slate-300 text-2xl font-light">/</div>
            <div className={`w-14 h-14 rounded-2xl ${moduleConfig.bgColor} flex items-center justify-center`}>
              <SubIcon className={`w-7 h-7 ${moduleConfig.color}`} />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {subModule.title}
          </h2>
          <p className="text-slate-500 mb-2">
            {subModule.description}
          </p>
          <p className="text-xs text-slate-400 mb-8">
            Modulo: {moduleConfig.title}
          </p>

          {isDefined ? (
            <div className="inline-flex items-center gap-2 px-5 py-3 bg-primary-50 text-primary-700 rounded-xl text-sm font-medium">
              <Zap className="w-5 h-5" />
              Sub-modulo definido - Aguardando desenvolvimento
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-5 py-3 bg-accent-50 text-accent-700 rounded-xl text-sm font-medium">
              <Construction className="w-5 h-5" />
              Sub-modulo ainda nao definido
            </div>
          )}

          {/* Area de conteudo futuro */}
          <div className="mt-10 p-8 border-2 border-dashed border-slate-200 rounded-2xl">
            <p className="text-sm text-slate-400">
              Area reservada para o conteudo do sub-modulo.
            </p>
            <p className="text-xs text-slate-300 mt-2">
              O desenvolvimento deste sub-modulo pode ser feito em<br />
              <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                src/modules/{moduleKey}/{subModule.key}/
              </code>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
