import { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { Loader2, X, AlertCircle } from 'lucide-react'

/**
 * Terminal xterm.js conectado a uma sessao pty no backend via SSE.
 *
 * Props:
 *   projectName  - nome do projeto (pasta em opensquad-projects)
 *   command      - comando inicial (default: "claude"). Use "shell" para shell puro.
 *   onClose      - callback quando o usuario fecha
 *   autoStart    - inicia automaticamente (default: true)
 */
export default function XtermTerminal({ projectName, command = 'claude', onClose, autoStart = true }) {
  const containerRef = useRef(null)
  const termRef = useRef(null)
  const fitRef = useRef(null)
  const sessionIdRef = useRef(null)
  const eventSourceRef = useRef(null)
  const [status, setStatus] = useState('idle') // idle | starting | running | exited | error
  const [error, setError] = useState('')

  // Inicializa o xterm
  useEffect(() => {
    if (!containerRef.current) return

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace',
      fontSize: 13,
      theme: {
        background: '#0f172a',
        foreground: '#e2e8f0',
        cursor: '#f43f5e',
        selectionBackground: '#f43f5e44',
      },
      scrollback: 5000,
      convertEol: true,
    })

    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(containerRef.current)

    // Fit inicial (com delay para o container ter dimensoes)
    setTimeout(() => {
      try { fit.fit() } catch {}
    }, 50)

    termRef.current = term
    fitRef.current = fit

    // Envia input do xterm para o backend
    term.onData(async (data) => {
      if (!sessionIdRef.current) return
      try {
        await fetch(`/api/terminal/input/${sessionIdRef.current}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data }),
        })
      } catch (err) {
        console.error('input error:', err)
      }
    })

    // Envia resize para o backend
    term.onResize(async ({ cols, rows }) => {
      if (!sessionIdRef.current) return
      try {
        await fetch(`/api/terminal/resize/${sessionIdRef.current}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cols, rows }),
        })
      } catch {}
    })

    // Handler de resize com DEBOUNCE para nao bombardear o pty com resizes
    // (cada resize faz o Claude Code re-renderizar, causando artefatos visuais)
    let resizeTimeout = null
    let lastDims = { cols: 0, rows: 0 }
    const debouncedFit = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        try {
          fit.fit()
          const { cols, rows } = term
          // So redesenha se mudou de verdade
          if (cols !== lastDims.cols || rows !== lastDims.rows) {
            lastDims = { cols, rows }
            // Forca um "clear + redraw" da tela para eliminar artefatos
            term.refresh(0, term.rows - 1)
          }
        } catch {}
      }, 150)
    }
    window.addEventListener('resize', debouncedFit)

    // ResizeObserver para reagir quando o container muda de tamanho (modal abrindo, etc)
    let ro = null
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(debouncedFit)
      ro.observe(containerRef.current)
    }

    return () => {
      clearTimeout(resizeTimeout)
      window.removeEventListener('resize', debouncedFit)
      ro?.disconnect()
      if (eventSourceRef.current) eventSourceRef.current.close()
      // Fecha sessao no backend
      if (sessionIdRef.current) {
        fetch(`/api/terminal/close/${sessionIdRef.current}`, { method: 'POST' }).catch(() => {})
      }
      term.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Inicia a sessao
  const startSession = async () => {
    if (!termRef.current) return
    setStatus('starting'); setError('')
    termRef.current.clear()

    // Garante que o fit rodou antes de pegar cols/rows finais
    try { fitRef.current?.fit() } catch {}
    // Aguarda um frame para o layout estabilizar
    await new Promise(r => requestAnimationFrame(() => r()))
    try { fitRef.current?.fit() } catch {}

    try {
      const { cols, rows } = termRef.current
      const res = await fetch('/api/terminal/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName, command, cols, rows }),
      })
      const text = await res.text()
      let data
      try { data = JSON.parse(text) } catch {
        throw new Error(`Resposta invalida: ${text.slice(0, 200)}`)
      }
      if (!res.ok) throw new Error(data.error || 'Falha ao iniciar sessao')

      sessionIdRef.current = data.sessionId
      setStatus('running')

      // Conecta no SSE
      const es = new EventSource(`/api/terminal/stream/${data.sessionId}`)
      eventSourceRef.current = es

      es.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data)
          if (msg.type === 'output') {
            termRef.current?.write(msg.data)
          } else if (msg.type === 'exit') {
            termRef.current?.writeln(`\r\n\x1b[33m[processo finalizado — codigo ${msg.exitCode}]\x1b[0m`)
            setStatus('exited')
            es.close()
          }
        } catch {}
      }

      es.onerror = () => {
        setStatus(prev => prev === 'running' ? 'exited' : prev)
      }

      termRef.current.focus()
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  useEffect(() => {
    if (autoStart) startSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const close = async () => {
    if (sessionIdRef.current) {
      try {
        await fetch(`/api/terminal/close/${sessionIdRef.current}`, { method: 'POST' })
      } catch {}
    }
    onClose?.()
  }

  return (
    <div className="flex flex-col bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-xl h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2 text-sm text-slate-200">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span className="font-medium">{command}</span>
          <span className="text-slate-500">—</span>
          <span className="text-slate-400 text-xs">{projectName}</span>
          <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase
            ${status === 'running' ? 'bg-emerald-500/20 text-emerald-300' : ''}
            ${status === 'starting' ? 'bg-amber-500/20 text-amber-300' : ''}
            ${status === 'exited' ? 'bg-slate-500/20 text-slate-300' : ''}
            ${status === 'error' ? 'bg-red-500/20 text-red-300' : ''}
          `}>
            {status === 'starting' && <Loader2 className="w-3 h-3 animate-spin inline-block mr-1" />}
            {status}
          </span>
        </div>
        <div className="flex gap-1">
          {(status === 'exited' || status === 'error') && (
            <button
              onClick={startSession}
              className="text-xs px-2 py-1 text-slate-300 hover:bg-slate-700 rounded"
            >
              Reiniciar
            </button>
          )}
          {onClose && (
            <button onClick={close} className="p-1 text-slate-400 hover:bg-slate-700 rounded">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="px-4 py-2 bg-red-900/40 text-red-200 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Terminal */}
      <div
        ref={containerRef}
        className="flex-1 p-2 min-h-0"
        style={{ minHeight: '200px' }}
      />
    </div>
  )
}
