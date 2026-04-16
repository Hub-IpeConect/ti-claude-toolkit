import { useState } from 'react'
import {
  Instagram, Linkedin, Mail, FileText, BookOpen, Calendar, Megaphone,
  Loader2, Copy, Check, X, Sparkles, ArrowLeft, Play, AlertCircle, Folder
} from 'lucide-react'
import { OPENSQUAD_ACTIONS, ACTION_CATEGORIES } from '../config/opensquadActions'

const ICON_MAP = { Instagram, Linkedin, Mail, FileText, BookOpen, Calendar, Megaphone }

const COLOR_MAP = {
  rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', iconBg: 'bg-rose-500/10', iconText: 'text-rose-500', btn: 'bg-rose-500 hover:bg-rose-600' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', iconBg: 'bg-amber-500/10', iconText: 'text-amber-600', btn: 'bg-amber-500 hover:bg-amber-600' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', iconBg: 'bg-emerald-500/10', iconText: 'text-emerald-600', btn: 'bg-emerald-500 hover:bg-emerald-600' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', iconBg: 'bg-blue-500/10', iconText: 'text-blue-600', btn: 'bg-blue-500 hover:bg-blue-600' },
  violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', iconBg: 'bg-violet-500/10', iconText: 'text-violet-600', btn: 'bg-violet-500 hover:bg-violet-600' },
}

/**
 * ActionsTab — Catalogo visual de acoes do OpenSquad.
 * Cada card abre um mini-formulario; ao submeter, roda claude -p no backend
 * e mostra o resultado formatado. Sem terminal visivel.
 */
