import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Users,
  Plus,
  FolderOpen,
  Settings as SettingsIcon,
  BookOpen,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Terminal,
  RefreshCw,
  FileText,
  Folder,
  Trash2,
  Play,
  X,
  Code2,
  Copy,
  Check,
  Info,
  Zap,
  Maximize2,
  Sparkles,
} from 'lucide-react'
import XtermTerminal from '@components/XtermTerminal'
import ActionsTab from '@components/ActionsTab'
import NewSquadWizard from '@components/NewSquadWizard'

const TABS = [
  { key: 'new', label: 'Novo Squad', icon: Plus },
  { key: 'actions', label: 'Criar Conteudo', icon: Sparkles },
  { key: 'projects', label: 'Meus Squads', icon: FolderOpen },
  { key: 'config', label: 'Configuracao', icon: SettingsIcon },
  { key: 'docs', label: 'Documentacao', icon: BookOpen },
]

export default function OpenSquadPage() {
  const [activeTab, setActiveTab] = useState('new')
  const [allProjects, setAllProjects] = useState([])

  // Carrega a lista de projetos sempre que a aba "actions" for aberta
  useEffect(() => {
    if (activeTab !== 'actions') return
    fetch('/api/opensquad/projects')
      .then(r => r.json())
      .then(d => setAllProjects(d.projects || []))
      .catch(() => setAllProjects([]))
  }, [activeTab])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center">
          <Users className="w-6 h-6 text-rose-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">OpenSquad</h1>
          <p className="text-sm text-slate-500">
            Esquadroes (squads) de conteudo personalizados por perfil
          </p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {TABS.map(tab => {
          const Icon = tab.icon
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                flex items-center gap-2 px-4 py-2.5 text-sm font-medium
                border-b-2 transition-colors
                ${active
                  ? 'border-rose-500 text-rose-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'new' && <NewSquadWizard onCreated={() => setActiveTab('actions')} />}
      {activeTab === 'actions' && <ActionsTab projects={allProjects} />}
      {activeTab === 'projects' && <ProjectsTab />}
      {activeTab === 'config' && <ConfigTab />}
      {activeTab === 'docs' && <DocsTab />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Mapeia teclas para sequencias de escape do terminal
// ---------------------------------------------------------------------------
function keyToEscape(e) {
  if (e.key === 'ArrowUp')    return '\x1B[A'
  if (e.key === 'ArrowDown')  return '\x1B[B'
  if (e.key === 'ArrowRight') return '\x1B[C'
  if (e.key === 'ArrowLeft')  return '\x1B[D'
  if (e.key === 'Enter')      return '\r'
  if (e.key === ' ')          return ' '
  if (e.key === 'Backspace')  return '\x7F'
  if (e.key === 'c' && e.ctrlKey) return '\x03'
  if (!e.ctrlKey && !e.altKey && !e.metaKey && e.key.length === 1) return e.key
  return null
}

// ---------------------------------------------------------------------------
// Terminal reutilizavel (para init e run)
// ---------------------------------------------------------------------------
function InteractiveTerminal({ jobId, status, log, onKey }) {
  const [focused, setFocused] = useState(false)
  const termRef = useRef(null)
  const logEndRef = useRef(null)

  useEffect(() => {
    if (jobId && status === 'running') termRef.current?.focus()
  }, [jobId, status])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [log])

  const handleKeyDown = (e) => {
    if (status !== 'running') return
    const seq = keyToEscape(e)
    if (!seq) return
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault()
    }
    onKey?.(seq)
  }

  return (
    <div className="mt-3">
      {status === 'running' && (
        <div className={`mb-1 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors
          ${focused ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
          <Terminal className="w-3.5 h-3.5" />
          {focused ? '✓ Terminal ativo — use ↑↓ e Enter para interagir'
                   : 'Clique no terminal para ativar as teclas'}
        </div>
      )}
      <div
        ref={termRef}
        tabIndex={0}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={handleKeyDown}
        className={`bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-xs
          max-h-96 overflow-auto cursor-text outline-none transition-all duration-150
          ${focused && status === 'running' ? 'ring-2 ring-rose-500 ring-offset-1'
            : status === 'running' ? 'ring-2 ring-slate-600' : ''}`}
      >
        <div className="flex items-center gap-2 text-slate-400 mb-2 pb-2 border-b border-slate-700 select-none">
          <Terminal className="w-3.5 h-3.5" />
          <span>Log de execucao</span>
          {status === 'running' && (
            <span className="ml-auto text-slate-500 text-[10px]">
              {focused ? 'ATIVO' : 'clique para ativar'}
            </span>
          )}
        </div>
        <pre className="whitespace-pre-wrap break-all leading-relaxed">
          {log || 'Aguardando saida do comando...'}
          {status === 'running' && focused && <span className="animate-pulse">▌</span>}
        </pre>
        <div ref={logEndRef} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab: Novo Projeto
// ---------------------------------------------------------------------------
function NewProjectTab({ onCreated }) {
  const [name, setName] = useState('')
  const [jobId, setJobId] = useState(null)
  const [status, setStatus] = useState(null)
  const [log, setLog] = useState('')
  const [error, setError] = useState('')
  const pollRef = useRef(null)

  useEffect(() => {
    if (!jobId) return
    const poll = async () => {
      try {
        const res = await fetch(`/api/opensquad/status/${jobId}`)
        const data = await res.json()
        setLog(data.log || '')
        setStatus(data.status)
        if (data.status !== 'running') clearInterval(pollRef.current)
      } catch {}
    }
    poll()
    pollRef.current = setInterval(poll, 800)
    return () => clearInterval(pollRef.current)
  }, [jobId])

  const sendKey = useCallback(async (data) => {
    if (!jobId || status !== 'running') return
    try {
      await fetch(`/api/opensquad/stdin/${jobId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      })
    } catch {}
  }, [jobId, status])

  const handleInit = async () => {
    setError(''); setLog(''); setStatus(null)
    try {
      const res = await fetch('/api/opensquad/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName: name }),
      })
      const text = await res.text()
      let data
      try { data = JSON.parse(text) } catch {
        setError(`Resposta inesperada do servidor (status ${res.status}):\n${text.slice(0, 300)}`)
        return
      }
      if (!res.ok) { setError(data.error || 'Erro ao criar projeto.'); return }
      setJobId(data.jobId)
      setStatus('running')
    } catch (err) {
      setError(`Nao foi possivel conectar ao backend: ${err.message}`)
    }
  }

  const reset = () => {
    clearInterval(pollRef.current)
    setName(''); setJobId(null); setStatus(null); setLog(''); setError('')
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-1">Inicializar novo projeto</h2>
      <p className="text-sm text-slate-500 mb-5">
        Cria uma pasta nova no servidor e executa{' '}
        <code className="px-1.5 py-0.5 bg-slate-100 rounded text-xs">npx opensquad init</code>{' '}
        dentro dela.
      </p>

      {!jobId && (
        <>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome do projeto</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && name.trim() && handleInit()}
              placeholder="ex: campanha-natal-2026"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
            <button
              onClick={handleInit}
              disabled={!name.trim()}
              className="px-5 py-2 bg-rose-500 hover:bg-rose-600 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />Inicializar
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">O nome sera normalizado (sem acentos / caracteres especiais).</p>
        </>
      )}

      {error && (
        <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <pre className="text-sm text-red-700 whitespace-pre-wrap">{error}</pre>
        </div>
      )}

      {jobId && (
        <>
          <div className="flex items-center justify-between mt-4 mb-1">
            <div className="flex items-center gap-2 text-sm">
              {status === 'running' && <><Loader2 className="w-4 h-4 text-rose-500 animate-spin" /><span className="text-slate-700">Executando opensquad init...</span></>}
              {status === 'completed' && <><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span className="text-emerald-700 font-medium">Projeto inicializado!</span></>}
              {status === 'error' && <><AlertCircle className="w-4 h-4 text-red-500" /><span className="text-red-700 font-medium">Erro ao inicializar</span></>}
            </div>
            {status !== 'running' && (
              <div className="flex gap-2">
                <button onClick={reset} className="text-xs px-3 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-lg">Novo projeto</button>
                {status === 'completed' && (
                  <button onClick={onCreated} className="text-xs px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg">Ver meus projetos</button>
                )}
              </div>
            )}
          </div>

          <InteractiveTerminal jobId={jobId} status={status} log={log} onKey={sendKey} />
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab: Meus Projetos
// ---------------------------------------------------------------------------
function ProjectsTab() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [details, setDetails] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // nome do projeto a deletar
  const [deleting, setDeleting] = useState(false)

  // Terminal por projeto
  const [runCmd, setRunCmd] = useState('')
  const [runJob, setRunJob] = useState(null) // { jobId, status, log }
  const runPollRef = useRef(null)

  const load = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/opensquad/projects')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setProjects(data.projects || [])
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const loadDetails = async (name) => {
    setSelected(name); setDetails(null); setRunJob(null); setRunCmd('')
    try {
      const res = await fetch(`/api/opensquad/project/${encodeURIComponent(name)}`)
      const data = await res.json()
      setDetails(data)
    } catch (err) { setDetails({ error: err.message }) }
  }

  const handleDelete = async (name) => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/opensquad/project/${encodeURIComponent(name)}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDeleteConfirm(null)
      if (selected === name) { setSelected(null); setDetails(null) }
      load()
    } catch (err) { alert(`Erro ao excluir: ${err.message}`) }
    finally { setDeleting(false) }
  }

  const handleRun = async () => {
    if (!runCmd.trim() || !selected) return
    clearInterval(runPollRef.current)
    setRunJob({ jobId: null, status: 'starting', log: '' })
    try {
      const res = await fetch('/api/opensquad/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName: selected, command: runCmd }),
      })
      const data = await res.json()
      if (!res.ok) { setRunJob({ jobId: null, status: 'error', log: data.error }); return }
      const jobId = data.jobId
      setRunJob({ jobId, status: 'running', log: '' })

      const poll = async () => {
        try {
          const r = await fetch(`/api/opensquad/status/${jobId}`)
          const d = await r.json()
          setRunJob({ jobId, status: d.status, log: d.log || '' })
          if (d.status !== 'running') clearInterval(runPollRef.current)
        } catch {}
      }
      poll()
      runPollRef.current = setInterval(poll, 800)
    } catch (err) {
      setRunJob({ jobId: null, status: 'error', log: err.message })
    }
  }

  const sendRunKey = useCallback(async (data) => {
    if (!runJob?.jobId || runJob?.status !== 'running') return
    try {
      await fetch(`/api/opensquad/stdin/${runJob.jobId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      })
    } catch {}
  }, [runJob])

  return (
    <>
      {/* Modal de confirmacao de exclusao */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Excluir projeto</h3>
                <p className="text-sm text-slate-500">Essa acao nao pode ser desfeita</p>
              </div>
            </div>
            <p className="text-sm text-slate-700 mb-5">
              Tem certeza que deseja excluir o projeto{' '}
              <strong className="text-red-600">"{deleteConfirm}"</strong> e todos os seus arquivos?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-lg text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg text-sm flex items-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Lista de projetos */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-800">Projetos</h2>
            <button onClick={load} className="text-xs px-2.5 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-lg flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />Atualizar
            </button>
          </div>

          {loading && <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</div>}
          {error && <div className="text-sm text-red-600 flex items-start gap-1.5"><AlertCircle className="w-4 h-4 mt-0.5" />{error}</div>}
          {!loading && !error && projects.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm">
              <FolderOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              Nenhum projeto ainda.
            </div>
          )}

          <ul className="space-y-1.5">
            {projects.map(p => (
              <li key={p.name}>
                <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-colors cursor-pointer
                  ${selected === p.name ? 'border-rose-400 bg-rose-50' : 'border-slate-200 hover:bg-slate-50'}`}
                  onClick={() => loadDetails(p.name)}
                >
                  <Folder className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-slate-800 text-sm truncate">{p.name}</span>
                      {p.hasOpenSquadConfig && (
                        <span className="text-[10px] px-1 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold flex-shrink-0">✓</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{p.filesCount} arq.</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteConfirm(p.name) }}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0 transition-colors"
                    title="Excluir projeto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Painel direito: arquivos + terminal */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Como usar — instrucoes do fluxo /opensquad */}
          {selected && details?.projectPath && (
            <UsageBox projectName={selected} projectPath={details.projectPath} />
          )}

          {/* Arquivos */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-base font-semibold text-slate-800 mb-3">
              {selected ? `Arquivos — ${selected}` : 'Detalhes'}
            </h2>
            {!selected && <p className="text-sm text-slate-500">Selecione um projeto na lista.</p>}
            {selected && !details && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
            {details?.error && <p className="text-sm text-red-600">{details.error}</p>}
            {details?.files && (
              <ul className="space-y-0.5 max-h-48 overflow-auto text-xs font-mono">
                {details.files.map(f => (
                  <li key={f.path} className="flex items-center gap-1.5 text-slate-700">
                    {f.type === 'dir'
                      ? <Folder className="w-3 h-3 text-slate-400" />
                      : <FileText className="w-3 h-3 text-slate-400" />}
                    <span className="truncate">{f.path}</span>
                    {f.size !== undefined && <span className="text-slate-400 ml-auto flex-shrink-0">{f.size}b</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Terminal do projeto */}
          {selected && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-rose-500" />
                Terminal — {selected}
              </h2>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={runCmd}
                  onChange={e => setRunCmd(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && runJob?.status !== 'running' && runCmd.trim() && handleRun()}
                  placeholder="ex: npx opensquad run"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
                <button
                  onClick={handleRun}
                  disabled={!runCmd.trim() || runJob?.status === 'running'}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium flex items-center gap-1.5"
                >
                  {runJob?.status === 'running'
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Play className="w-4 h-4" />}
                  Executar
                </button>
                {runJob && (
                  <button
                    onClick={() => { clearInterval(runPollRef.current); setRunJob(null) }}
                    className="p-2 border border-slate-300 hover:bg-slate-50 rounded-lg"
                    title="Limpar"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                )}
              </div>

              {/* Atalhos rapidos */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {['dir', 'type CLAUDE.md', 'git status', 'node --version'].map(cmd => (
                  <button
                    key={cmd}
                    onClick={() => setRunCmd(cmd)}
                    className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded font-mono text-slate-600"
                  >
                    {cmd}
                  </button>
                ))}
              </div>

              {runJob && (
                <InteractiveTerminal
                  jobId={runJob.jobId}
                  status={runJob.status}
                  log={runJob.log}
                  onKey={sendRunKey}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Tab: Configuracao
// ---------------------------------------------------------------------------
function ConfigTab() {
  const [cfg, setCfg] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/opensquad/config').then(r => r.json()).then(setCfg).finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Configuracao da skill</h2>
      {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
      {cfg && (
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="font-medium text-slate-700">Pasta de projetos no servidor</dt>
            <dd className="text-slate-500 font-mono text-xs mt-0.5 break-all">{cfg.projectsDir}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-700">Plataforma</dt>
            <dd className="text-slate-500 text-xs mt-0.5">{cfg.platform}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-700">Versao do Node</dt>
            <dd className="text-slate-500 text-xs mt-0.5">{cfg.nodeVersion}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-700">Comando de inicializacao</dt>
            <dd className="text-slate-500 font-mono text-xs mt-0.5">npx --yes opensquad init</dd>
          </div>
        </dl>
      )}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
        <strong className="block mb-1">Importante:</strong>
        O servidor precisa ter <code>Node.js</code> e <code>npx</code> instalados e acesso a internet para a primeira execucao.
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// UsageBox — instrucoes e botao para abrir no VS Code
// ---------------------------------------------------------------------------
function UsageBox({ projectName, projectPath }) {
  const [opening, setOpening] = useState(false)
  const [opened, setOpened] = useState(false)
  const [copiedPath, setCopiedPath] = useState(false)
  const [error, setError] = useState('')
  const [showClaudeTerminal, setShowClaudeTerminal] = useState(false)
  const [terminalCommand, setTerminalCommand] = useState('claude')

  const openVSCode = async () => {
    setError(''); setOpening(true); setOpened(false)
    try {
      const res = await fetch('/api/opensquad/open-vscode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setOpened(true)
      setTimeout(() => setOpened(false), 3000)
    } catch (err) {
      setError(`Nao consegui abrir o VS Code. Verifique se o comando "code" esta no PATH. (${err.message})`)
    } finally { setOpening(false) }
  }

  const copyPath = () => {
    navigator.clipboard.writeText(projectPath)
    setCopiedPath(true)
    setTimeout(() => setCopiedPath(false), 2000)
  }

  return (
    <>
    {/* Modal Claude Terminal */}
    {showClaudeTerminal && (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3">
        <div className="w-full h-full max-w-[1400px] max-h-[92vh] flex flex-col">
          <XtermTerminal
            projectName={projectName}
            command={terminalCommand}
            onClose={() => setShowClaudeTerminal(false)}
          />
        </div>
      </div>
    )}

    <div className="bg-gradient-to-br from-rose-50 to-amber-50 rounded-xl border border-rose-200 p-5">
      {/* Opcao principal: rodar dentro do sistema */}
      <div className="bg-white rounded-lg border-2 border-rose-300 p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-slate-800 mb-0.5">Rodar OpenSquad aqui mesmo</h2>
            <p className="text-xs text-slate-600 mb-3">
              Abre um terminal real do Claude Code dentro do sistema. Depois que carregar, digite <code className="bg-slate-100 px-1 rounded">/opensquad</code>.
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => { setTerminalCommand('claude'); setShowClaudeTerminal(true) }}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-md shadow-rose-500/30"
              >
                <Maximize2 className="w-4 h-4" />
                Abrir Claude Code
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded ml-1">usar /opensquad aqui</span>
              </button>
              <button
                onClick={() => { setTerminalCommand('shell'); setShowClaudeTerminal(true) }}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium flex items-center gap-2"
                title="Shell puro (cmd.exe) — NAO aceita /opensquad"
              >
                <Terminal className="w-4 h-4" />
                Abrir shell (avancado)
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              <strong>Importante:</strong> o <code className="bg-slate-100 px-1 rounded">/opensquad</code> so funciona no <strong>Claude Code</strong> (botao vermelho). O shell e apenas para comandos tipo <code>git</code>, <code>npm</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Opcao alternativa: abrir fora do sistema */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-slate-700 select-none flex items-center gap-1.5">
          <Code2 className="w-4 h-4" />
          Ou abrir externamente (VS Code)
        </summary>
        <div className="mt-3 flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-rose-500 flex items-center justify-center flex-shrink-0">
          <Code2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-800">Passo-a-passo manual</h2>
          <p className="text-sm text-slate-600">
            Se preferir usar seu proprio VS Code:
          </p>
        </div>
      </div>

      <ol className="space-y-2.5 text-sm text-slate-700">
        <li className="flex gap-2">
          <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
          <div className="flex-1">
            <p>Abra a pasta do projeto no VS Code</p>
            <div className="flex gap-2 mt-1.5">
              <button
                onClick={openVSCode}
                disabled={opening}
                className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 disabled:bg-slate-300 text-white rounded-lg text-xs font-medium flex items-center gap-1.5"
              >
                {opening
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : opened
                    ? <Check className="w-3.5 h-3.5" />
                    : <Code2 className="w-3.5 h-3.5" />}
                {opened ? 'Aberto!' : 'Abrir no VS Code'}
              </button>
              <button
                onClick={copyPath}
                className="px-3 py-1.5 border border-slate-300 hover:bg-white rounded-lg text-xs flex items-center gap-1.5 text-slate-600"
              >
                {copiedPath ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedPath ? 'Copiado!' : 'Copiar caminho'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-mono break-all">{projectPath}</p>
            {error && (
              <p className="text-xs text-red-600 mt-1.5 flex items-start gap-1">
                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />{error}
              </p>
            )}
          </div>
        </li>

        <li className="flex gap-2">
          <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
          <div className="flex-1">
            <p>No terminal do VS Code, rode o Claude Code:</p>
            <pre className="mt-1 bg-slate-900 text-slate-100 rounded-lg px-3 py-2 text-xs font-mono">claude</pre>
          </div>
        </li>

        <li className="flex gap-2">
          <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
          <div className="flex-1">
            <p>Dentro do Claude Code, digite o slash-command:</p>
            <pre className="mt-1 bg-slate-900 text-slate-100 rounded-lg px-3 py-2 text-xs font-mono">/opensquad</pre>
          </div>
        </li>
      </ol>

      </details>

      <div className="mt-4 flex items-start gap-2 p-3 bg-white/60 rounded-lg text-xs text-slate-600">
        <Info className="w-3.5 h-3.5 mt-0.5 text-slate-400 flex-shrink-0" />
        <span>
          O terminal da aba "Terminal — {projectName}" abaixo e para comandos de shell pontuais (<code>npm install</code>, <code>git status</code>).
          Para o fluxo <code>/opensquad</code>, use o botao <strong>Abrir Claude Code</strong> acima.
        </span>
      </div>
    </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Tab: Documentacao
// ---------------------------------------------------------------------------
function DocsTab() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-3">Como usar o OpenSquad</h2>
      <p className="text-sm text-slate-600 mb-4">
        O OpenSquad e uma skill que ajuda equipes de marketing a estruturar e gerar conteudo com IA.
      </p>

      <h3 className="text-base font-semibold text-slate-800 mt-5 mb-2">Fluxo basico</h3>
      <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1.5">
        <li>Va em <strong>Novo Projeto</strong>, informe o nome e clique Inicializar.</li>
        <li>Clique no terminal para ativa-lo e use <kbd className="px-1 py-0.5 bg-slate-100 rounded border text-xs">↑↓</kbd> + <kbd className="px-1 py-0.5 bg-slate-100 rounded border text-xs">Enter</kbd> para responder o setup.</li>
        <li>Apos concluir, va em <strong>Meus Projetos</strong> e selecione o projeto.</li>
        <li>Use o <strong>Terminal</strong> do projeto para executar comandos dentro dele.</li>
      </ol>

      <h3 className="text-base font-semibold text-slate-800 mt-5 mb-2">Fluxo completo</h3>
      <pre className="bg-slate-900 text-slate-100 rounded-lg p-3 text-xs font-mono">
{`# 1. Inicializa o projeto (feito pelo botao na aba Novo Projeto)
npx --yes opensquad init

# 2. Abrir a pasta no VS Code (feito pelo botao na aba Meus Projetos)
code <caminho-do-projeto>

# 3. Dentro do terminal do VS Code, rodar o Claude Code:
claude

# 4. Dentro do Claude Code, usar o slash-command:
/opensquad`}
      </pre>

      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>
          <strong>Importante:</strong> <code>/opensquad</code> e um slash-command do Claude Code — so funciona dentro dele, nao no terminal normal.
        </span>
      </div>

      <h3 className="text-base font-semibold text-slate-800 mt-5 mb-2">Excluir projetos</h3>
      <p className="text-sm text-slate-600">
        Na aba <strong>Meus Projetos</strong>, clique no icone de lixeira ao lado do projeto. Uma confirmacao sera exibida antes de deletar.
      </p>
    </div>
  )
}
