import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '@components/Header'
import {
  ArrowLeft,
  FileText,
  Search,
  ClipboardPaste,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  Info,
  Sparkles,
  ExternalLink,
  FileDown,
  Presentation,
  ShieldCheck,
  Upload,
  Trash2,
  KeyRound,
  Lock,
  Unlock,
  RefreshCw,
  Bot,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

// ============================================================
// LISTA DE TRIBUNAIS
// ============================================================
const tribunais = [
  { key: 'stf',  label: 'STF  - Supremo Tribunal Federal',              group: 'Superiores' },
  { key: 'stj',  label: 'STJ  - Superior Tribunal de Justica',          group: 'Superiores' },
  { key: 'tst',  label: 'TST  - Tribunal Superior do Trabalho',         group: 'Superiores' },
  { key: 'trf1', label: 'TRF1 - Tribunal Regional Federal 1a Regiao',   group: 'Justica Federal' },
  { key: 'trf2', label: 'TRF2 - Tribunal Regional Federal 2a Regiao',   group: 'Justica Federal' },
  { key: 'trf3', label: 'TRF3 - Tribunal Regional Federal 3a Regiao',   group: 'Justica Federal' },
  { key: 'trf4', label: 'TRF4 - Tribunal Regional Federal 4a Regiao',   group: 'Justica Federal' },
  { key: 'trf5', label: 'TRF5 - Tribunal Regional Federal 5a Regiao',   group: 'Justica Federal' },
  { key: 'trf6', label: 'TRF6 - Tribunal Regional Federal 6a Regiao',   group: 'Justica Federal' },
  { key: 'trt1',  label: 'TRT1  - 1a Regiao (Rio de Janeiro)',          group: 'Justica do Trabalho' },
  { key: 'trt2',  label: 'TRT2  - 2a Regiao (Sao Paulo Capital)',       group: 'Justica do Trabalho' },
  { key: 'trt3',  label: 'TRT3  - 3a Regiao (Minas Gerais)',            group: 'Justica do Trabalho' },
  { key: 'trt4',  label: 'TRT4  - 4a Regiao (Rio Grande do Sul)',       group: 'Justica do Trabalho' },
  { key: 'trt5',  label: 'TRT5  - 5a Regiao (Bahia)',                   group: 'Justica do Trabalho' },
  { key: 'trt6',  label: 'TRT6  - 6a Regiao (Pernambuco)',              group: 'Justica do Trabalho' },
  { key: 'trt7',  label: 'TRT7  - 7a Regiao (Ceara)',                   group: 'Justica do Trabalho' },
  { key: 'trt8',  label: 'TRT8  - 8a Regiao (Para e Amapa)',            group: 'Justica do Trabalho' },
  { key: 'trt9',  label: 'TRT9  - 9a Regiao (Parana)',                  group: 'Justica do Trabalho' },
  { key: 'trt10', label: 'TRT10 - 10a Regiao (DF e Tocantins)',         group: 'Justica do Trabalho' },
  { key: 'trt11', label: 'TRT11 - 11a Regiao (Amazonas e Roraima)',     group: 'Justica do Trabalho' },
  { key: 'trt12', label: 'TRT12 - 12a Regiao (Santa Catarina)',         group: 'Justica do Trabalho' },
  { key: 'trt13', label: 'TRT13 - 13a Regiao (Paraiba)',                group: 'Justica do Trabalho' },
  { key: 'trt14', label: 'TRT14 - 14a Regiao (Rondonia e Acre)',        group: 'Justica do Trabalho' },
  { key: 'trt15', label: 'TRT15 - 15a Regiao (Campinas/SP)',            group: 'Justica do Trabalho' },
  { key: 'trt16', label: 'TRT16 - 16a Regiao (Maranhao)',               group: 'Justica do Trabalho' },
  { key: 'trt17', label: 'TRT17 - 17a Regiao (Espirito Santo)',         group: 'Justica do Trabalho' },
  { key: 'trt18', label: 'TRT18 - 18a Regiao (Goias)',                  group: 'Justica do Trabalho' },
  { key: 'trt19', label: 'TRT19 - 19a Regiao (Alagoas)',                group: 'Justica do Trabalho' },
  { key: 'trt20', label: 'TRT20 - 20a Regiao (Sergipe)',                group: 'Justica do Trabalho' },
  { key: 'trt21', label: 'TRT21 - 21a Regiao (Rio Grande do Norte)',    group: 'Justica do Trabalho' },
  { key: 'trt22', label: 'TRT22 - 22a Regiao (Piaui)',                  group: 'Justica do Trabalho' },
  { key: 'trt23', label: 'TRT23 - 23a Regiao (Mato Grosso)',            group: 'Justica do Trabalho' },
  { key: 'trt24', label: 'TRT24 - 24a Regiao (Mato Grosso do Sul)',     group: 'Justica do Trabalho' },
  { key: 'tjac', label: 'TJAC - Tribunal de Justica do Acre',           group: 'Justica Estadual' },
  { key: 'tjal', label: 'TJAL - Tribunal de Justica de Alagoas',        group: 'Justica Estadual' },
  { key: 'tjap', label: 'TJAP - Tribunal de Justica do Amapa',          group: 'Justica Estadual' },
  { key: 'tjam', label: 'TJAM - Tribunal de Justica do Amazonas',       group: 'Justica Estadual' },
  { key: 'tjba', label: 'TJBA - Tribunal de Justica da Bahia',          group: 'Justica Estadual' },
  { key: 'tjce', label: 'TJCE - Tribunal de Justica do Ceara',          group: 'Justica Estadual' },
  { key: 'tjdft',label: 'TJDFT - Tribunal de Justica do DF',            group: 'Justica Estadual' },
  { key: 'tjes', label: 'TJES - Tribunal de Justica do Espirito Santo', group: 'Justica Estadual' },
  { key: 'tjgo', label: 'TJGO - Tribunal de Justica de Goias',          group: 'Justica Estadual' },
  { key: 'tjma', label: 'TJMA - Tribunal de Justica do Maranhao',       group: 'Justica Estadual' },
  { key: 'tjmt', label: 'TJMT - Tribunal de Justica de Mato Grosso',    group: 'Justica Estadual' },
  { key: 'tjms', label: 'TJMS - Tribunal de Justica de MS',             group: 'Justica Estadual' },
  { key: 'tjmg', label: 'TJMG - Tribunal de Justica de Minas Gerais',   group: 'Justica Estadual' },
  { key: 'tjpa', label: 'TJPA - Tribunal de Justica do Para',           group: 'Justica Estadual' },
  { key: 'tjpb', label: 'TJPB - Tribunal de Justica da Paraiba',        group: 'Justica Estadual' },
  { key: 'tjpr', label: 'TJPR - Tribunal de Justica do Parana',         group: 'Justica Estadual' },
  { key: 'tjpe', label: 'TJPE - Tribunal de Justica de Pernambuco',     group: 'Justica Estadual' },
  { key: 'tjpi', label: 'TJPI - Tribunal de Justica do Piaui',          group: 'Justica Estadual' },
  { key: 'tjrj', label: 'TJRJ - Tribunal de Justica do Rio de Janeiro', group: 'Justica Estadual' },
  { key: 'tjrn', label: 'TJRN - Tribunal de Justica do RN',             group: 'Justica Estadual' },
  { key: 'tjrs', label: 'TJRS - Tribunal de Justica do RS',             group: 'Justica Estadual' },
  { key: 'tjro', label: 'TJRO - Tribunal de Justica de Rondonia',       group: 'Justica Estadual' },
  { key: 'tjrr', label: 'TJRR - Tribunal de Justica de Roraima',        group: 'Justica Estadual' },
  { key: 'tjsc', label: 'TJSC - Tribunal de Justica de Santa Catarina', group: 'Justica Estadual' },
  { key: 'tjsp', label: 'TJSP - Tribunal de Justica de Sao Paulo',      group: 'Justica Estadual' },
  { key: 'tjse', label: 'TJSE - Tribunal de Justica de Sergipe',        group: 'Justica Estadual' },
  { key: 'tjto', label: 'TJTO - Tribunal de Justica de Tocantins',      group: 'Justica Estadual' },
]

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function RelatoriosProcessuais() {
  const navigate = useNavigate()

  // Abas principais
  const [aba, setAba] = useState('busca')

  // --- Busca automatica ---
  const [numeroProcesso, setNumeroProcesso] = useState('')
  const [tribunal, setTribunal] = useState('tjsp')
  const [buscando, setBuscando] = useState(false)
  const [erroBusca, setErroBusca] = useState('')
  const [fonteBusca, setFonteBusca] = useState('')

  // Certificado selecionado para busca
  const [usarCertificado, setUsarCertificado] = useState(false)
  const [certSelecionado, setCertSelecionado] = useState('')

  // --- Processo carregado ---
  const [processo, setProcesso] = useState(null)

  // --- Entrada manual ---
  const [manualNumero, setManualNumero] = useState('')
  const [manualTribunal, setManualTribunal] = useState('')
  const [manualClasse, setManualClasse] = useState('')
  const [manualAssunto, setManualAssunto] = useState('')
  const [manualPartes, setManualPartes] = useState('')
  const [manualAndamentos, setManualAndamentos] = useState('')

  // --- Relatorio ---
  const [cliente, setCliente] = useState('')
  const [responsavel, setResponsavel] = useState('')
  const [resumo, setResumo] = useState('')
  const [statusAtual, setStatusAtual] = useState('')
  const [proximosPassos, setProximosPassos] = useState('')
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false)
  const [erroRelatorio, setErroRelatorio] = useState('')

  // --- Resumo com IA ---
  const [gerandoIA, setGerandoIA] = useState(false)
  const [erroIA, setErroIA] = useState('')
  const [resumoIACompleto, setResumoIACompleto] = useState('')
  const [mostrarResumoIA, setMostrarResumoIA] = useState(false)

  // --- Certificados A1 ---
  const [certificados, setCertificados] = useState([])
  const [carregandoCerts, setCarregandoCerts] = useState(false)
  const [modalCert, setModalCert] = useState(false)
  const [novoCertNome, setNovoCertNome] = useState('')
  const [novoCertAdvogado, setNovoCertAdvogado] = useState('')
  const [novoCertOAB, setNovoCertOAB] = useState('')
  const [novoCertSenha, setNovoCertSenha] = useState('')
  const [novoCertSenhaVis, setNovoCertSenhaVis] = useState(false)
  const [novoCertArquivo, setNovoCertArquivo] = useState(null)
  const [salvandoCert, setSalvandoCert] = useState(false)
  const [erroCert, setErroCert] = useState('')
  const [removendoCert, setRemovendoCert] = useState(null)
  const fileInputRef = useRef(null)

  // Carrega certificados ao montar e ao mudar de aba
  useEffect(() => {
    carregarCertificados()
  }, [])

  const carregarCertificados = async () => {
    setCarregandoCerts(true)
    try {
      const r = await fetch('/api/processos/certificados')
      const data = await r.json()
      if (data.success) setCertificados(data.certificados || [])
    } catch { /* silencioso */ } finally {
      setCarregandoCerts(false)
    }
  }

  // ============================================================
  // ACOES: BUSCA
  // ============================================================
  const buscarProcesso = async () => {
    setErroBusca('')
    setFonteBusca('')
    if (!numeroProcesso.trim()) { setErroBusca('Informe o numero do processo'); return }

    setBuscando(true)
    try {
      let endpoint = '/api/processos/buscar'
      let body = { numero: numeroProcesso.trim(), tribunal }

      if (usarCertificado && certSelecionado) {
        endpoint = '/api/processos/buscar-autenticado'
        body = { numero: numeroProcesso.trim(), tribunal, certificadoId: certSelecionado }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.message || 'Nao foi possivel buscar o processo')

      setProcesso(data.processo)
      setFonteBusca(data.fonte || '')
      setResumoIACompleto('')
      setMostrarResumoIA(false)
      setErroIA('')
    } catch (err) {
      setErroBusca(err.message)
      setProcesso(null)
    } finally {
      setBuscando(false)
    }
  }

  const carregarManual = () => {
    const linhas = manualAndamentos.split('\n').filter(l => l.trim())
    const andamentos = linhas.map((linha, idx) => {
      const matchData = linha.match(/(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})/)
      const data = matchData ? matchData[1] : ''
      const descricao = data ? linha.replace(data, '').replace(/^[\s\-\t:]+/, '').trim() : linha.trim()
      return { data, descricao, ordem: idx + 1 }
    })
    const partes = manualPartes.split('\n').filter(p => p.trim()).map(p => p.trim())
    setProcesso({
      numero: manualNumero || 'Nao informado',
      tribunal: manualTribunal || 'Nao informado',
      classe: manualClasse || 'Nao informada',
      assunto: manualAssunto || 'Nao informado',
      dataAjuizamento: '',
      partes,
      andamentos,
      origem: 'manual',
    })
    setResumoIACompleto('')
    setMostrarResumoIA(false)
  }

  // ============================================================
  // ACOES: RESUMO COM IA
  // ============================================================
  const gerarResumoIA = async () => {
    if (!processo) return
    setGerandoIA(true)
    setErroIA('')
    setResumoIACompleto('')
    setMostrarResumoIA(false)

    try {
      const response = await fetch('/api/processos/resumo-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processo }),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.message || 'Falha ao gerar resumo')

      setResumoIACompleto(data.resumoCompleto || '')
      setMostrarResumoIA(true)

      // Preenche os campos do relatorio automaticamente
      if (data.secoes?.resumo && !resumo) setResumo(data.secoes.resumo)
      if (data.secoes?.statusAtual && !statusAtual) setStatusAtual(data.secoes.statusAtual)
      if (data.secoes?.proximosPassos && !proximosPassos) setProximosPassos(data.secoes.proximosPassos)
    } catch (err) {
      setErroIA(err.message)
    } finally {
      setGerandoIA(false)
    }
  }

  // ============================================================
  // ACOES: RELATORIO
  // ============================================================
  const gerarRelatorio = async () => {
    setErroRelatorio('')
    if (!processo) { setErroRelatorio('Nenhum processo carregado'); return }
    if (!cliente.trim()) { setErroRelatorio('Informe o nome do cliente'); return }
    setGerandoRelatorio(true)
    try {
      const response = await fetch('/api/processos/gerar-relatorio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          processo,
          cliente: cliente.trim(),
          responsavel: responsavel.trim(),
          resumo: resumo.trim(),
          statusAtual: statusAtual.trim(),
          proximosPassos: proximosPassos.trim(),
        }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.message || 'Falha ao gerar relatorio')
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Relatorio_${(processo.numero || 'processo').replace(/[^\w]/g, '_')}.docx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setErroRelatorio(err.message)
    } finally {
      setGerandoRelatorio(false)
    }
  }

  const limparTudo = () => {
    setProcesso(null)
    setNumeroProcesso('')
    setManualNumero(''); setManualTribunal(''); setManualClasse('')
    setManualAssunto(''); setManualPartes(''); setManualAndamentos('')
    setCliente(''); setResponsavel(''); setResumo('')
    setStatusAtual(''); setProximosPassos('')
    setErroBusca(''); setErroRelatorio(''); setErroIA('')
    setResumoIACompleto(''); setMostrarResumoIA(false)
    setFonteBusca('')
  }

  // ============================================================
  // ACOES: CERTIFICADOS
  // ============================================================
  const salvarCertificado = async () => {
    setErroCert('')
    if (!novoCertNome.trim()) { setErroCert('Informe um nome para identificar o certificado'); return }
    if (!novoCertArquivo) { setErroCert('Selecione o arquivo .pfx do certificado'); return }
    if (!novoCertSenha.trim()) { setErroCert('Informe a senha do certificado'); return }

    setSalvandoCert(true)
    try {
      // Le o arquivo como base64
      const pfxBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = e => resolve(e.target.result.split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(novoCertArquivo)
      })

      const response = await fetch('/api/processos/certificado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: novoCertNome.trim(),
          advogado: novoCertAdvogado.trim(),
          oab: novoCertOAB.trim(),
          pfxBase64,
          senha: novoCertSenha,
        }),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.message || 'Erro ao salvar certificado')

      // Limpa e fecha modal
      setNovoCertNome(''); setNovoCertAdvogado(''); setNovoCertOAB('')
      setNovoCertSenha(''); setNovoCertArquivo(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setModalCert(false)
      await carregarCertificados()
    } catch (err) {
      setErroCert(err.message)
    } finally {
      setSalvandoCert(false)
    }
  }

  const removerCertificado = async (id) => {
    if (!window.confirm('Remover este certificado? Esta acao nao pode ser desfeita.')) return
    setRemovendoCert(id)
    try {
      await fetch(`/api/processos/certificado/${id}`, { method: 'DELETE' })
      if (certSelecionado === id) setCertSelecionado('')
      await carregarCertificados()
    } catch { /* silencioso */ } finally {
      setRemovendoCert(null)
    }
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div>
      <Header title="Relatorios Processuais" subtitle="Juridico > Relatorios Processuais" />

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate('/juridico')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Juridico
        </button>

        {/* Cabecalho */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <FileText className="w-7 h-7 text-amber-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Relatorios Processuais</h1>
            <p className="text-slate-500">Consulte processos, gere resumos com IA e exporte relatorios profissionais.</p>
          </div>
        </div>

        {/* PASSO 1: Origem dos dados */}
        {!processo && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Abas */}
            <div className="border-b border-slate-200 flex">
              {[
                { key: 'busca', label: 'Busca automatica', icon: Search },
                { key: 'manual', label: 'Entrada manual', icon: ClipboardPaste },
                { key: 'certificados', label: `Certificados A1${certificados.length > 0 ? ` (${certificados.length})` : ''}`, icon: ShieldCheck },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setAba(key)}
                  className={`flex-1 px-4 py-4 font-medium transition-colors flex items-center justify-center gap-2 text-sm ${
                    aba === key
                      ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-500'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* ---- ABA BUSCA AUTOMATICA ---- */}
              {aba === 'busca' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 flex items-start gap-2">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                    Consulta pela API publica DataJud do CNJ. Com um certificado A1 cadastrado, tenta consulta autenticada diretamente no tribunal para obter dados mais completos.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Numero do processo</label>
                      <input
                        type="text"
                        value={numeroProcesso}
                        onChange={(e) => setNumeroProcesso(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && buscarProcesso()}
                        placeholder="0000000-00.0000.0.00.0000"
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tribunal</label>
                      <select
                        value={tribunal}
                        onChange={(e) => setTribunal(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      >
                        {['Superiores', 'Justica Federal', 'Justica do Trabalho', 'Justica Estadual'].map(grupo => (
                          <optgroup key={grupo} label={grupo}>
                            {tribunais.filter(t => t.group === grupo).map(t => (
                              <option key={t.key} value={t.key}>{t.label}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Opcao de certificado */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={usarCertificado}
                        onChange={e => setUsarCertificado(e.target.checked)}
                        className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                      />
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-medium text-slate-700">Usar certificado A1 (consulta autenticada — dados mais completos)</span>
                      </div>
                    </label>

                    {usarCertificado && (
                      certificados.length === 0 ? (
                        <div className="flex items-center gap-2 text-sm text-slate-500 ml-7">
                          <Info className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          Nenhum certificado cadastrado.{' '}
                          <button onClick={() => setAba('certificados')} className="text-amber-600 hover:underline font-medium">
                            Adicionar certificado
                          </button>
                        </div>
                      ) : (
                        <div className="ml-7">
                          <select
                            value={certSelecionado}
                            onChange={e => setCertSelecionado(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                          >
                            <option value="">Selecione o certificado...</option>
                            {certificados.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.nome}{c.advogado ? ` — ${c.advogado}` : ''}{c.oab ? ` (OAB ${c.oab})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      )
                    )}
                  </div>

                  {erroBusca && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex items-start gap-2">
                      <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      {erroBusca}
                    </div>
                  )}

                  <button
                    onClick={buscarProcesso}
                    disabled={buscando || (usarCertificado && !certSelecionado)}
                    className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg px-5 py-2.5 font-medium transition-colors"
                  >
                    {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : (usarCertificado && certSelecionado ? <ShieldCheck className="w-4 h-4" /> : <Search className="w-4 h-4" />)}
                    {buscando
                      ? (usarCertificado && certSelecionado ? 'Consultando com certificado...' : 'Buscando...')
                      : (usarCertificado && certSelecionado ? 'Buscar com certificado A1' : 'Buscar processo')}
                  </button>
                </div>
              )}

              {/* ---- ABA MANUAL ---- */}
              {aba === 'manual' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 flex items-start gap-2">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                    Cole os dados do processo diretamente. Ideal para tribunais sem integracao ou quando precisar de controle total sobre o conteudo.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Numero do processo</label>
                      <input type="text" value={manualNumero} onChange={e => setManualNumero(e.target.value)} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tribunal / Vara</label>
                      <input type="text" value={manualTribunal} onChange={e => setManualTribunal(e.target.value)} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Classe</label>
                      <input type="text" value={manualClasse} onChange={e => setManualClasse(e.target.value)} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Assunto</label>
                      <input type="text" value={manualAssunto} onChange={e => setManualAssunto(e.target.value)} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Partes (uma por linha)</label>
                    <textarea rows={3} value={manualPartes} onChange={e => setManualPartes(e.target.value)} placeholder={'Autor: Joao da Silva\nReu: Empresa X Ltda'} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Andamentos (um por linha)</label>
                    <textarea rows={8} value={manualAndamentos} onChange={e => setManualAndamentos(e.target.value)} placeholder={'01/04/2026 - Audiencia designada\n15/03/2026 - Juntada de peticao\n10/03/2026 - Distribuicao'} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-sm" />
                    <p className="text-xs text-slate-500 mt-1">Dica: cole do site do tribunal. O sistema detecta datas automaticamente.</p>
                  </div>
                  <button onClick={carregarManual} disabled={!manualAndamentos.trim()} className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white rounded-lg px-5 py-2.5 font-medium transition-colors">
                    <CheckCircle2 className="w-4 h-4" />
                    Carregar dados do processo
                  </button>
                </div>
              )}

              {/* ---- ABA CERTIFICADOS A1 ---- */}
              {aba === 'certificados' && (
                <div className="space-y-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-1">Certificados A1 cadastrados</h3>
                      <p className="text-sm text-slate-500">
                        Adicione o certificado digital do advogado (arquivo .pfx) para consultas autenticadas diretamente nos tribunais, obtendo dados mais completos como documentos, decisoes e valores.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={carregarCertificados} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100" title="Atualizar lista">
                        <RefreshCw className={`w-4 h-4 ${carregandoCerts ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => { setModalCert(true); setErroCert('') }}
                        className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        Adicionar certificado
                      </button>
                    </div>
                  </div>

                  {/* Aviso de segurança */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 flex items-start gap-3">
                    <Lock className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
                    <div>
                      <strong>Armazenamento seguro:</strong> Os arquivos .pfx sao armazenados apenas no servidor interno da rede. As senhas sao criptografadas com AES-256 antes de serem salvas. Nenhum dado e transmitido para fora da rede local.
                    </div>
                  </div>

                  {/* Lista de certificados */}
                  {carregandoCerts ? (
                    <div className="flex items-center gap-2 text-slate-500 text-sm py-4">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Carregando...
                    </div>
                  ) : certificados.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <KeyRound className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p className="font-medium">Nenhum certificado cadastrado</p>
                      <p className="text-sm mt-1">Clique em "Adicionar certificado" para comecar.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {certificados.map(cert => (
                        <div key={cert.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
                          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-800">{cert.nome}</div>
                            <div className="text-sm text-slate-500 flex items-center gap-3 mt-0.5">
                              {cert.advogado && <span>{cert.advogado}</span>}
                              {cert.oab && <span className="bg-slate-100 px-2 py-0.5 rounded text-xs">OAB {cert.oab}</span>}
                              <span className="text-xs text-slate-400">
                                Adicionado em {new Date(cert.criadoEm).toLocaleDateString('pt-BR')}
                              </span>
                              <span className="text-xs text-slate-400">
                                {Math.round((cert.tamanho || 0) / 1024)} KB
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => removerCertificado(cert.id)}
                            disabled={removendoCert === cert.id}
                            className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                            title="Remover certificado"
                          >
                            {removendoCert === cert.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Informacoes sobre sistemas suportados */}
                  <details className="border border-slate-200 rounded-xl overflow-hidden">
                    <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 flex items-center gap-2">
                      <Info className="w-4 h-4 text-amber-500" />
                      Sistemas de tribunal suportados para consulta autenticada
                    </summary>
                    <div className="p-4 text-sm text-slate-600 space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          { nome: 'PJe', desc: 'Sistema mais utilizado na Justica Federal, Trabalhista e varios TJs (TJSP, TJMG, TJRJ, TJBA, TJCE, TJPE, TJGO e outros)', cor: 'emerald' },
                          { nome: 'PROJUDI', desc: 'Utilizado principalmente pelo TJPR e alguns outros tribunais estaduais', cor: 'blue' },
                          { nome: 'EPROC', desc: 'Utilizado no TRF4, TJSC e outros tribunais do Sul do pais', cor: 'purple' },
                          { nome: 'DataJud (fallback)', desc: 'API publica do CNJ, usada como alternativa quando o sistema do tribunal nao responde ou nao e suportado', cor: 'amber' },
                        ].map(s => (
                          <div key={s.nome} className="flex items-start gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-${s.cor}-100 text-${s.cor}-700 flex-shrink-0`}>{s.nome}</span>
                            <span className="text-slate-500 text-xs">{s.desc}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-200">
                        O certificado deve ser o mesmo utilizado pelo advogado para assinar peticionamentos no tribunal correspondente. Certificados ICP-Brasil (e-CPF ou e-CNPJ) sao aceitos pela maioria dos sistemas.
                      </p>
                    </div>
                  </details>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PASSO 2: Processo carregado */}
        {processo && (
          <>
            {/* Card processo */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Processo carregado</h3>
                    <p className="text-sm text-slate-500">
                      {processo.origem === 'manual'
                        ? 'Dados inseridos manualmente'
                        : processo.origem === 'pje-certificado'
                          ? 'Dados obtidos via PJe com certificado A1'
                          : processo.origem === 'datajud-com-cert-fallback'
                            ? 'DataJud (certificado carregado, tribunal sem PJe direto)'
                            : 'Dados obtidos via DataJud/CNJ'}
                      {fonteBusca && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded px-2 py-0.5">
                          <ShieldCheck className="w-3 h-3" />
                          {fonteBusca}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <button onClick={limparTudo} className="text-sm text-slate-500 hover:text-slate-700">
                  Limpar e comecar de novo
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div><span className="text-slate-500">Numero:</span> <span className="font-medium text-slate-800">{processo.numero}</span></div>
                <div><span className="text-slate-500">Tribunal:</span> <span className="font-medium text-slate-800">{processo.tribunal}</span></div>
                <div><span className="text-slate-500">Classe:</span> <span className="font-medium text-slate-800">{processo.classe}</span></div>
                <div><span className="text-slate-500">Assunto:</span> <span className="font-medium text-slate-800">{processo.assunto}</span></div>
                {processo.valorCausa && (
                  <div><span className="text-slate-500">Valor da causa:</span> <span className="font-medium text-slate-800">{processo.valorCausa}</span></div>
                )}
                {processo.dataAjuizamento && (
                  <div><span className="text-slate-500">Ajuizamento:</span> <span className="font-medium text-slate-800">{processo.dataAjuizamento}</span></div>
                )}
                {processo.partes?.length > 0 && (
                  <div className="md:col-span-2">
                    <span className="text-slate-500">Partes:</span>
                    <ul className="mt-1 list-disc ml-5">
                      {processo.partes.map((p, i) => <li key={i} className="text-slate-700">{p}</li>)}
                    </ul>
                  </div>
                )}
                <div className="md:col-span-2">
                  <span className="text-slate-500">Andamentos:</span> <span className="font-medium text-slate-800">{processo.andamentos?.length || 0} registros</span>
                </div>
              </div>

              {processo.andamentos?.length > 0 && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-amber-600 hover:text-amber-700">Ver todos os andamentos</summary>
                  <div className="mt-3 max-h-64 overflow-y-auto border border-slate-200 rounded-lg p-3 space-y-2">
                    {processo.andamentos.map((a, i) => (
                      <div key={i} className="text-sm border-l-2 border-amber-200 pl-3">
                        {a.data && <span className="font-medium text-slate-700">{a.data} — </span>}
                        <span className="text-slate-600">{a.descricao}</span>
                        {a.complemento && <span className="text-slate-400 text-xs ml-1">[{a.complemento}]</span>}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>

            {/* Bloco de Resumo com IA */}
            <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl border border-violet-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                  <Bot className="w-6 h-6 text-violet-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800 mb-1">Gerar resumo com Inteligencia Artificial</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    A IA analisa todos os dados do processo e gera automaticamente o resumo, status atual e proximos passos — prontos para serem usados no relatorio.
                  </p>

                  {erroIA && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-3 flex items-start gap-2">
                      <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      {erroIA}
                    </div>
                  )}

                  <button
                    onClick={gerarResumoIA}
                    disabled={gerandoIA}
                    className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white rounded-lg px-5 py-2.5 font-medium transition-colors"
                  >
                    {gerandoIA ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {gerandoIA ? 'Analisando processo... (pode levar ate 1 minuto)' : 'Gerar resumo com IA'}
                  </button>

                  {/* Resultado da IA */}
                  {resumoIACompleto && (
                    <div className="mt-4">
                      <button
                        onClick={() => setMostrarResumoIA(v => !v)}
                        className="flex items-center gap-2 text-sm font-medium text-violet-700 hover:text-violet-900"
                      >
                        {mostrarResumoIA ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {mostrarResumoIA ? 'Ocultar' : 'Ver'} resumo completo gerado pela IA
                      </button>
                      {mostrarResumoIA && (
                        <div className="mt-3 bg-white rounded-xl border border-violet-200 p-4 max-h-96 overflow-y-auto">
                          <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{resumoIACompleto}</pre>
                        </div>
                      )}
                      <p className="text-xs text-violet-600 mt-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Os campos "Resumo", "Status atual" e "Proximos passos" do relatorio foram preenchidos automaticamente. Voce pode editar antes de gerar o .docx.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Formulario do relatorio */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
              <h3 className="text-lg font-bold text-slate-800">Dados do relatorio</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cliente *</label>
                  <input
                    type="text"
                    value={cliente}
                    onChange={e => setCliente(e.target.value)}
                    placeholder="Nome do cliente destinatario"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Advogado responsavel</label>
                  <input
                    type="text"
                    value={responsavel}
                    onChange={e => setResponsavel(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Resumo do processo</label>
                <textarea
                  rows={5}
                  value={resumo}
                  onChange={e => setResumo(e.target.value)}
                  placeholder="Contextualize brevemente o caso, as partes envolvidas e o objeto da acao. Use o botao 'Gerar com IA' acima para preencher automaticamente."
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status atual</label>
                <textarea
                  rows={4}
                  value={statusAtual}
                  onChange={e => setStatusAtual(e.target.value)}
                  placeholder="Em que fase esta o processo, ultimos acontecimentos relevantes, decisoes importantes."
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Proximos passos</label>
                <textarea
                  rows={3}
                  value={proximosPassos}
                  onChange={e => setProximosPassos(e.target.value)}
                  placeholder="O que sera feito na sequencia, prazos, audiencias previstas."
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {erroRelatorio && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex items-start gap-2">
                  <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {erroRelatorio}
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-200">
                <button
                  onClick={gerarRelatorio}
                  disabled={gerandoRelatorio}
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg px-5 py-2.5 font-medium transition-colors"
                >
                  {gerandoRelatorio ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                  {gerandoRelatorio ? 'Gerando...' : 'Gerar relatorio Word (.docx)'}
                </button>
              </div>
            </div>

            {/* Canva */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                  <Presentation className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800 mb-1">Inserir no modelo do Canva</h3>
                  <p className="text-sm text-slate-600 mb-4">Depois de gerar o relatorio Word, importe o conteudo no seu modelo de apresentacao do Canva.</p>
                  <ol className="list-decimal ml-5 space-y-1.5 text-sm text-slate-700">
                    <li>Baixe o relatorio .docx clicando no botao acima</li>
                    <li>Abra seu modelo no Canva</li>
                    <li>Va em <strong>Arquivo &gt; Importar</strong> e selecione o .docx</li>
                    <li>Copie os blocos de texto para os slides do modelo</li>
                  </ol>
                  <a href="https://www.canva.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-4 text-purple-700 hover:text-purple-900 font-medium text-sm">
                    <ExternalLink className="w-4 h-4" />
                    Abrir Canva em nova aba
                  </a>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL: Adicionar certificado                                  */}
      {/* ============================================================ */}
      {modalCert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Adicionar certificado A1</h2>
              </div>
              <button onClick={() => setModalCert(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do certificado *</label>
                <input
                  type="text"
                  value={novoCertNome}
                  onChange={e => setNovoCertNome(e.target.value)}
                  placeholder="Ex: Certificado Dra. Ana Silva"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Advogado</label>
                  <input
                    type="text"
                    value={novoCertAdvogado}
                    onChange={e => setNovoCertAdvogado(e.target.value)}
                    placeholder="Nome completo"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">OAB</label>
                  <input
                    type="text"
                    value={novoCertOAB}
                    onChange={e => setNovoCertOAB(e.target.value)}
                    placeholder="Ex: SP 123456"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Arquivo .pfx *</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-colors"
                >
                  {novoCertArquivo ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                      {novoCertArquivo.name} ({Math.round(novoCertArquivo.size / 1024)} KB)
                    </div>
                  ) : (
                    <div className="text-sm text-slate-400">
                      <Upload className="w-6 h-6 mx-auto mb-1 opacity-50" />
                      Clique para selecionar o arquivo .pfx
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pfx,.p12"
                  className="hidden"
                  onChange={e => setNovoCertArquivo(e.target.files?.[0] || null)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Senha do certificado *</label>
                <div className="relative">
                  <input
                    type={novoCertSenhaVis ? 'text' : 'password'}
                    value={novoCertSenha}
                    onChange={e => setNovoCertSenha(e.target.value)}
                    placeholder="Senha do arquivo .pfx"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setNovoCertSenhaVis(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {novoCertSenhaVis ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {erroCert && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex items-start gap-2">
                  <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {erroCert}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 p-6 border-t border-slate-200">
              <button
                onClick={salvarCertificado}
                disabled={salvandoCert}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg px-4 py-2.5 font-medium transition-colors"
              >
                {salvandoCert ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {salvandoCert ? 'Salvando...' : 'Salvar certificado'}
              </button>
              <button onClick={() => setModalCert(false)} className="px-4 py-2.5 text-slate-600 hover:text-slate-800 font-medium text-sm">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
