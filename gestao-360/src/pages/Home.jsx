import {
  Users,
  FileText,
  TrendingUp,
  Calendar,
  Activity,
} from 'lucide-react'
import Header from '@components/Header'
import ModuleCard from '@components/ModuleCard'
import StatsCard from '@components/StatsCard'
import { modulesConfig } from '@/config/modules'
import { useAuth } from '@hooks/useAuth'

// Stats extras para exibir nos cards dos modulos na Home
const moduleStats = {
  administrativo: [
    { value: '124', label: 'Processos' },
    { value: '18', label: 'Pendentes' },
  ],
  financeiro: [
    { value: 'R$ 2.4M', label: 'Receita' },
    { value: '97%', label: 'Adimplencia' },
  ],
  juridico: [
    { value: '43', label: 'Processos' },
    { value: '7', label: 'Urgentes' },
  ],
  controladoria: [
    { value: '98.2%', label: 'Conformidade' },
    { value: '12', label: 'Auditorias' },
  ],
  marketing: [
    { value: '8', label: 'Campanhas' },
    { value: '+32%', label: 'Alcance' },
  ],
  legalizacao: [
    { value: '56', label: 'Processos' },
    { value: '14', label: 'Em andamento' },
  ],
  configuracao: [
    { value: '1', label: 'Servidores' },
    { value: 'Ativo', label: 'LDAP' },
  ],
}

const overviewStats = [
  {
    title: 'Usuarios Ativos',
    value: '248',
    change: '+12%',
    changeType: 'positive',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    title: 'Documentos',
    value: '1.847',
    change: '+8%',
    changeType: 'positive',
    icon: FileText,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    title: 'Eficiencia',
    value: '94.7%',
    change: '+2.3%',
    changeType: 'positive',
    icon: TrendingUp,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    title: 'Tarefas do Mes',
    value: '386',
    change: '-5%',
    changeType: 'negative',
    icon: Calendar,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
]

export default function Home() {
  const { user } = useAuth()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div>
      <Header
        title={`${greeting}, ${user?.displayName || 'Usuario'}`}
        subtitle="Aqui esta o resumo do seu sistema de gestao"
      />

      <main className="p-8">
        {/* Stats resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {overviewStats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        {/* Modulos */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Modulos do Sistema</h3>
          <p className="text-sm text-slate-500">
            Selecione um modulo para acessar seus {modulesConfig[0]?.subModules?.length || 3} sub-modulos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {modulesConfig.map((module) => (
            <ModuleCard
              key={module.key}
              title={module.title}
              description={module.description}
              icon={module.icon}
              path={module.path}
              color={module.color}
              bgColor={module.bgColor}
              stats={moduleStats[module.key]}
            />
          ))}
        </div>

        {/* Atividade recente */}
        <div className="mt-8 bg-white rounded-2xl border border-slate-200/60 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Activity className="w-5 h-5 text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-900">Atividade Recente</h3>
          </div>

          <div className="space-y-4">
            {[
              { action: 'Novo contrato adicionado', module: 'Juridico', time: 'Ha 15 min', color: 'bg-amber-500' },
              { action: 'Pagamento confirmado - NF #4521', module: 'Financeiro', time: 'Ha 1 hora', color: 'bg-emerald-500' },
              { action: 'Relatorio mensal gerado', module: 'Controladoria', time: 'Ha 2 horas', color: 'bg-purple-500' },
              { action: 'Campanha "Q2 2026" aprovada', module: 'Marketing', time: 'Ha 3 horas', color: 'bg-rose-500' },
              { action: 'Colaborador admitido - Dept. TI', module: 'Administrativo', time: 'Ha 5 horas', color: 'bg-blue-500' },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-4 py-2">
                <div className={`w-2 h-2 rounded-full ${item.color} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">{item.action}</p>
                  <p className="text-xs text-slate-400">{item.module}</p>
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
