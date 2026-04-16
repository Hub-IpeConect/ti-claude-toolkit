import {
  Settings,
  DollarSign,
  Scale,
  ClipboardCheck,
  Megaphone,
  // Icones genericos para sub-modulos
  Box,
  Layers,
  LayoutGrid,
  // Icone especifico OpenSquad
  Users,
  // Icone Legalizacao
  Stamp,
  // Icones Configuracao
  Cog,
  ShieldCheck,
  // Icone Relatorios Processuais
  FileText,
} from 'lucide-react'

/**
 * Configuracao central de modulos e sub-modulos.
 *
 * Para renomear um sub-modulo, basta alterar o "title" e "description" aqui.
 * Tudo (sidebar, paginas, rotas) sera atualizado automaticamente.
 */
export const modulesConfig = [
  {
    key: 'administrativo',
    title: 'Administrativo',
    description: 'Gestao de processos administrativos, documentos, contratos e recursos humanos.',
    icon: Settings,
    path: '/administrativo',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10',
    subModules: [
      {
        key: 'sub-1',
        title: 'Sub-modulo 1',
        description: 'Descricao do sub-modulo 1 do Administrativo',
        icon: Box,
      },
      {
        key: 'sub-2',
        title: 'Sub-modulo 2',
        description: 'Descricao do sub-modulo 2 do Administrativo',
        icon: Layers,
      },
      {
        key: 'sub-3',
        title: 'Sub-modulo 3',
        description: 'Descricao do sub-modulo 3 do Administrativo',
        icon: LayoutGrid,
      },
    ],
  },
  {
    key: 'financeiro',
    title: 'Financeiro',
    description: 'Controle financeiro completo: contas a pagar, receber, fluxo de caixa e relatorios.',
    icon: DollarSign,
    path: '/financeiro',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10',
    subModules: [
      {
        key: 'sub-1',
        title: 'Sub-modulo 1',
        description: 'Descricao do sub-modulo 1 do Financeiro',
        icon: Box,
      },
      {
        key: 'sub-2',
        title: 'Sub-modulo 2',
        description: 'Descricao do sub-modulo 2 do Financeiro',
        icon: Layers,
      },
      {
        key: 'sub-3',
        title: 'Sub-modulo 3',
        description: 'Descricao do sub-modulo 3 do Financeiro',
        icon: LayoutGrid,
      },
    ],
  },
  {
    key: 'juridico',
    title: 'Juridico',
    description: 'Acompanhamento de processos judiciais, contratos, pareceres e compliance.',
    icon: Scale,
    path: '/juridico',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    subModules: [
      {
        key: 'relatorios-processuais',
        title: 'Relatorios Processuais',
        description: 'Gera relatorios de andamentos de processos e monta apresentacoes para clientes',
        icon: FileText,
        defined: true,
        hasCustomPage: true,
      },
      {
        key: 'sub-2',
        title: 'Sub-modulo 2',
        description: 'Descricao do sub-modulo 2 do Juridico',
        icon: Layers,
      },
      {
        key: 'sub-3',
        title: 'Sub-modulo 3',
        description: 'Descricao do sub-modulo 3 do Juridico',
        icon: LayoutGrid,
      },
    ],
  },
  {
    key: 'controladoria',
    title: 'Controladoria',
    description: 'Auditoria interna, indicadores de desempenho, compliance e gestao de riscos.',
    icon: ClipboardCheck,
    path: '/controladoria',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/10',
    subModules: [
      {
        key: 'sub-1',
        title: 'Sub-modulo 1',
        description: 'Descricao do sub-modulo 1 da Controladoria',
        icon: Box,
      },
      {
        key: 'sub-2',
        title: 'Sub-modulo 2',
        description: 'Descricao do sub-modulo 2 da Controladoria',
        icon: Layers,
      },
      {
        key: 'sub-3',
        title: 'Sub-modulo 3',
        description: 'Descricao do sub-modulo 3 da Controladoria',
        icon: LayoutGrid,
      },
    ],
  },
  {
    key: 'marketing',
    title: 'Marketing',
    description: 'Campanhas, analytics, gestao de midias sociais e comunicacao institucional.',
    icon: Megaphone,
    path: '/marketing',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    iconColor: 'text-rose-400',
    iconBg: 'bg-rose-500/10',
    subModules: [
      {
        key: 'opensquad',
        title: 'OpenSquad',
        description: 'Esquadroes (squads) de conteudo para empresas e pessoas (skill OpenSquad)',
        icon: Users,
        defined: true,
        hasCustomPage: true,
      },
      {
        key: 'sub-2',
        title: 'Sub-modulo 2',
        description: 'Descricao do sub-modulo 2 do Marketing',
        icon: Layers,
      },
      {
        key: 'sub-3',
        title: 'Sub-modulo 3',
        description: 'Descricao do sub-modulo 3 do Marketing',
        icon: LayoutGrid,
      },
    ],
  },
  {
    key: 'legalizacao',
    title: 'Legalizacao',
    description: 'Processos de legalizacao, alvaras, licencas e regularizacao empresarial.',
    icon: Stamp,
    path: '/legalizacao',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    iconColor: 'text-teal-400',
    iconBg: 'bg-teal-500/10',
    subModules: [
      {
        key: 'sub-1',
        title: 'Sub-modulo 1',
        description: 'Descricao do sub-modulo 1 da Legalizacao',
        icon: Box,
      },
      {
        key: 'sub-2',
        title: 'Sub-modulo 2',
        description: 'Descricao do sub-modulo 2 da Legalizacao',
        icon: Layers,
      },
      {
        key: 'sub-3',
        title: 'Sub-modulo 3',
        description: 'Descricao do sub-modulo 3 da Legalizacao',
        icon: LayoutGrid,
      },
    ],
  },
  {
    key: 'configuracao',
    title: 'Configuracao',
    description: 'Configuracoes do sistema, autenticacao, integracao e parametros gerais.',
    icon: Cog,
    path: '/configuracao',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    iconColor: 'text-slate-400',
    iconBg: 'bg-slate-500/10',
    subModules: [
      {
        key: 'autenticacao',
        title: 'Autenticacao',
        description: 'Configuracao de servidor LDAP/Active Directory para autenticacao de usuarios',
        icon: ShieldCheck,
        defined: true,
        // Indica que este sub-modulo tem pagina propria (nao placeholder)
        hasCustomPage: true,
      },
      {
        key: 'sub-2',
        title: 'Sub-modulo 2',
        description: 'Descricao do sub-modulo 2 de Configuracao',
        icon: Layers,
      },
      {
        key: 'sub-3',
        title: 'Sub-modulo 3',
        description: 'Descricao do sub-modulo 3 de Configuracao',
        icon: LayoutGrid,
      },
    ],
  },
]

/**
 * Utilitario: busca um modulo pelo key
 */
export function getModuleByKey(key) {
  return modulesConfig.find(m => m.key === key)
}

/**
 * Utilitario: busca sub-modulo dentro de um modulo
 */
export function getSubModule(moduleKey, subKey) {
  const mod = getModuleByKey(moduleKey)
  if (!mod) return null
  return mod.subModules.find(s => s.key === subKey)
}
