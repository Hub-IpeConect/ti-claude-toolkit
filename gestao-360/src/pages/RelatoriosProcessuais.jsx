import { useState } from 'react'
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
} from 'lucide-react'

// Tribunais disponiveis para busca (API DataJud/CNJ)
const tribunais = [
  // --- Superiores ---
  { key: 'stf',  label: 'STF  - Supremo Tribunal Federal',              group: 'Superiores' },
  { key: 'stj',  label: 'STJ  - Superior Tribunal de Justica',          group: 'Superiores' },
  { key: 'tst',  label: 'TST  - Tribunal Superior do Trabalho',         group: 'Superiores' },

  // --- Justica Federal (TRFs) ---
  { key: 'trf1', label: 'TRF1 - Tribunal Regional Federal 1a Regiao (DF, GO, MT, PA, AM, BA, PI, MA, TO, AC, RO, RR, AP)', group: 'Justica Federal' },
  { key: 'trf2', label: 'TRF2 - Tribunal Regional Federal 2a Regiao (RJ, ES)',  group: 'Justica Federal' },
  { key: 'trf3', label: 'TRF3 - Tribunal Regional Federal 3a Regiao (SP, MS)',  group: 'Justica Federal' },
  { key: 'trf4', label: 'TRF4 - Tribunal Regional Federal 4a Regiao (PR, SC, RS)', group: 'Justica Federal' },
  { key: 'trf5', label: 'TRF5 - Tribunal Regional Federal 5a Regiao (PE, CE, AL, PB, RN, SE)', group: 'Justica Federal' },
  { key: 'trf6', label: 'TRF6 - Tribunal Regional Federal 6a Regiao (MG)',      group: 'Justica Federal' },

  // --- Justica do Trabalho (TRTs) ---
  { key: 'trt1',  label: 'TRT1  - 1a Regiao (Rio de Janeiro)',                   group: 'Justica do Trabalho' },
  { key: 'trt2',  label: 'TRT2  - 2a Regiao (Sao Paulo Capital)',                group: 'Justica do Trabalho' },
  { key: 'trt3',  label: 'TRT3  - 3a Regiao (Minas Gerais)',                     group: 'Justica do Trabalho' },
  { key: 'trt4',  label: 'TRT4  - 4a Regiao (Rio Grande do Sul)',                group: 'Justica do Trabalho' },
  { key: 'trt5',  label: 'TRT5  - 5a Regiao (Bahia)',                            group: 'Justica do Trabalho' },
  { key: 'trt6',  label: 'TRT6  - 6a Regiao (Pernambuco)',                       group: 'Justica do Trabalho' },
  { key: 'trt7',  label: 'TRT7  - 7a Regiao (Ceara)',                            group: 'Justica do Trabalho' },
  { key: 'trt8',  label: 'TRT8  - 8a Regiao (Para e Amapa)',                     group: 'Justica do Trabalho' },
  { key: 'trt9',  label: 'TRT9  - 9a Regiao (Parana)',                           group: 'Justica do Trabalho' },
  { key: 'trt10', label: 'TRT10 - 10a Regiao (Distrito Federal e Tocantins)',    group: 'Justica do Trabalho' },
  { key: 'trt11', label: 'TRT11 - 11a Regiao (Amazonas e Roraima)',              group: 'Justica do Trabalho' },
  { key: 'trt12', label: 'TRT12 - 12a Regiao (Santa Catarina)',                  group: 'Justica do Trabalho' },
  { key: 'trt13', label: 'TRT13 - 13a Regiao (Paraiba)',                         group: 'Justica do Trabalho' },
  { key: 'trt14', label: 'TRT14 - 14a Regiao (Rondonia e Acre)',                 group: 'Justica do Trabalho' },
  { key: 'trt15', label: 'TRT15 - 15a Regiao (Campinas/SP)',                     group: 'Justica do Trabalho' },
  { key: 'trt16', label: 'TRT16 - 16a Regiao (Maranhao)',                        group: 'Justica do Trabalho' },
  { key: 'trt17', label: 'TRT17 - 17a Regiao (Espirito Santo)',                  group: 'Justica do Trabalho' },
  { key: 'trt18', label: 'TRT18 - 18a Regiao (Goias)',                           group: 'Justica do Trabalho' },
  { key: 'trt19', label: 'TRT19 - 19a Regiao (Alagoas)',                         group: 'Justica do Trabalho' },
  { key: 'trt20', label: 'TRT20 - 20a Regiao (Sergipe)',                         group: 'Justica do Trabalho' },
  { key: 'trt21', label: 'TRT21 - 21a Regiao (Rio Grande do Norte)',             group: 'Justica do Trabalho' },
  { key: 'trt22', label: 'TRT22 - 22a Regiao (Piaui)',                           group: 'Justica do Trabalho' },
  { key: 'trt23', label: 'TRT23 - 23a Regiao (Mato Grosso)',                     group: 'Justica do Trabalho' },
  { key: 'trt24', label: 'TRT24 - 24a Regiao (Mato Grosso do Sul)',              group: 'Justica do Trabalho' },

  // --- Justica Estadual (TJs) ---
  { key: 'tjac', label: 'TJAC - Tribunal de Justica do Acre',                    group: 'Justica Estadual' },
  { key: 'tjal', label: 'TJAL - Tribunal de Justica de Alagoas',                 group: 'Justica Estadual' },
  { key: 'tjap', label: 'TJAP - Tribunal de Justica do Amapa',                   group: 'Justica Estadual' },
  { key: 'tjam', label: 'TJAM - Tribunal de Justica do Amazonas',                group: 'Justica Estadual' },
  { key: 'tjba', label: 'TJBA - Tribunal de Justica da Bahia',                   group: 'Justica Estadual' },
  { key: 'tjce', label: 'TJCE - Tribunal de Justica do Ceara',                   group: 'Justica Estadual' },
  { key: 'tjdft',label: 'TJDFT - Tribunal de Justica do Distrito Federal',       group: 'Justica Estadual' },
  { key: 'tjes', label: 'TJES - Tribunal de Justica do Espirito Santo',          group: 'Justica Estadual' },
  { key: 'tjgo', label: 'TJGO - Tribunal de Justica de Goias',                   group: 'Justica Estadual' },
  { key: 'tjma', label: 'TJMA - Tribunal de Justica do Maranhao',                group: 'Justica Estadual' },
  { key: 'tjmt', label: 'TJMT - Tribunal de Justica de Mato Grosso',             group: 'Justica Estadual' },
  { key: 'tjms', label: 'TJMS - Tribunal de Justica de Mato Grosso do Sul',      group: 'Justica Estadual' },
  { key: 'tjmg', label: 'TJMG - Tribunal de Justica de Minas Gerais',            group: 'Justica Estadual' },
  { key: 'tjpa', label: 'TJPA - Tribunal de Justica do Para',                    group: 'Justica Estadual' },
  { key: 'tjpb', label: 'TJPB - Tribunal de Justica da Paraiba',                 group: 'Justica Estadual' },
  { key: 'tjpr', label: 'TJPR - Tribunal de Justica do Parana',                  group: 'Justica Estadual' },
  { key: 'tjpe', label: 'TJPE - Tribunal de Justica de Pernambuco',              group: 'Justica Estadual' },
  { key: 'tjpi', label: 'TJPI - Tribunal de Justica do Piaui',                   group: 'Justica Estadual' },
  { key: 'tjrj', label: 'TJRJ - Tribunal de Justica do Rio de Janeiro',          group: 'Justica Estadual' },
  { key: 'tjrn', label: 'TJRN - Tribunal de Justica do Rio Grande do Norte',     group: 'Justica Estadual' },
  { key: 'tjrs', label: 'TJRS - Tribunal de Justica do Rio Grande do Sul',       group: 'Justica Estadual' },
  { key: 'tjro', label: 'TJRO - Tribunal de Justica de Rondonia',                group: 'Justica Estadual' },
  { key: 'tjrr', label: 'TJRR - Tribunal de Justica de Roraima',                 group: 'Justica Estadual' },
  { key: 'tjsc', label: 'TJSC - Tribunal de Justica de Santa Catarina',          group: 'Justica Estadual' },
  { key: 'tjsp', label: 'TJSP - Tribunal de Justica de Sao Paulo',               group: 'Justica Estadual' },
  { key: 'tjse', label: 'TJSE - Tribunal de Justica de Sergipe',                 group: 'Justica Estadual' },
  { key: 'tjto', label: 'TJTO - Tribunal de Justica de Tocantins',               group: 'Justica Estadual' },
]

