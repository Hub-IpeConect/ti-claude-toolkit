import express from 'express'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  Header,
  Footer,
  PageNumber,
  LevelFormat,
  TabStopType,
  TabStopPosition,
} from 'docx'

const router = express.Router()

// API publica do DataJud/CNJ (chave publica divulgada pelo CNJ)
// https://datajud-wiki.cnj.jus.br/api-publica/acesso
const DATAJUD_API_KEY = process.env.DATAJUD_API_KEY || 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw=='

// Mapeamento de tribunal -> indice DataJud
const indexMap = {
  // Superiores
  stf:   'api_publica_stf',
  stj:   'api_publica_stj',
  tst:   'api_publica_tst',
  // Justica Federal (TRFs)
  trf1:  'api_publica_trf1',
  trf2:  'api_publica_trf2',
  trf3:  'api_publica_trf3',
  trf4:  'api_publica_trf4',
  trf5:  'api_publica_trf5',
  trf6:  'api_publica_trf6',
  // Justica do Trabalho (TRTs)
  trt1:  'api_publica_trt1',
  trt2:  'api_publica_trt2',
  trt3:  'api_publica_trt3',
  trt4:  'api_publica_trt4',
  trt5:  'api_publica_trt5',
  trt6:  'api_publica_trt6',
  trt7:  'api_publica_trt7',
  trt8:  'api_publica_trt8',
  trt9:  'api_publica_trt9',
  trt10: 'api_publica_trt10',
  trt11: 'api_publica_trt11',
  trt12: 'api_publica_trt12',
  trt13: 'api_publica_trt13',
  trt14: 'api_publica_trt14',
  trt15: 'api_publica_trt15',
  trt16: 'api_publica_trt16',
  trt17: 'api_publica_trt17',
  trt18: 'api_publica_trt18',
  trt19: 'api_publica_trt19',
  trt20: 'api_publica_trt20',
  trt21: 'api_publica_trt21',
  trt22: 'api_publica_trt22',
  trt23: 'api_publica_trt23',
  trt24: 'api_publica_trt24',
  // Justica Estadual (TJs)
  tjac:  'api_publica_tjac',
  tjal:  'api_publica_tjal',
  tjap:  'api_publica_tjap',
  tjam:  'api_publica_tjam',
  tjba:  'api_publica_tjba',
  tjce:  'api_publica_tjce',
  tjdft: 'api_publica_tjdft',
  tjes:  'api_publica_tjes',
  tjgo:  'api_publica_tjgo',
  tjma:  'api_publica_tjma',
  tjmt:  'api_publica_tjmt',
  tjms:  'api_publica_tjms',
  tjmg:  'api_publica_tjmg',
  tjpa:  'api_publica_tjpa',
  tjpb:  'api_publica_tjpb',
  tjpr:  'api_publica_tjpr',
  tjpe:  'api_publica_tjpe',
  tjpi:  'api_publica_tjpi',
  tjrj:  'api_publica_tjrj',
  tjrn:  'api_publica_tjrn',
  tjrs:  'api_publica_tjrs',
  tjro:  'api_publica_tjro',
  tjrr:  'api_publica_tjrr',
  tjsc:  'api_publica_tjsc',
  tjsp:  'api_publica_tjsp',
  tjse:  'api_publica_tjse',
  tjto:  'api_publica_tjto',
}

