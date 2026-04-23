import { useState, useRef, useEffect } from 'react'
import {
  Building2, User, Loader2, CheckCircle2, AlertCircle,
  ArrowRight, ArrowLeft, Sparkles, Zap, Search, Edit3,
  Share2, Settings, Mail, PenLine, ChevronDown, ChevronUp,
  FileText, TriangleAlert
} from 'lucide-react'

/**
 * Wizard de criacao de Squad — replica o fluxo do Arquiteto do /opensquad.
 *
 * Fluxo:
 *  0. Proposito (pergunta do Arquiteto — igual ao /opensquad)
 *  1. Nome do squad (identificacao)
 *  2. Tipo (PJ / PF)
 *  3. Nome real + site/perfil (origem da pesquisa)
 *  4. >>> Pesquisa automatica (Sherlock) <<<
 *  5. Revisar dados pesquisados (editavel)
 *  6. Criar squad (aplica perfil)
 */

// Opcoes do Arquiteto — replicadas do /opensquad
const PROPOSITO_OPTIONS = [
  {
    key: 'social',
    label: 'Conteudo para redes sociais',
    description: 'Posts, carrosseis, threads — Instagram, LinkedIn, Twitter/X',
    icon: Share2,
    color: 'rose',
  },
  {
    key: 'automation',
    label: 'Automacao de processos',
    description: 'Fluxos de trabalho, relatorios, analise de dados',
    icon: Settings,
    color: 'amber',
  },
  {
    key: 'b2b',
    label: 'Comunicacao B2B',
    description: 'E-mails, comunicados, propostas para clientes',
    icon: Mail,
    color: 'blue',
  },
  {
    key: 'custom',
    label: 'Outro objetivo',
    description: 'Descreva em texto livre o que precisa',
    icon: PenLine,
    color: 'slate',
  },
]

const COLOR_MAP = {
  rose: { border: 'border-rose-400', bg: 'bg-rose-50', icon: 'text-rose-500', iconBg: 'bg-rose-500/10' },
  amber: { border: 'border-amber-400', bg: 'bg-amber-50', icon: 'text-amber-600', iconBg: 'bg-amber-500/10' },
  blue: { border: 'border-blue-400', bg: 'bg-blue-50', icon: 'text-blue-500', iconBg: 'bg-blue-500/10' },
  slate: { border: 'border-slate-400', bg: 'bg-slate-50', icon: 'text-slate-500', iconBg: 'bg-slate-500/10' },
}