export default function RelatoriosProcessuais() {
  const navigate = useNavigate()

  // Abas: 'busca' (auto) ou 'manual'
  const [aba, setAba] = useState('busca')

  // Estado de busca automatica
  const [numeroProcesso, setNumeroProcesso] = useState('')
  const [tribunal, setTribunal] = useState('tjsp')
  const [buscando, setBuscando] = useState(false)
  const [erroBusca, setErroBusca] = useState('')

  // Estado compartilhado do processo carregado
  const [processo, setProcesso] = useState(null)
  // processo = { numero, tribunal, classe, assunto, dataAjuizamento, partes:[], andamentos:[{data,descricao}] }

  // Estado de entrada manual
  const [manualNumero, setManualNumero] = useState('')
  const [manualTribunal, setManualTribunal] = useState('')
  const [manualClasse, setManualClasse] = useState('')
  const [manualAssunto, setManualAssunto] = useState('')
  const [manualPartes, setManualPartes] = useState('')
  const [manualAndamentos, setManualAndamentos] = useState('')

  // Estado do relatorio (campos complementares)
  const [cliente, setCliente] = useState('')
  const [responsavel, setResponsavel] = useState('')
  const [resumo, setResumo] = useState('')
  const [statusAtual, setStatusAtual] = useState('')
  const [proximosPassos, setProximosPassos] = useState('')
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false)
  const [erroRelatorio, setErroRelatorio] = useState('')
  const [sugerindo, setSugerindo] = useState(false)

  // --- Acoes ---
  const buscarProcesso = async () => {
    setErroBusca('')
    if (!numeroProcesso.trim()) {
      setErroBusca('Informe o numero do processo')
      return
    }
    setBuscando(true)
    try {
      const response = await fetch('/api/processos/buscar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero: numeroProcesso.trim(), tribunal }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Nao foi possivel buscar o processo')
      }
      setProcesso(data.processo)
    } catch (err) {
      setErroBusca(err.message)
      setProcesso(null)
    } finally {
      setBuscando(false)
    }
  }

  const carregarManual = () => {
    // Converte o texto colado de andamentos em array estruturado
    const linhas = manualAndamentos.split('\n').filter(l => l.trim())
    const andamentos = linhas.map((linha, idx) => {
      // Tenta extrair data no formato dd/mm/aaaa ou aaaa-mm-dd
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
  }

  const gerarSugestaoResumo = async () => {
    if (!processo) return
    setSugerindo(true)
    try {
      // Sugestao simples baseada nos dados (sem IA externa - lado servidor pode acrescentar LLM depois)
      const totalAnd = processo.andamentos?.length || 0
      const ultimos = (processo.andamentos || []).slice(-3).map(a => `${a.data ? a.data + ' - ' : ''}${a.descricao}`).join('\n')

      const resumoAuto = `Processo n. ${processo.numero} em tramite no ${processo.tribunal}, classe ${processo.classe}, tendo por assunto ${processo.assunto}. Foram registrados ${totalAnd} andamentos ate o momento.`
      const statusAuto = ultimos ? `Ultimos movimentos:\n${ultimos}` : 'Sem movimentos recentes registrados.'

      if (!resumo) setResumo(resumoAuto)
      if (!statusAtual) setStatusAtual(statusAuto)
    } finally {
      setSugerindo(false)
    }
  }

  const gerarRelatorio = async () => {
    setErroRelatorio('')
    if (!processo) {
      setErroRelatorio('Nenhum processo carregado')
      return
    }
    if (!cliente.trim()) {
      setErroRelatorio('Informe o nome do cliente')
      return
    }
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
      // Download do arquivo
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
    setManualNumero('')
    setManualTribunal('')
    setManualClasse('')
    setManualAssunto('')
    setManualPartes('')
    setManualAndamentos('')
    setCliente('')
    setResponsavel('')
    setResumo('')
    setStatusAtual('')
    setProximosPassos('')
    setErroBusca('')
    setErroRelatorio('')
  }

  return (
    <div>
      <Header
        title="Relatorios Processuais"
        subtitle="Juridico > Relatorios Processuais"
      />

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
            <p className="text-slate-500">Gere relatorios de andamentos e prepare apresentacoes para seus clientes.</p>
          </div>
        </div>

        {/* PASSO 1: Origem dos dados */}
        {!processo && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-200 flex">
              <button
                onClick={() => setAba('busca')}
                className={`flex-1 px-6 py-4 font-medium transition-colors flex items-center justify-center gap-2 ${
                  aba === 'busca' ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-500' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Search className="w-4 h-4" />
                Busca automatica
              </button>
              <button
                onClick={() => setAba('manual')}
                className={`flex-1 px-6 py-4 font-medium transition-colors flex items-center justify-center gap-2 ${
                  aba === 'manual' ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-500' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <ClipboardPaste className="w-4 h-4" />
                Entrada manual
              </button>
            </div>

            <div className="p-6">
              {aba === 'busca' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 flex items-start gap-2">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                    Consulta pela API publica DataJud do CNJ. Informe o numero do processo no formato unificado (20 digitos).
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Numero do processo</label>
                      <input
                        type="text"
                        value={numeroProcesso}
                        onChange={(e) => setNumeroProcesso(e.target.value)}
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
                        {/* Agrupa tribunais por categoria */}
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
                  {erroBusca && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex items-start gap-2">
                      <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      {erroBusca}
                    </div>
                  )}
                  <button
                    onClick={buscarProcesso}
                    disabled={buscando}
                    className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg px-5 py-2.5 font-medium transition-colors"
                  >
                    {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {buscando ? 'Buscando...' : 'Buscar processo'}
                  </button>
                </div>
              )}

              {aba === 'manual' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 flex items-start gap-2">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                    Cole os dados do processo diretamente. Ideal para tribunais sem integracao direta ou quando precisar de controle total sobre o conteudo.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Numero do processo</label>
                      <input
                        type="text"
                        value={manualNumero}
                        onChange={(e) => setManualNumero(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tribunal / Vara</label>
                      <input
                        type="text"
                        value={manualTribunal}
                        onChange={(e) => setManualTribunal(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Classe</label>
                      <input
                        type="text"
                        value={manualClasse}
                        onChange={(e) => setManualClasse(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Assunto</label>
                      <input
                        type="text"
                        value={manualAssunto}
                        onChange={(e) => setManualAssunto(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Partes (uma por linha)</label>
                    <textarea
                      rows={3}
                      value={manualPartes}
                      onChange={(e) => setManualPartes(e.target.value)}
                      placeholder={'Autor: Joao da Silva\nReu: Empresa X Ltda'}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Andamentos (um por linha)</label>
                    <textarea
                      rows={8}
                      value={manualAndamentos}
                      onChange={(e) => setManualAndamentos(e.target.value)}
                      placeholder={'01/04/2026 - Audiencia designada\n15/03/2026 - Juntada de peticao\n10/03/2026 - Distribuicao'}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-sm"
                    />
                    <p className="text-xs text-slate-500 mt-1">Dica: cole do site do tribunal. O sistema detecta datas automaticamente.</p>
                  </div>
                  <button
                    onClick={carregarManual}
                    disabled={!manualAndamentos.trim()}
                    className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white rounded-lg px-5 py-2.5 font-medium transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Carregar dados do processo
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PASSO 2: Dados carregados + formulario do relatorio */}
        {processo && (
          <>
            {/* Card de dados do processo */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Processo carregado</h3>
                    <p className="text-sm text-slate-500">
                      {processo.origem === 'manual' ? 'Dados inseridos manualmente' : 'Dados obtidos do tribunal'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={limparTudo}
                  className="text-sm text-slate-500 hover:text-slate-700"
                >
                  Limpar e comecar de novo
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div><span className="text-slate-500">Numero:</span> <span className="font-medium text-slate-800">{processo.numero}</span></div>
                <div><span className="text-slate-500">Tribunal:</span> <span className="font-medium text-slate-800">{processo.tribunal}</span></div>
                <div><span className="text-slate-500">Classe:</span> <span className="font-medium text-slate-800">{processo.classe}</span></div>
                <div><span className="text-slate-500">Assunto:</span> <span className="font-medium text-slate-800">{processo.assunto}</span></div>
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
                        {a.data && <span className="font-medium text-slate-700">{a.data} - </span>}
                        <span className="text-slate-600">{a.descricao}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>

            {/* Formulario do relatorio */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">Dados do relatorio</h3>
                <button
                  onClick={gerarSugestaoResumo}
                  disabled={sugerindo}
                  className="text-sm inline-flex items-center gap-1.5 text-amber-600 hover:text-amber-700"
                >
                  <Sparkles className="w-4 h-4" />
                  Sugerir resumo automatico
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cliente *</label>
                  <input
                    type="text"
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    placeholder="Nome do cliente destinatario"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Advogado responsavel</label>
                  <input
                    type="text"
                    value={responsavel}
                    onChange={(e) => setResponsavel(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Resumo do processo</label>
                <textarea
                  rows={4}
                  value={resumo}
                  onChange={(e) => setResumo(e.target.value)}
                  placeholder="Contextualize brevemente o caso, as partes envolvidas e o objeto da acao."
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status atual</label>
                <textarea
                  rows={4}
                  value={statusAtual}
                  onChange={(e) => setStatusAtual(e.target.value)}
                  placeholder="Em que fase esta o processo, ultimos acontecimentos relevantes, decisoes importantes."
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Proximos passos</label>
                <textarea
                  rows={3}
                  value={proximosPassos}
                  onChange={(e) => setProximosPassos(e.target.value)}
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

            {/* Integracao com Canva */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                  <Presentation className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800 mb-1">Inserir no modelo do Canva</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Depois de gerar o relatorio Word, voce pode importar o conteudo no seu modelo de apresentacao do Canva. Siga os passos abaixo:
                  </p>
                  <ol className="list-decimal ml-5 space-y-1.5 text-sm text-slate-700">
                    <li>Baixe o relatorio .docx clicando no botao acima</li>
                    <li>Abra seu modelo de apresentacao no Canva</li>
                    <li>No Canva, va em <strong>Arquivo &gt; Importar</strong> e selecione o .docx gerado</li>
                    <li>Copie os blocos de texto para os slides do seu modelo</li>
                  </ol>
                  <a
                    href="https://www.canva.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 text-purple-700 hover:text-purple-900 font-medium text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Abrir Canva em nova aba
                  </a>
                  <p className="text-xs text-slate-500 mt-4 pt-3 border-t border-purple-200">
                    <strong>Em breve:</strong> integracao direta com a API do Canva para gerar o PDF/slides automaticamente a partir do seu modelo.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