const tribunalLabels = {
  // Superiores
  stf:   'Supremo Tribunal Federal (STF)',
  stj:   'Superior Tribunal de Justica (STJ)',
  tst:   'Tribunal Superior do Trabalho (TST)',
  // Justica Federal
  trf1:  'Tribunal Regional Federal da 1a Regiao (TRF1)',
  trf2:  'Tribunal Regional Federal da 2a Regiao (TRF2)',
  trf3:  'Tribunal Regional Federal da 3a Regiao (TRF3)',
  trf4:  'Tribunal Regional Federal da 4a Regiao (TRF4)',
  trf5:  'Tribunal Regional Federal da 5a Regiao (TRF5)',
  trf6:  'Tribunal Regional Federal da 6a Regiao (TRF6)',
  // Justica do Trabalho
  trt1:  'Tribunal Regional do Trabalho da 1a Regiao - Rio de Janeiro (TRT1)',
  trt2:  'Tribunal Regional do Trabalho da 2a Regiao - Sao Paulo Capital (TRT2)',
  trt3:  'Tribunal Regional do Trabalho da 3a Regiao - Minas Gerais (TRT3)',
  trt4:  'Tribunal Regional do Trabalho da 4a Regiao - Rio Grande do Sul (TRT4)',
  trt5:  'Tribunal Regional do Trabalho da 5a Regiao - Bahia (TRT5)',
  trt6:  'Tribunal Regional do Trabalho da 6a Regiao - Pernambuco (TRT6)',
  trt7:  'Tribunal Regional do Trabalho da 7a Regiao - Ceara (TRT7)',
  trt8:  'Tribunal Regional do Trabalho da 8a Regiao - Para e Amapa (TRT8)',
  trt9:  'Tribunal Regional do Trabalho da 9a Regiao - Parana (TRT9)',
  trt10: 'Tribunal Regional do Trabalho da 10a Regiao - Distrito Federal e Tocantins (TRT10)',
  trt11: 'Tribunal Regional do Trabalho da 11a Regiao - Amazonas e Roraima (TRT11)',
  trt12: 'Tribunal Regional do Trabalho da 12a Regiao - Santa Catarina (TRT12)',
  trt13: 'Tribunal Regional do Trabalho da 13a Regiao - Paraiba (TRT13)',
  trt14: 'Tribunal Regional do Trabalho da 14a Regiao - Rondonia e Acre (TRT14)',
  trt15: 'Tribunal Regional do Trabalho da 15a Regiao - Campinas/SP (TRT15)',
  trt16: 'Tribunal Regional do Trabalho da 16a Regiao - Maranhao (TRT16)',
  trt17: 'Tribunal Regional do Trabalho da 17a Regiao - Espirito Santo (TRT17)',
  trt18: 'Tribunal Regional do Trabalho da 18a Regiao - Goias (TRT18)',
  trt19: 'Tribunal Regional do Trabalho da 19a Regiao - Alagoas (TRT19)',
  trt20: 'Tribunal Regional do Trabalho da 20a Regiao - Sergipe (TRT20)',
  trt21: 'Tribunal Regional do Trabalho da 21a Regiao - Rio Grande do Norte (TRT21)',
  trt22: 'Tribunal Regional do Trabalho da 22a Regiao - Piaui (TRT22)',
  trt23: 'Tribunal Regional do Trabalho da 23a Regiao - Mato Grosso (TRT23)',
  trt24: 'Tribunal Regional do Trabalho da 24a Regiao - Mato Grosso do Sul (TRT24)',
  // Justica Estadual
  tjac:  'Tribunal de Justica do Acre (TJAC)',
  tjal:  'Tribunal de Justica de Alagoas (TJAL)',
  tjap:  'Tribunal de Justica do Amapa (TJAP)',
  tjam:  'Tribunal de Justica do Amazonas (TJAM)',
  tjba:  'Tribunal de Justica da Bahia (TJBA)',
  tjce:  'Tribunal de Justica do Ceara (TJCE)',
  tjdft: 'Tribunal de Justica do Distrito Federal (TJDFT)',
  tjes:  'Tribunal de Justica do Espirito Santo (TJES)',
  tjgo:  'Tribunal de Justica de Goias (TJGO)',
  tjma:  'Tribunal de Justica do Maranhao (TJMA)',
  tjmt:  'Tribunal de Justica de Mato Grosso (TJMT)',
  tjms:  'Tribunal de Justica de Mato Grosso do Sul (TJMS)',
  tjmg:  'Tribunal de Justica de Minas Gerais (TJMG)',
  tjpa:  'Tribunal de Justica do Para (TJPA)',
  tjpb:  'Tribunal de Justica da Paraiba (TJPB)',
  tjpr:  'Tribunal de Justica do Parana (TJPR)',
  tjpe:  'Tribunal de Justica de Pernambuco (TJPE)',
  tjpi:  'Tribunal de Justica do Piaui (TJPI)',
  tjrj:  'Tribunal de Justica do Rio de Janeiro (TJRJ)',
  tjrn:  'Tribunal de Justica do Rio Grande do Norte (TJRN)',
  tjrs:  'Tribunal de Justica do Rio Grande do Sul (TJRS)',
  tjro:  'Tribunal de Justica de Rondonia (TJRO)',
  tjrr:  'Tribunal de Justica de Roraima (TJRR)',
  tjsc:  'Tribunal de Justica de Santa Catarina (TJSC)',
  tjsp:  'Tribunal de Justica de Sao Paulo (TJSP)',
  tjse:  'Tribunal de Justica de Sergipe (TJSE)',
  tjto:  'Tribunal de Justica de Tocantins (TJTO)',
}

// Formata data ISO para pt-BR
function formatarData(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleDateString('pt-BR')
  } catch {
    return iso
  }
}