export default function ActionsTab({ projects }) {
  const [selectedProject, setSelectedProject] = useState(null)
  const [selectedAction, setSelectedAction] = useState(null)
  const [formValues, setFormValues] = useState({})
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // Se nao ha projeto selecionado, mostra a lista de projetos
  if (!selectedProject) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-rose-50 to-amber-50 rounded-xl border border-rose-200 p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800 mb-1">Criar conteudo com OpenSquad</h2>
              <p className="text-sm text-slate-600">
                Escolha um squad (esquadrao) e depois selecione o tipo de conteudo que deseja gerar.
                Sem terminal, sem comandos — so preencher o formulario.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">
            Selecione o Squad
          </label>
          {projects.length === 0 ? (
            <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-300">
              Nenhum squad encontrado. Crie um primeiro na aba "Novo Squad".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {projects.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setSelectedProject(p.name)}
                  className="text-left p-4 bg-white rounded-lg border border-slate-200 hover:border-rose-400 hover:shadow-md transition"
                >
                  <div className="flex items-start gap-2">
                    <Folder className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 truncate">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.filesCount} arquivos</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Se tem projeto mas nao tem acao selecionada, mostra catalogo
  if (!selectedAction) {
    const groupedByCategory = ACTION_CATEGORIES.map((cat) => ({
      ...cat,
      actions: OPENSQUAD_ACTIONS.filter((a) => a.category === cat.key),
    })).filter((c) => c.actions.length > 0)

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedProject(null)}
            className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" /> Trocar squad
          </button>
          <span className="text-slate-300">|</span>
          <span className="text-sm text-slate-700">
            Squad: <strong>{selectedProject}</strong>
          </span>
        </div>

        {groupedByCategory.map((cat) => (
          <div key={cat.key}>
            <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">{cat.key}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {cat.actions.map((action) => {
                const Icon = ICON_MAP[action.icon] || Sparkles
                const c = COLOR_MAP[action.color] || COLOR_MAP.rose
                return (
                  <button
                    key={action.key}
                    onClick={() => {
                      setSelectedAction(action)
                      setFormValues({})
                      setResult(null)
                      setError('')
                    }}
                    className={`text-left p-4 ${c.bg} ${c.border} border rounded-lg hover:shadow-md transition group`}
                  >
                    <div className={`w-10 h-10 rounded-lg ${c.iconBg} flex items-center justify-center mb-2`}>
                      <Icon className={`w-5 h-5 ${c.iconText}`} />
                    </div>
                    <div className="font-semibold text-slate-800 mb-0.5">{action.title}</div>
                    <div className="text-xs text-slate-600">{action.description}</div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Formulario da acao selecionada + resultado
  const action = selectedAction
  const Icon = ICON_MAP[action.icon] || Sparkles
  const c = COLOR_MAP[action.color] || COLOR_MAP.rose

  const runAction = async () => {
    // Validacao basica
    for (const f of action.fields) {
      if (f.required && !formValues[f.key]?.trim()) {
        setError(`Preencha o campo "${f.label}".`)
        return
      }
    }

    setRunning(true)
    setError('')
    setResult(null)

    // Aplica defaults
    const values = { ...formValues }
    for (const f of action.fields) {
      if (!values[f.key] && f.default) values[f.key] = f.default
    }

    const prompt = action.buildPrompt(values)

    try {
      const res = await fetch('/api/opensquad/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName: selectedProject, prompt }),
      })
      const text = await res.text()
      let data
      try { data = JSON.parse(text) } catch {
        throw new Error(`Resposta invalida do servidor: ${text.slice(0, 200)}`)
      }
      if (!res.ok) throw new Error(data.error || 'Falha ao executar acao')
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setRunning(false)
    }
  }

  const copyResult = async () => {
    if (!result?.output) return
    try {
      await navigator.clipboard.writeText(result.output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { setSelectedAction(null); setResult(null); setError('') }}
          className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <span className="text-slate-300">|</span>
        <span className="text-sm text-slate-700">
          {selectedProject} / <strong>{action.title}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Formulario */}
        <div className={`${c.bg} ${c.border} border rounded-xl p-5`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-lg ${c.iconBg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${c.iconText}`} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">{action.title}</h2>
              <p className="text-xs text-slate-600">{action.description}</p>
            </div>
          </div>

          <div className="space-y-3">
            {action.fields.map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {f.label} {f.required && <span className="text-red-500">*</span>}
                </label>
                {f.type === 'textarea' ? (
                  <textarea
                    rows={3}
                    value={formValues[f.key] || ''}
                    onChange={(e) => setFormValues({ ...formValues, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                ) : f.type === 'select' ? (
                  <select
                    value={formValues[f.key] || f.default || ''}
                    onChange={(e) => setFormValues({ ...formValues, [f.key]: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                  >
                    {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formValues[f.key] || ''}
                    onChange={(e) => setFormValues({ ...formValues, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                )}
              </div>
            ))}
          </div>

          <button
            onClick={runAction}
            disabled={running}
            className={`mt-4 w-full ${c.btn} disabled:opacity-50 text-white px-4 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition`}
          >
            {running ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Gerando conteudo...</>
            ) : (
              <><Play className="w-4 h-4" /> Gerar conteudo</>
            )}
          </button>

          {running && (
            <p className="text-xs text-slate-500 mt-2 text-center">
              Isso pode levar de 30s a 2min. Nao feche a aba.
            </p>
          )}
        </div>

        {/* Resultado */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-500" /> Resultado
            </h3>
            {result?.output && (
              <button
                onClick={copyResult}
                className="flex items-center gap-1 text-xs px-2.5 py-1 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                {copied ? (
                  <><Check className="w-3.5 h-3.5 text-emerald-600" /> Copiado</>
                ) : (
                  <><Copy className="w-3.5 h-3.5" /> Copiar</>
                )}
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 flex items-start gap-2 mb-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!result && !error && !running && (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-400 text-center px-4">
              Preencha o formulario ao lado e clique em "Gerar conteudo".
            </div>
          )}

          {running && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mb-2 text-rose-500" />
              <span className="text-sm">OpenSquad esta trabalhando...</span>
            </div>
          )}

          {result?.output && (
            <div className="flex-1 overflow-auto">
              <pre className="whitespace-pre-wrap text-sm text-slate-800 font-sans leading-relaxed">
                {result.output}
              </pre>
              {result.durationMs && (
                <div className="text-[10px] text-slate-400 mt-3 pt-3 border-t">
                  Gerado em {(result.durationMs / 1000).toFixed(1)}s
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