export default function NewSquadWizard({ onCreated }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    proposito: '',           // key do PROPOSITO_OPTIONS
    propositoCustom: '',     // texto livre se key === 'custom'
    squadName: '',
    entityType: 'pj',
    name: '',
    website: '',
    // Preenchidos pelo Sherlock
    segment: '',
    description: '',
    audience: '',
    tone: 'Profissional',
    objectives: '',
    differentials: '',
    extra: '',
  })
  const [researching, setResearching] = useState(false)
  const [researchLog, setResearchLog] = useState('')   // output ao vivo do Sherlock
  const [researchError, setResearchError] = useState('')
  const [sherlockRaw, setSherlockRaw] = useState('')   // saida completa do Sherlock para exibicao no step 5
  const [sherlockRawOpen, setSherlockRawOpen] = useState(false) // collapsible
  const logEndRef = useRef(null)
  const [status, setStatus] = useState('idle') // idle | configuring | done | error
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [squadCreated, setSquadCreated] = useState(false)

  const update = (patch) => setForm(f => ({ ...f, ...patch }))

  const STEPS = [
    { key: 'proposito', title: 'Qual e o proposito deste squad?' },
    { key: 'name', title: 'Identificacao do Squad' },
    { key: 'type', title: 'Perfil' },
    { key: 'source', title: 'Fonte da pesquisa' },
    { key: 'research', title: 'Pesquisa automatica (Sherlock)' },
    { key: 'review', title: 'Revisar dados' },
    { key: 'confirm', title: 'Criar Squad' },
  ]

  const canGoNext = () => {
    switch (step) {
      case 0: return !!form.proposito && (form.proposito !== 'custom' || form.propositoCustom.trim().length > 0)
      case 1: return form.squadName.trim().length > 0
      case 2: return !!form.entityType
      case 3: return form.name.trim().length > 0
      // Step 5: exige descricao+publico preenchidos; se so tiver raw, usuario precisa preencher primeiro
      case 5: return form.description.trim().length > 0 && form.audience.trim().length > 0
      default: return true
    }
  }

  // Abre automaticamente o relatorio do Sherlock ao entrar no step 5 quando campos estao vazios
  useEffect(() => {
    if (step === 5 && sherlockRaw && !form.description && !form.audience) {
      setSherlockRawOpen(true)
    }
  }, [step])

  const initAndResearch = async () => {
    setResearching(true)
    setResearchError('')
    setResearchLog('')

    try {
      // 1. Init (sincrono)
      if (!squadCreated) {
        setResearchLog('⚙️ Criando estrutura do squad...\n')
        const r1 = await fetch('/api/opensquad/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectName: form.squadName }),
        })
        const text1 = await r1.text()
        let d1
        try { d1 = JSON.parse(text1) } catch { throw new Error(`Resposta invalida do init: ${text1.slice(0, 200)}`) }
        if (!r1.ok) throw new Error(d1.error || 'Falha ao criar estrutura do squad')
        setSquadCreated(true)
        setResearchLog(prev => prev + '✅ Estrutura criada.\n\n🔍 Sherlock iniciando investigação...\n\n')
      }

      // 2. Research via POST sincrono (sem SSE - proxy do Vite nao suporta SSE com POST)
      const propositoLabel = form.proposito === 'custom'
        ? form.propositoCustom
        : PROPOSITO_OPTIONS.find(o => o.key === form.proposito)?.label || ''

      setResearchLog(prev => prev + '\u23f3 Aguardando resposta do Claude (pode levar 1-2 minutos)...\n')

      const researchRes = await fetch('/api/opensquad/research-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: form.squadName,
          entityType: form.entityType,
          name: form.name,
          source: form.website,
          proposito: propositoLabel,
        }),
      })

      if (!researchRes.ok) {
        const errData = await researchRes.json().catch(() => ({}))
        throw new Error(errData.error || 'Falha na pesquisa')
      }

      const researchData = await researchRes.json()
      const p = researchData.profile || {}
      if (researchData.raw) setSherlockRaw(researchData.raw)
      const TONS = ['Profissional','Amigavel','Consultivo','Divertido','Inspirador','Tecnico','Educativo']
      update({
        segment: p.segment || '',
        description: p.description || '',
        audience: p.audience || '',
        tone: TONS.includes(p.tone) ? p.tone : 'Profissional',
        objectives: p.objectives || '',
        differentials: p.differentials || '',
        extra: p.extra || '',
      })
      const temDados = !!(p.description || p.audience || p.segment)
      setResearchLog(prev => prev + (temDados
        ? '\n\n\u2705 Pesquisa conclu\u00edda! Revise os dados na proxima etapa.'
        : '\n\n\u26a0\ufe0f Nenhum dado estruturado retornado. Preencha manualmente.'))
      setTimeout(() => setStep(5), 800)

    } catch (err) {
      setResearchError(err.message)
    } finally {
      setResearching(false)
    }
  }

  // Auto-scroll do log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [researchLog])

  const createSquad = async () => {
    setStatus('configuring')
    setError('')
    try {
      const propositoLabel = form.proposito === 'custom'
        ? form.propositoCustom
        : PROPOSITO_OPTIONS.find(o => o.key === form.proposito)?.label || ''

      const r = await fetch('/api/opensquad/setup-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: form.squadName,
          profile: {
            entityType: form.entityType,
            name: form.name,
            website: form.website,
            proposito: propositoLabel,
            segment: form.segment,
            description: form.description,
            audience: form.audience,
            tone: form.tone,
            objectives: form.objectives,
            differentials: form.differentials,
            extra: form.extra,
          },
        }),
      })
      const text = await r.text()
      let d
      try { d = JSON.parse(text) } catch { throw new Error(`Resposta invalida: ${text.slice(0, 200)}`) }
      if (!r.ok) throw new Error(d.error || 'Falha ao configurar perfil')
      setResult(d)
      setStatus('done')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  // Sucesso
  if (status === 'done') {
    return (
      <div className="max-w-xl mx-auto bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-emerald-900 mb-1">Squad criado com sucesso!</h2>
        <p className="text-sm text-emerald-700 mb-4">
          O esquadrao <strong>{form.squadName}</strong> esta configurado e pronto para gerar conteudo.
        </p>
        {result?.output && (
          <div className="bg-white/60 rounded-lg p-3 text-xs text-slate-700 text-left whitespace-pre-wrap mb-4 max-h-40 overflow-auto">
            {result.output}
          </div>
        )}
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => onCreated?.(form.squadName)}
            className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Criar conteudo agora
          </button>
          <button
            onClick={() => {
              setStep(0)
              setForm({
                proposito: '', propositoCustom: '', squadName: '', entityType: 'pj',
                name: '', website: '', segment: '', description: '', audience: '',
                tone: 'Profissional', objectives: '', differentials: '', extra: '',
              })
              setStatus('idle'); setSquadCreated(false); setResult(null)
              setSherlockRaw(''); setSherlockRawOpen(false)
              setResearchLog(''); setResearchError('')
            }}
            className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-white"
          >
            Criar outro squad
          </button>
        </div>
      </div>
    )
  }

  if (status === 'configuring') {
    return (
      <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-xl p-8 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-rose-500 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-slate-800 mb-1">Configurando o perfil...</h2>
        <p className="text-sm text-slate-600">Aplicando os dados do squad. Quase la!</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress bar */}
      <div className="flex items-center gap-1 mb-6">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex-1">
            <div className={`h-1.5 rounded-full ${i <= step ? 'bg-rose-500' : 'bg-slate-200'}`} />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-rose-500" />
        </div>
        <div>
          <div className="text-xs text-slate-500">Passo {step + 1} de {STEPS.length}</div>
          <h2 className="text-lg font-bold text-slate-800">{STEPS[step].title}</h2>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">

        {/* STEP 0 — Arquiteto: proposito */}
        {step === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500 mb-4">
              Assim como o Arquiteto do OpenSquad, precisamos entender o objetivo antes de montar o squad.
            </p>
            <div className="space-y-2">
              {PROPOSITO_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const c = COLOR_MAP[opt.color]
                const selected = form.proposito === opt.key
                return (
                  <button
                    key={opt.key}
                    onClick={() => update({ proposito: opt.key })}
                    className={`w-full text-left p-4 border-2 rounded-xl flex items-start gap-3 transition
                      ${selected ? `${c.border} ${c.bg}` : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${selected ? c.iconBg : 'bg-slate-100'}`}>
                      <Icon className={`w-5 h-5 ${selected ? c.icon : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <div className={`font-semibold text-sm ${selected ? 'text-slate-900' : 'text-slate-700'}`}>
                        {opt.label}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{opt.description}</div>
                    </div>
                    <div className={`ml-auto w-4 h-4 rounded-full border-2 flex-shrink-0 mt-1
                      ${selected ? `${c.border} bg-white` : 'border-slate-300'}`}>
                      {selected && <div className={`w-full h-full rounded-full scale-50 ${c.bg.replace('bg-','bg-').replace('-50','-500')}`} />}
                    </div>
                  </button>
                )
              })}
            </div>
            {form.proposito === 'custom' && (
              <textarea
                rows={2}
                value={form.propositoCustom}
                onChange={(e) => update({ propositoCustom: e.target.value })}
                placeholder="Descreva o objetivo do squad..."
                className="w-full mt-2 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm"
                autoFocus
              />
            )}
          </div>
        )}

        {/* STEP 1 — Nome do squad */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              De um nome para identificar este esquadrao. Ex: "Ipeconect", "Padaria Bella", "Dr. Joao".
            </p>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">Nome do Squad *</span>
              <input
                type="text"
                value={form.squadName}
                onChange={(e) => update({ squadName: e.target.value })}
                placeholder="Ex: Ipeconect"
                className="mt-1 w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
                autoFocus
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Use apenas letras, numeros e hifens. Sera o nome da pasta.
              </span>
            </label>
          </div>
        )}

        {/* STEP 2 — Tipo PJ/PF */}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">Este squad e para uma empresa ou pessoa fisica?</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'pj', label: 'Empresa (PJ)', sub: 'Marca, negocio, loja, escritorio...', Icon: Building2 },
                { key: 'pf', label: 'Pessoa Fisica (PF)', sub: 'Profissional, influenciador, autor...', Icon: User },
              ].map(({ key, label, sub, Icon }) => (
                <button key={key} onClick={() => update({ entityType: key })}
                  className={`p-4 border-2 rounded-xl text-left transition
                    ${form.entityType === key ? 'border-rose-500 bg-rose-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <Icon className={`w-6 h-6 mb-2 ${form.entityType === key ? 'text-rose-500' : 'text-slate-400'}`} />
                  <div className="font-semibold text-slate-800">{label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3 — Nome + source */}
        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Informe o nome e o site/perfil. O <strong>Sherlock</strong> vai pesquisar e preencher o restante automaticamente.
            </p>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                Nome {form.entityType === 'pj' ? 'da empresa' : 'da pessoa'} *
              </span>
              <input type="text" value={form.name}
                onChange={(e) => update({ name: e.target.value })}
                placeholder={form.entityType === 'pj' ? 'Ex: Ipeconect Ltda' : 'Ex: Dr. Joao Silva'}
                className="mt-1 w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                Site / perfil social <span className="text-slate-400 font-normal">(recomendado para Sherlock)</span>
              </span>
              <input type="text" value={form.website}
                onChange={(e) => update({ website: e.target.value })}
                placeholder="Ex: ipeconect.com.br, @drjoaosilva, linkedin.com/in/..."
                className="mt-1 w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </label>
          </div>
        )}

        {/* STEP 4 — Sherlock com log ao vivo */}
        {step === 4 && (
          <div className="space-y-4">
            {/* Card de inicio — some quando ja esta pesquisando */}
            {!researching && !researchLog && !researchError && (
              <div className="bg-gradient-to-br from-rose-50 to-amber-50 border border-rose-200 rounded-xl p-5 text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-slate-800 mb-1">Sherlock vai pesquisar o perfil</h3>
                <p className="text-sm text-slate-600 mb-1">
                  Proposito: <strong>{form.proposito === 'custom' ? form.propositoCustom : PROPOSITO_OPTIONS.find(o => o.key === form.proposito)?.label}</strong>
                </p>
                <p className="text-sm text-slate-600 mb-4">
                  Alvo: <strong>{form.name}</strong>{form.website ? ` — ${form.website}` : ''}
                </p>
                <p className="text-xs text-slate-500 mb-4">Voce vai acompanhar a investigacao em tempo real. Pode levar 1-3 min.</p>
                <button onClick={initAndResearch}
                  className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 mx-auto">
                  <Zap className="w-4 h-4" /> Iniciar pesquisa
                </button>
              </div>
            )}

            {/* Log ao vivo — aparece assim que inicia */}
            {(researching || researchLog) && !researchError && (
              <div className="rounded-xl overflow-hidden border border-slate-700 shadow-lg">
                {/* Header estilo terminal */}
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  <span className="ml-2 text-xs text-slate-400 flex items-center gap-1.5">
                    <Search className="w-3 h-3" />
                    Sherlock — investigando <strong className="text-slate-200">{form.name}</strong>
                  </span>
                  {researching && (
                    <Loader2 className="w-3 h-3 animate-spin text-rose-400 ml-auto" />
                  )}
                  {!researching && researchLog.includes('✅ Pesquisa concluída') && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-auto" />
                  )}
                </div>
                {/* Conteudo do log */}
                <div className="bg-slate-900 p-4 h-64 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed">
                  <pre className="whitespace-pre-wrap">{researchLog || ' '}</pre>
                  <div ref={logEndRef} />
                </div>
              </div>
            )}

            {/* Erro */}
            {researchError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2 text-red-700 mb-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-sm">Falha na pesquisa</div>
                    <div className="text-xs mt-1">{researchError}</div>
                  </div>
                </div>
                {/* Mostra o log parcial se houver */}
                {researchLog && (
                  <div className="bg-slate-900 rounded-lg p-3 mb-3 h-32 overflow-y-auto">
                    <pre className="text-[11px] text-slate-400 whitespace-pre-wrap font-mono">{researchLog}</pre>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={initAndResearch}
                    className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                    Tentar novamente
                  </button>
                  <button onClick={() => { setResearchError(''); setResearchLog(''); setStep(5) }}
                    className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold">
                    Preencher manualmente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 5 — Revisar dados do Sherlock */}
        {step === 5 && (() => {
          // temCampos so e true quando os dois campos OBRIGATORIOS estao preenchidos pelo Sherlock
          const temCampos = !!(form.description?.trim() && form.audience?.trim())
          const temRaw    = !!sherlockRaw

          return (
            <div className="space-y-3">

              {/* Banner de status */}
              {temCampos ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
                  <span>Sherlock preencheu os campos abaixo. Revise e ajuste o que quiser antes de continuar.</span>
                </div>
              ) : temRaw ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
                  <TriangleAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                  <span>
                    O Sherlock encontrou dados mas nao conseguiu estrutura-los automaticamente.
                    Consulte o relatorio abaixo e preencha os campos manualmente.
                  </span>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 flex items-start gap-2">
                  <Edit3 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Preencha os campos abaixo com as informacoes do perfil.</span>
                </div>
              )}

              {/* Relatorio completo do Sherlock — sempre visivel quando existe */}
              {temRaw && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setSherlockRawOpen(o => !o)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                  >
                    <span className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      Relatorio completo do Sherlock
                      {!temCampos && (
                        <span className="bg-amber-100 text-amber-700 text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                          consulte para preencher
                        </span>
                      )}
                    </span>
                    {sherlockRawOpen
                      ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                      : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    }
                  </button>
                  {sherlockRawOpen && (
                    <div className="bg-slate-900 p-4 max-h-64 overflow-y-auto">
                      <pre className="text-[11px] text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                        {sherlockRaw}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Campos editaveis */}
              {[
                { key: 'segment',      label: 'Segmento / nicho',  type: 'input'    },
                { key: 'description',  label: 'Descricao *',       type: 'textarea', rows: 3 },
                { key: 'audience',     label: 'Publico-alvo *',    type: 'textarea', rows: 3 },
                { key: 'objectives',   label: 'Objetivos',         type: 'input'    },
                { key: 'differentials',label: 'Diferenciais',      type: 'textarea', rows: 2 },
                { key: 'extra',        label: 'Informacoes extras', type: 'textarea', rows: 2 },
              ].map(f => (
                <label key={f.key} className="block">
                  <span className="text-xs font-semibold text-slate-700">{f.label}</span>
                  {f.type === 'input' ? (
                    <input
                      type="text"
                      value={form[f.key]}
                      onChange={(e) => update({ [f.key]: e.target.value })}
                      placeholder={!temCampos && temRaw ? 'Preencha com base no relatorio acima' : ''}
                      className={`mt-1 w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-rose-400
                        ${!form[f.key] && !temCampos && temRaw ? 'border-amber-300 bg-amber-50/30' : 'border-slate-300'}`}
                    />
                  ) : (
                    <textarea
                      rows={f.rows}
                      value={form[f.key]}
                      onChange={(e) => update({ [f.key]: e.target.value })}
                      placeholder={!temCampos && temRaw ? 'Preencha com base no relatorio acima' : ''}
                      className={`mt-1 w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-rose-400
                        ${!form[f.key] && !temCampos && temRaw ? 'border-amber-300 bg-amber-50/30' : 'border-slate-300'}`}
                    />
                  )}
                </label>
              ))}

              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Tom de voz</span>
                <select
                  value={form.tone}
                  onChange={(e) => update({ tone: e.target.value })}
                  className="mt-1 w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white text-sm"
                >
                  {['Profissional','Amigavel','Consultivo','Divertido','Inspirador','Tecnico','Educativo'].map(t =>
                    <option key={t}>{t}</option>
                  )}
                </select>
              </label>
            </div>
          )
        })()}

        {/* STEP 6 — Confirm */}
        {step === 6 && (
          <div className="space-y-3 text-sm">
            <p className="text-slate-600 mb-3">Tudo pronto! Confira o resumo:</p>
            <div className="bg-slate-50 rounded-lg p-4 space-y-1.5 text-slate-700">
              <div><strong>Squad:</strong> {form.squadName}</div>
              <div><strong>Proposito:</strong> {form.proposito === 'custom' ? form.propositoCustom : PROPOSITO_OPTIONS.find(o => o.key === form.proposito)?.label}</div>
              <div><strong>Tipo:</strong> {form.entityType === 'pj' ? 'Empresa (PJ)' : 'Pessoa Fisica (PF)'}</div>
              <div><strong>Nome:</strong> {form.name}</div>
              {form.website && <div><strong>Site:</strong> {form.website}</div>}
              {form.segment && <div><strong>Segmento:</strong> {form.segment}</div>}
              <div><strong>Descricao:</strong> {form.description}</div>
              <div><strong>Publico:</strong> {form.audience}</div>
              <div><strong>Tom:</strong> {form.tone}</div>
              {form.objectives && <div><strong>Objetivos:</strong> {form.objectives}</div>}
              {form.differentials && <div><strong>Diferenciais:</strong> {form.differentials}</div>}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-start gap-2 mb-3">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0 || researching}
          className="flex items-center gap-1.5 px-4 py-2 text-slate-600 disabled:opacity-30 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        {/* Proximo — passos 0-3 e 5 */}
        {[0, 1, 2, 3, 5].includes(step) && (
          <button
            onClick={() => canGoNext() && setStep(s => s + 1)}
            disabled={!canGoNext()}
            className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 disabled:bg-slate-300 text-white px-5 py-2 rounded-lg font-semibold"
          >
            Proximo <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {/* Passo 6 — criar */}
        {step === 6 && (
          <button onClick={createSquad}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg font-semibold">
            <Zap className="w-4 h-4" /> Criar Squad
          </button>
        )}
      </div>
    </div>
  )
}