// POST /api/processos/buscar - busca processo no DataJud
router.post('/buscar', async (req, res) => {
  const { numero, tribunal } = req.body
  if (!numero || !tribunal) {
    return res.status(400).json({ success: false, message: 'Numero e tribunal sao obrigatorios' })
  }

  const indice = indexMap[tribunal]
  if (!indice) {
    return res.status(400).json({ success: false, message: 'Tribunal nao suportado' })
  }

  // Remove tudo que nao seja digito do numero do processo
  const numeroLimpo = numero.replace(/\D/g, '')
  if (numeroLimpo.length < 15) {
    return res.status(400).json({ success: false, message: 'Numero de processo invalido. Use o formato CNJ com 20 digitos.' })
  }

  const url = `https://api-publica.datajud.cnj.jus.br/${indice}/_search`
  const query = {
    query: {
      match: { numeroProcesso: numeroLimpo },
    },
  }

  console.log(`[Processos] Buscando ${numeroLimpo} em ${indice}...`)

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `APIKey ${DATAJUD_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
    })

    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      console.log(`[Processos] Erro HTTP ${resp.status}: ${text}`)
      return res.status(502).json({
        success: false,
        message: `Falha na API do DataJud (HTTP ${resp.status}). Tente novamente ou use entrada manual.`,
      })
    }

    const data = await resp.json()
    const hits = data?.hits?.hits || []

    if (hits.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Processo nao encontrado no tribunal selecionado. Verifique o numero e o tribunal.',
      })
    }

    const src = hits[0]._source || {}

    // Extrai andamentos/movimentos
    const movimentos = (src.movimentos || []).map((m, idx) => ({
      data: formatarData(m.dataHora),
      descricao: m.nome || '(sem descricao)',
      codigo: m.codigo || null,
      ordem: idx + 1,
    })).sort((a, b) => {
      // Ordem decrescente (mais recente primeiro)
      if (!a.data || !b.data) return 0
      const parse = d => {
        const [dia, mes, ano] = d.split('/')
        return new Date(`${ano}-${mes}-${dia}`).getTime()
      }
      return parse(b.data) - parse(a.data)
    })

    // Extrai partes (se disponivel)
    const partes = []
    if (src.partes) {
      src.partes.forEach(p => {
        const nome = p.nome || p.pessoa?.nome || ''
        const polo = p.polo || ''
        if (nome) partes.push(polo ? `${polo}: ${nome}` : nome)
      })
    }

    const processo = {
      numero: src.numeroProcesso || numeroLimpo,
      tribunal: tribunalLabels[tribunal] || src.tribunal || tribunal.toUpperCase(),
      classe: src.classe?.nome || 'Nao informada',
      assunto: (src.assuntos && src.assuntos[0]?.nome) || 'Nao informado',
      dataAjuizamento: formatarData(src.dataAjuizamento),
      orgaoJulgador: src.orgaoJulgador?.nome || '',
      grau: src.grau || '',
      sistema: src.sistema?.nome || '',
      partes,
      andamentos: movimentos,
      origem: 'datajud',
    }

    console.log(`[Processos] Encontrado: ${processo.numero} com ${movimentos.length} andamentos`)
    res.json({ success: true, processo })
  } catch (err) {
    console.error('[Processos] Erro:', err.message)
    res.status(500).json({
      success: false,
      message: `Erro ao consultar DataJud: ${err.message}. Voce pode usar a entrada manual como alternativa.`,
    })
  }
})

// ================= GERACAO DO RELATORIO EM DOCX =================

// Cores da marca Ipeconect
const COLOR_PRIMARY = '46548C' // Azul Ipeconect
const COLOR_ACCENT = 'E8A14A' // Laranja
const COLOR_DARK = '222B4C'
const COLOR_LIGHT_BG = 'F0DCCC'
const COLOR_BORDER = 'CCCCCC'

function heading(text, level = HeadingLevel.HEADING_1, color = COLOR_PRIMARY) {
  return new Paragraph({
    heading: level,
    children: [new TextRun({ text, bold: true, color })],
    spacing: { before: 240, after: 120 },
  })
}

function paragraph(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text: text || '', ...opts })],
    spacing: { after: 100 },
  })
}

function infoRow(label, value) {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 2800, type: WidthType.DXA },
        shading: { fill: 'F5F5F5', type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 150, right: 150 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
          left: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
          right: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
        },
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, color: COLOR_DARK, size: 20 })] })],
      }),
      new TableCell({
        width: { size: 6560, type: WidthType.DXA },
        margins: { top: 100, bottom: 100, left: 150, right: 150 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
          left: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
          right: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
        },
        children: [new Paragraph({ children: [new TextRun({ text: value || '-', size: 20 })] })],
      }),
    ],
  })
}

function andamentosTable(andamentos) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: 2000, type: WidthType.DXA },
        shading: { fill: COLOR_PRIMARY, type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 150, right: 150 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: COLOR_PRIMARY },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: COLOR_PRIMARY },
          left: { style: BorderStyle.SINGLE, size: 1, color: COLOR_PRIMARY },
          right: { style: BorderStyle.SINGLE, size: 1, color: COLOR_PRIMARY },
        },
        children: [new Paragraph({ children: [new TextRun({ text: 'Data', bold: true, color: 'FFFFFF', size: 20 })] })],
      }),
      new TableCell({
        width: { size: 7360, type: WidthType.DXA },
        shading: { fill: COLOR_PRIMARY, type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 150, right: 150 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: COLOR_PRIMARY },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: COLOR_PRIMARY },
          left: { style: BorderStyle.SINGLE, size: 1, color: COLOR_PRIMARY },
          right: { style: BorderStyle.SINGLE, size: 1, color: COLOR_PRIMARY },
        },
        children: [new Paragraph({ children: [new TextRun({ text: 'Andamento', bold: true, color: 'FFFFFF', size: 20 })] })],
      }),
    ],
  })

  const dataRows = andamentos.map((a, idx) => new TableRow({
    children: [
      new TableCell({
        width: { size: 2000, type: WidthType.DXA },
        shading: idx % 2 === 0 ? { fill: 'FAFAFA', type: ShadingType.CLEAR } : undefined,
        margins: { top: 80, bottom: 80, left: 150, right: 150 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
          left: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
          right: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
        },
        children: [new Paragraph({ children: [new TextRun({ text: a.data || '-', size: 18 })] })],
      }),
      new TableCell({
        width: { size: 7360, type: WidthType.DXA },
        shading: idx % 2 === 0 ? { fill: 'FAFAFA', type: ShadingType.CLEAR } : undefined,
        margins: { top: 80, bottom: 80, left: 150, right: 150 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
          left: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
          right: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
        },
        children: [new Paragraph({ children: [new TextRun({ text: a.descricao || '', size: 18 })] })],
      }),
    ],
  }))

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2000, 7360],
    rows: [headerRow, ...dataRows],
  })
}

// POST /api/processos/gerar-relatorio
router.post('/gerar-relatorio', async (req, res) => {
  const { processo, cliente, responsavel, resumo, statusAtual, proximosPassos } = req.body

  if (!processo || !cliente) {
    return res.status(400).json({ success: false, message: 'Processo e cliente sao obrigatorios' })
  }

  try {
    const dataHoje = new Date().toLocaleDateString('pt-BR')

    // Partes
    let partesChildren = [paragraph('Nao informado')]
    if (processo.partes && processo.partes.length > 0) {
      partesChildren = processo.partes.map(p => new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun({ text: p, size: 22 })],
      }))
    }

    // Texto livre em paragrafos
    const toParagraphs = (texto, opts = {}) => {
      if (!texto || !texto.trim()) return [paragraph('(Nao informado)', { italics: true, color: '888888' })]
      return texto.split('\n').filter(l => l.trim() || true).map(linha =>
        new Paragraph({ children: [new TextRun({ text: linha, size: 22, ...opts })], spacing: { after: 80 } })
      )
    }

    const doc = new Document({
      creator: 'Gestao 360 - Ipeconect',
      title: `Relatorio Processual - ${processo.numero}`,
      styles: {
        default: { document: { run: { font: 'Arial', size: 22 } } },
        paragraphStyles: [
          {
            id: 'Heading1',
            name: 'Heading 1',
            basedOn: 'Normal',
            next: 'Normal',
            quickFormat: true,
            run: { size: 32, bold: true, font: 'Arial', color: COLOR_PRIMARY },
            paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 0 },
          },
          {
            id: 'Heading2',
            name: 'Heading 2',
            basedOn: 'Normal',
            next: 'Normal',
            quickFormat: true,
            run: { size: 26, bold: true, font: 'Arial', color: COLOR_PRIMARY },
            paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 1 },
          },
        ],
      },
      numbering: {
        config: [
          {
            reference: 'bullets',
            levels: [{
              level: 0,
              format: LevelFormat.BULLET,
              text: '\u2022',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            }],
          },
        ],
      },
      sections: [{
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 }, // ~2cm
          },
        },
        headers: {
          default: new Header({
            children: [new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: 'GESTAO 360  |  IPECONECT', bold: true, color: COLOR_ACCENT, size: 16 })],
              border: {
                bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR_ACCENT, space: 4 },
              },
            })],
          }),
        },
        footers: {
          default: new Footer({
            children: [new Paragraph({
              tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
              children: [
                new TextRun({ text: `Relatorio gerado em ${dataHoje}`, size: 16, color: '888888' }),
                new TextRun({ text: '\tPagina ', size: 16, color: '888888' }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '888888' }),
              ],
            })],
          }),
        },
        children: [
          // ===== CAPA =====
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 2400, after: 240 },
            children: [new TextRun({ text: 'RELATORIO PROCESSUAL', bold: true, size: 48, color: COLOR_PRIMARY })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [new TextRun({ text: `Processo n. ${processo.numero}`, size: 28, color: COLOR_DARK })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 2000 },
            children: [new TextRun({ text: processo.tribunal, italics: true, size: 22, color: '666666' })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 1200, after: 100 },
            children: [new TextRun({ text: 'PREPARADO PARA', bold: true, size: 18, color: COLOR_ACCENT })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [new TextRun({ text: cliente, bold: true, size: 32, color: COLOR_DARK })],
          }),
          ...(responsavel ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 },
              children: [new TextRun({ text: 'RESPONSAVEL', bold: true, size: 16, color: COLOR_ACCENT })],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
              children: [new TextRun({ text: responsavel, size: 22, color: COLOR_DARK })],
            }),
          ] : []),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 1200 },
            children: [new TextRun({ text: `Data de emissao: ${dataHoje}`, size: 20, color: '666666' })],
          }),

          // ===== DADOS DO PROCESSO =====
          new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, children: [new TextRun('1. Dados do Processo')] }),
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [2800, 6560],
            rows: [
              infoRow('Numero', processo.numero),
              infoRow('Tribunal', processo.tribunal),
              infoRow('Classe', processo.classe),
              infoRow('Assunto', processo.assunto),
              ...(processo.dataAjuizamento ? [infoRow('Data de ajuizamento', processo.dataAjuizamento)] : []),
              ...(processo.orgaoJulgador ? [infoRow('Orgao julgador', processo.orgaoJulgador)] : []),
              ...(processo.grau ? [infoRow('Grau', processo.grau)] : []),
            ],
          }),

          // ===== PARTES =====
          heading('2. Partes do Processo', HeadingLevel.HEADING_1),
          ...partesChildren,

          // ===== RESUMO =====
          heading('3. Resumo do Caso', HeadingLevel.HEADING_1),
          ...toParagraphs(resumo),

          // ===== STATUS ATUAL =====
          heading('4. Status Atual', HeadingLevel.HEADING_1),
          ...toParagraphs(statusAtual),

          // ===== PROXIMOS PASSOS =====
          heading('5. Proximos Passos', HeadingLevel.HEADING_1),
          ...toParagraphs(proximosPassos),

          // ===== ANDAMENTOS =====
          new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, children: [new TextRun('6. Andamentos do Processo')] }),
          paragraph(`Total de ${processo.andamentos?.length || 0} registros, ordenados do mais recente para o mais antigo.`, { italics: true, color: '666666', size: 20 }),
          new Paragraph({ children: [new TextRun('')], spacing: { after: 120 } }),
          ...(processo.andamentos && processo.andamentos.length > 0
            ? [andamentosTable(processo.andamentos)]
            : [paragraph('(Nenhum andamento registrado)', { italics: true, color: '888888' })]),

          // ===== RODAPE FINAL =====
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 600, after: 120 },
            border: { top: { style: BorderStyle.SINGLE, size: 6, color: COLOR_ACCENT, space: 8 } },
            children: [new TextRun({ text: 'Gestao 360 - Ipeconect', bold: true, size: 18, color: COLOR_PRIMARY })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Este relatorio contem informacoes confidenciais e e destinado exclusivamente ao cliente indicado.', italics: true, size: 16, color: '888888' })],
          }),
        ],
      }],
    })

    const buffer = await Packer.toBuffer(doc)
    const filename = `Relatorio_${(processo.numero || 'processo').replace(/[^\w]/g, '_')}.docx`

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(buffer)
    console.log(`[Processos] Relatorio gerado: ${filename}`)
  } catch (err) {
    console.error('[Processos] Erro ao gerar relatorio:', err)
    res.status(500).json({ success: false, message: `Erro ao gerar relatorio: ${err.message}` })
  }
})

export default router
