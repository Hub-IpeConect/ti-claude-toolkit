import express from 'express'
import fs from 'fs'
import path from 'path'
import https from 'https'
import os from 'os'
import { execSync } from 'child_process'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
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

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// ============================================================
// CONFIGURACAO GERAL
// ============================================================

// API publica do DataJud/CNJ
const DATAJUD_API_KEY = process.env.DATAJUD_API_KEY || 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw=='

// Diretorio de certificados A1
const CERT_DIR = path.join(__dirname, '..', 'data', 'certificados')
if (!fs.existsSync(CERT_DIR)) fs.mkdirSync(CERT_DIR, { recursive: true })

// Chave para ofuscacao da senha do pfx (nao e criptografia forte — uso interno)
const ENC_KEY = Buffer.from(
  (process.env.CERT_ENC_KEY || 'gestao360CertKeyInternal!').padEnd(32, '0').slice(0, 32),
  'utf8'
)

function encryptSenha(text) {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', ENC_KEY, iv)
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  return iv.toString('hex') + ':' + enc.toString('hex')
}

function decryptSenha(text) {
  try {
    const [ivHex, encHex] = text.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const enc = Buffer.from(encHex, 'hex')
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENC_KEY, iv)
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
  } catch { return '' }
}

// ============================================================
// MAPEAMENTOS
// ============================================================

const indexMap = {
  stf:   'api_publica_stf',  stj:   'api_publica_stj',  tst:   'api_publica_tst',
  trf1:  'api_publica_trf1', trf2:  'api_publica_trf2', trf3:  'api_publica_trf3',
  trf4:  'api_publica_trf4', trf5:  'api_publica_trf5', trf6:  'api_publica_trf6',
  trt1:  'api_publica_trt1', trt2:  'api_publica_trt2', trt3:  'api_publica_trt3',
  trt4:  'api_publica_trt4', trt5:  'api_publica_trt5', trt6:  'api_publica_trt6',
  trt7:  'api_publica_trt7', trt8:  'api_publica_trt8', trt9:  'api_publica_trt9',
  trt10: 'api_publica_trt10',trt11: 'api_publica_trt11',trt12: 'api_publica_trt12',
  trt13: 'api_publica_trt13',trt14: 'api_publica_trt14',trt15: 'api_publica_trt15',
  trt16: 'api_publica_trt16',trt17: 'api_publica_trt17',trt18: 'api_publica_trt18',
  trt19: 'api_publica_trt19',trt20: 'api_publica_trt20',trt21: 'api_publica_trt21',
  trt22: 'api_publica_trt22',trt23: 'api_publica_trt23',trt24: 'api_publica_trt24',
  tjac:  'api_publica_tjac', tjal:  'api_publica_tjal', tjap:  'api_publica_tjap',
  tjam:  'api_publica_tjam', tjba:  'api_publica_tjba', tjce:  'api_publica_tjce',
  tjdft: 'api_publica_tjdft',tjes:  'api_publica_tjes', tjgo:  'api_publica_tjgo',
  tjma:  'api_publica_tjma', tjmt:  'api_publica_tjmt', tjms:  'api_publica_tjms',
  tjmg:  'api_publica_tjmg', tjpa:  'api_publica_tjpa', tjpb:  'api_publica_tjpb',
  tjpr:  'api_publica_tjpr', tjpe:  'api_publica_tjpe', tjpi:  'api_publica_tjpi',
  tjrj:  'api_publica_tjrj', tjrn:  'api_publica_tjrn', tjrs:  'api_publica_tjrs',
  tjro:  'api_publica_tjro', tjrr:  'api_publica_tjrr', tjsc:  'api_publica_tjsc',
  tjsp:  'api_publica_tjsp', tjse:  'api_publica_tjse', tjto:  'api_publica_tjto',
}

const tribunalLabels = {
  stf:   'Supremo Tribunal Federal (STF)',
  stj:   'Superior Tribunal de Justica (STJ)',
  tst:   'Tribunal Superior do Trabalho (TST)',
  trf1:  'Tribunal Regional Federal da 1a Regiao (TRF1)',
  trf2:  'Tribunal Regional Federal da 2a Regiao (TRF2)',
  trf3:  'Tribunal Regional Federal da 3a Regiao (TRF3)',
  trf4:  'Tribunal Regional Federal da 4a Regiao (TRF4)',
  trf5:  'Tribunal Regional Federal da 5a Regiao (TRF5)',
  trf6:  'Tribunal Regional Federal da 6a Regiao (TRF6)',
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

// Endpoints PJe por tribunal (hostname + path do servico SOAP)
const PJE_ENDPOINTS = {
  tjsp:  { host: 'pje.tjsp.jus.br',       path: '/pje/ConsultaProcessual' },
  tjmg:  { host: 'pje.tjmg.jus.br',       path: '/pje/ConsultaProcessual' },
  tjrj:  { host: 'pje1g.tjrj.jus.br',     path: '/pje/ConsultaProcessual' },
  tjrs:  { host: 'pje.tjrs.jus.br',       path: '/pje/ConsultaProcessual' },
  tjba:  { host: 'pje.tjba.jus.br',       path: '/pje/ConsultaProcessual' },
  tjce:  { host: 'pje.tjce.jus.br',       path: '/pje/ConsultaProcessual' },
  tjpe:  { host: 'pje.tjpe.jus.br',       path: '/pje/ConsultaProcessual' },
  tjgo:  { host: 'pje.tjgo.jus.br',       path: '/pje/ConsultaProcessual' },
  tjpr:  { host: 'projudi.tjpr.jus.br',   path: '/projudi/ConsultaProcessual' },
  trf1:  { host: 'pje.trf1.jus.br',       path: '/pje/ConsultaProcessual' },
  trf2:  { host: 'pje2g.trf2.jus.br',     path: '/pje/ConsultaProcessual' },
  trf3:  { host: 'pje.trf3.jus.br',       path: '/pje/ConsultaProcessual' },
  trf4:  { host: 'eproc.trf4.jus.br',     path: '/eproc2trf4/controlador.php' },
  trf5:  { host: 'pje.trf5.jus.br',       path: '/pje/ConsultaProcessual' },
  tst:   { host: 'pje.tst.jus.br',        path: '/pje/ConsultaProcessual' },
}

// ============================================================
// UTILITARIOS
// ============================================================

function formatarData(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) {
      // Tenta formato dd/mm/yyyy ja formatado
      if (/\d{2}\/\d{2}\/\d{4}/.test(iso)) return iso
      return iso
    }
    return d.toLocaleDateString('pt-BR')
  } catch { return iso }
}

// Faz uma requisicao HTTPS com certificado pfx (TLS mutuo)
function httpsRequestComCert(options, body, pfxBuffer, pfxSenha) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      ...options,
      pfx: pfxBuffer,
      passphrase: pfxSenha,
      rejectUnauthorized: false, // Tribunais frequentemente usam certs auto-assinados
    }
    const req = https.request(reqOptions, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }))
    })
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

// Extrai conteudo de uma tag XML (simples, sem namespace)
function xmlExtract(xml, tag) {
  const re = new RegExp(`<(?:[^:>]+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:[^:>]+:)?${tag}>`, 'i')
  return xml.match(re)?.[1]?.trim() || null
}

// Extrai todas as ocorrencias de um bloco XML
function xmlExtractAll(xml, tag) {
  const re = new RegExp(`<(?:[^:>]+:)?${tag}[^>]*>[\\s\\S]*?<\\/(?:[^:>]+:)?${tag}>`, 'gi')
  return xml.match(re) || []
}

// Parseia resposta SOAP PJe para estrutura de processo
function parsePJeSOAP(xml, tribunal, numeroLimpo) {
  const andamentosRaw = xmlExtractAll(xml, 'movimento')
  const andamentos = andamentosRaw.map((m, idx) => {
    const data = xmlExtract(m, 'dataHora') || xmlExtract(m, 'data') || ''
    const desc = xmlExtract(m, 'descricao') || xmlExtract(m, 'nome') || xmlExtract(m, 'movimento') || ''
    const complemento = xmlExtract(m, 'complemento') || ''
    return {
      data: formatarData(data),
      descricao: complemento ? `${desc} - ${complemento}` : desc,
      ordem: idx + 1,
    }
  }).filter(a => a.descricao).sort((a, b) => {
    const parse = d => { const [dd, mm, aa] = (d || '').split('/'); return aa ? new Date(`${aa}-${mm}-${dd}`).getTime() : 0 }
    return parse(b.data) - parse(a.data)
  })

  const partesRaw = xmlExtractAll(xml, 'parte')
  const partes = partesRaw.map(p => {
    const nome = xmlExtract(p, 'nome') || ''
    const polo = xmlExtract(p, 'polo') || ''
    const tipo = xmlExtract(p, 'tipoParte') || ''
    const label = polo || tipo
    return nome ? (label ? `${label}: ${nome}` : nome) : null
  }).filter(Boolean)

  return {
    numero: xmlExtract(xml, 'numeroProcesso') || xmlExtract(xml, 'numProcesso') || numeroLimpo,
    tribunal: tribunalLabels[tribunal] || tribunal.toUpperCase(),
    classe: xmlExtract(xml, 'classeProcessual') || xmlExtract(xml, 'classe') || 'Nao informada',
    assunto: xmlExtract(xml, 'assuntoProcessual') || xmlExtract(xml, 'assunto') || 'Nao informado',
    dataAjuizamento: formatarData(xmlExtract(xml, 'dataAjuizamento') || ''),
    orgaoJulgador: xmlExtract(xml, 'orgaoJulgador') || xmlExtract(xml, 'vara') || '',
    grau: xmlExtract(xml, 'grau') || '',
    valorCausa: xmlExtract(xml, 'valorCausa') || '',
    situacao: xmlExtract(xml, 'situacaoProcesso') || xmlExtract(xml, 'situacao') || '',
    sistema: 'PJe',
    partes,
    andamentos,
    origem: 'pje-certificado',
  }
}

// Parseia secoes do resumo gerado pela IA
function parseSecoesSumario(texto) {
  if (!texto) return {}
  // Tenta extrair cada secao numerada
  const sections = {}

  const extrairSecao = (nums, nomeSaida) => {
    for (const num of nums) {
      // Padrao: "1. **TITULO**\n...conteudo..." ou "1. TITULO\n..."
      const re = new RegExp(`${num}\\.\\s*(?:\\*{1,2})?[^\\n]+(?:\\*{1,2})?\\s*\\n([\\s\\S]*?)(?=\\n\\d+\\.|$)`, 'i')
      const m = texto.match(re)
      if (m?.[1]?.trim()) {
        sections[nomeSaida] = m[1].trim().replace(/^\*{1,2}|\*{1,2}$/g, '').trim()
        return
      }
    }
  }

  extrairSecao(['1'], 'resumo')
  extrairSecao(['2'], 'statusAtual')
  extrairSecao(['3'], 'analise')
  extrairSecao(['4'], 'proximosPassos')

  return sections
}

// ============================================================
// ROTAS: CERTIFICADOS A1
// ============================================================

// POST /api/processos/certificado — salva um certificado .pfx
router.post('/certificado', async (req, res) => {
  const { nome, advogado, pfxBase64, senha, oab } = req.body
  if (!nome || !pfxBase64 || !senha) {
    return res.status(400).json({ success: false, message: 'Nome, arquivo pfx e senha sao obrigatorios' })
  }

  try {
    // Valida que e um pfx real tentando ler como Buffer
    const pfxBuffer = Buffer.from(pfxBase64, 'base64')
    if (pfxBuffer.length < 100) {
      return res.status(400).json({ success: false, message: 'Arquivo pfx invalido ou muito pequeno' })
    }

    const id = crypto.randomUUID()
    const pfxPath = path.join(CERT_DIR, `${id}.pfx`)
    const metaPath = path.join(CERT_DIR, `${id}.json`)

    // Salva o arquivo pfx binario
    fs.writeFileSync(pfxPath, pfxBuffer)

    // Salva metadados com senha criptografada
    const meta = {
      id,
      nome,
      advogado: advogado || '',
      oab: oab || '',
      senhaEnc: encryptSenha(senha),
      criadoEm: new Date().toISOString(),
      tamanho: pfxBuffer.length,
    }
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8')

    console.log(`[Processos] Certificado salvo: ${nome} (${id})`)
    res.json({ success: true, id, nome, advogado, oab })
  } catch (err) {
    console.error('[Processos] Erro ao salvar certificado:', err)
    res.status(500).json({ success: false, message: `Erro ao salvar certificado: ${err.message}` })
  }
})

// GET /api/processos/certificados — lista certificados salvos
router.get('/certificados', (req, res) => {
  try {
    const arquivos = fs.readdirSync(CERT_DIR).filter(f => f.endsWith('.json'))
    const certs = arquivos.map(f => {
      try {
        const meta = JSON.parse(fs.readFileSync(path.join(CERT_DIR, f), 'utf8'))
        // Nao expoe a senha criptografada
        const { senhaEnc, ...seguro } = meta
        return seguro
      } catch { return null }
    }).filter(Boolean).sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))

    res.json({ success: true, certificados: certs })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// DELETE /api/processos/certificado/:id — remove um certificado
router.delete('/certificado/:id', (req, res) => {
  const { id } = req.params
  // Valida que o id e um UUID valido (evita path traversal)
  if (!/^[\w-]{36}$/.test(id)) {
    return res.status(400).json({ success: false, message: 'ID invalido' })
  }
  try {
    const pfxPath = path.join(CERT_DIR, `${id}.pfx`)
    const metaPath = path.join(CERT_DIR, `${id}.json`)
    if (fs.existsSync(pfxPath)) fs.unlinkSync(pfxPath)
    if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath)
    console.log(`[Processos] Certificado removido: ${id}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ============================================================
// ROTA: BUSCA COM CERTIFICADO (TLS Mutuo)
// ============================================================

// POST /api/processos/buscar-autenticado
// Tenta PJe/EPROC com o certificado; cai para DataJud se nao disponivel
router.post('/buscar-autenticado', async (req, res) => {
  const { numero, tribunal, certificadoId } = req.body
  if (!numero || !tribunal) {
    return res.status(400).json({ success: false, message: 'Numero e tribunal sao obrigatorios' })
  }

  const numeroLimpo = numero.replace(/\D/g, '')
  if (numeroLimpo.length < 15) {
    return res.status(400).json({ success: false, message: 'Numero de processo invalido (minimo 15 digitos)' })
  }

  // Carrega o certificado se informado
  let pfxBuffer = null
  let pfxSenha = null
  if (certificadoId) {
    try {
      const metaPath = path.join(CERT_DIR, `${certificadoId}.json`)
      const pfxPath = path.join(CERT_DIR, `${certificadoId}.pfx`)
      if (fs.existsSync(metaPath) && fs.existsSync(pfxPath)) {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
        pfxBuffer = fs.readFileSync(pfxPath)
        pfxSenha = decryptSenha(meta.senhaEnc)
      }
    } catch (e) {
      console.warn('[Processos] Nao foi possivel carregar certificado:', e.message)
    }
  }

  // Tenta PJe/EPROC se houver endpoint mapeado e certificado disponivel
  if (pfxBuffer && PJE_ENDPOINTS[tribunal]) {
    const ep = PJE_ENDPOINTS[tribunal]
    console.log(`[Processos] Tentando consulta PJe autenticada em ${ep.host}...`)

    try {
      // SOAP ConsultaProcessual (padrao PJe / CNJ WSDL)
      const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:con="http://www.cnj.jus.br/PJe/ConsultaProcessual">
  <soapenv:Header/>
  <soapenv:Body>
    <con:consultarProcesso>
      <con:numeroProcesso>${numeroLimpo}</con:numeroProcesso>
    </con:consultarProcesso>
  </soapenv:Body>
</soapenv:Envelope>`

      const resp = await httpsRequestComCert(
        {
          hostname: ep.host,
          port: 443,
          path: ep.path,
          method: 'POST',
          headers: {
            'Content-Type': 'text/xml; charset=UTF-8',
            'SOAPAction': '"http://www.cnj.jus.br/PJe/ConsultaProcessual/consultarProcesso"',
            'Content-Length': Buffer.byteLength(soapBody, 'utf8'),
          },
        },
        soapBody,
        pfxBuffer,
        pfxSenha
      )

      if (resp.status === 200 && resp.body.includes('Envelope')) {
        const processo = parsePJeSOAP(resp.body, tribunal, numeroLimpo)
        if (processo.andamentos.length > 0 || processo.partes.length > 0) {
          console.log(`[Processos] PJe retornou dados para ${numeroLimpo}: ${processo.andamentos.length} andamentos`)
          return res.json({
            success: true,
            processo,
            fonte: 'PJe (certificado A1)',
          })
        }
      }

      console.log(`[Processos] PJe nao retornou dados uteis (HTTP ${resp.status}), usando DataJud como fallback`)
    } catch (pjeErr) {
      console.warn(`[Processos] PJe falhou (${pjeErr.message}), usando DataJud como fallback`)
    }
  }

  // Fallback: DataJud publico
  const indice = indexMap[tribunal]
  if (!indice) {
    return res.status(400).json({ success: false, message: 'Tribunal nao suportado' })
  }

  try {
    const url = `https://api-publica.datajud.cnj.jus.br/${indice}/_search`
    const query = { query: { match: { numeroProcesso: numeroLimpo } } }

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `APIKey ${DATAJUD_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(query),
    })

    if (!resp.ok) {
      return res.status(502).json({ success: false, message: `Falha no DataJud (HTTP ${resp.status})` })
    }

    const data = await resp.json()
    const hits = data?.hits?.hits || []
    if (hits.length === 0) {
      return res.status(404).json({ success: false, message: 'Processo nao encontrado no tribunal selecionado.' })
    }

    const src = hits[0]._source || {}
    const movimentos = (src.movimentos || []).map((m, idx) => ({
      data: formatarData(m.dataHora),
      descricao: m.nome || '(sem descricao)',
      codigo: m.codigo || null,
      complemento: m.complementosTabelados?.map(c => c.nome).join('; ') || '',
      ordem: idx + 1,
    })).sort((a, b) => {
      const parse = d => { const [dd, mm, aa] = (d || '').split('/'); return aa ? new Date(`${aa}-${mm}-${dd}`).getTime() : 0 }
      return parse(b.data) - parse(a.data)
    })

    const partes = []
    if (src.partes) {
      src.partes.forEach(p => {
        const nome = p.nome || p.pessoa?.nome || ''
        const polo = p.polo || ''
        const advs = (p.advogados || []).map(a => a.nome).join(', ')
        let entry = polo ? `${polo}: ${nome}` : nome
        if (advs) entry += ` (Advogado(s): ${advs})`
        if (nome) partes.push(entry)
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
      valorCausa: src.valorCausa ? `R$ ${Number(src.valorCausa).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '',
      nivelSigilo: src.nivelSigilo || 0,
      partes,
      andamentos: movimentos,
      origem: pfxBuffer ? 'datajud-com-cert-fallback' : 'datajud',
    }

    const fonte = pfxBuffer
      ? 'DataJud (certificado A1 carregado — tribunal sem PJe mapeado ou indisponivel)'
      : 'DataJud (publico)'

    res.json({ success: true, processo, fonte })
  } catch (err) {
    console.error('[Processos] Erro na busca autenticada:', err.message)
    res.status(500).json({ success: false, message: `Erro: ${err.message}` })
  }
})

// ============================================================
// ROTA: BUSCA PUBLICA (DataJud) — existente, mantida
// ============================================================

router.post('/buscar', async (req, res) => {
  const { numero, tribunal } = req.body
  if (!numero || !tribunal) {
    return res.status(400).json({ success: false, message: 'Numero e tribunal sao obrigatorios' })
  }

  const indice = indexMap[tribunal]
  if (!indice) {
    return res.status(400).json({ success: false, message: 'Tribunal nao suportado' })
  }

  const numeroLimpo = numero.replace(/\D/g, '')
  if (numeroLimpo.length < 15) {
    return res.status(400).json({ success: false, message: 'Numero de processo invalido. Use o formato CNJ com 20 digitos.' })
  }

  const url = `https://api-publica.datajud.cnj.jus.br/${indice}/_search`
  const query = { query: { match: { numeroProcesso: numeroLimpo } } }

  console.log(`[Processos] Buscando ${numeroLimpo} em ${indice}...`)

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `APIKey ${DATAJUD_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(query),
    })

    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
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

    const movimentos = (src.movimentos || []).map((m, idx) => ({
      data: formatarData(m.dataHora),
      descricao: m.nome || '(sem descricao)',
      codigo: m.codigo || null,
      complemento: m.complementosTabelados?.map(c => c.nome).join('; ') || '',
      ordem: idx + 1,
    })).sort((a, b) => {
      const parse = d => { const [dd, mm, aa] = (d || '').split('/'); return aa ? new Date(`${aa}-${mm}-${dd}`).getTime() : 0 }
      return parse(b.data) - parse(a.data)
    })

    const partes = []
    if (src.partes) {
      src.partes.forEach(p => {
        const nome = p.nome || p.pessoa?.nome || ''
        const polo = p.polo || ''
        const advs = (p.advogados || []).map(a => a.nome).join(', ')
        let entry = polo ? `${polo}: ${nome}` : nome
        if (advs) entry += ` (Advogado(s): ${advs})`
        if (nome) partes.push(entry)
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
      valorCausa: src.valorCausa ? `R$ ${Number(src.valorCausa).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '',
      nivelSigilo: src.nivelSigilo || 0,
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

// ============================================================
// ROTA: RESUMO COM IA
// ============================================================

// POST /api/processos/resumo-ia
router.post('/resumo-ia', async (req, res) => {
  const { processo } = req.body
  if (!processo) {
    return res.status(400).json({ success: false, message: 'Dados do processo sao obrigatorios' })
  }

  // Monta contexto detalhado dos andamentos (ate 80 mais recentes)
  const andamentosStr = (processo.andamentos || [])
    .slice(0, 80)
    .map(a => {
      let linha = a.data ? `${a.data}: ${a.descricao}` : a.descricao
      if (a.complemento) linha += ` [${a.complemento}]`
      return linha
    })
    .join('\n')

  const prompt = `Voce e um assistente juridico especializado em processos judiciais brasileiros.
Analise os dados do processo abaixo e gere um relatorio executivo completo em portugues brasileiro.

DADOS DO PROCESSO:
Numero: ${processo.numero}
Tribunal: ${processo.tribunal}
Classe: ${processo.classe}
Assunto: ${processo.assunto}
Data de Ajuizamento: ${processo.dataAjuizamento || 'nao informada'}
Orgao Julgador: ${processo.orgaoJulgador || 'nao informado'}
Grau: ${processo.grau || 'nao informado'}
Sistema: ${processo.sistema || ''}
Valor da Causa: ${processo.valorCausa || 'nao informado'}
Nivel de Sigilo: ${processo.nivelSigilo || 0}

PARTES:
${processo.partes?.join('\n') || 'nao informadas'}

ANDAMENTOS (${processo.andamentos?.length || 0} total, mostrando os mais recentes):
${andamentosStr || 'nenhum andamento disponivel'}

Gere exatamente 4 secoes numeradas conforme abaixo:

1. RESUMO DO PROCESSO
Escreva 3 a 5 paragrafos contextualizando o caso: quem sao as partes, qual e o objeto da acao, quando foi ajuizado e em que tribunal. Seja objetivo e claro para um cliente leigo.

2. STATUS ATUAL
Escreva 1 a 2 paragrafos descrevendo a fase atual do processo, os ultimos acontecimentos relevantes registrados e qualquer decisao importante identificada nos andamentos.

3. ANALISE DOS ANDAMENTOS
Identifique os 5 marcos mais importantes do processo em ordem cronologica. Comente o que cada um significa juridicamente de forma simples.

4. PROXIMOS PASSOS RECOMENDADOS
Liste de 3 a 5 acoes estrategicas recomendadas com base no estado atual do processo. Use linguagem direta, como "Acompanhar a publicacao de...", "Verificar prazo para...", etc.

Escreva de forma profissional, clara e adequada para apresentacao ao cliente. Evite jargao juridico excessivo.`

  console.log(`[Processos] Gerando resumo IA para processo ${processo.numero}...`)

  let tmpFile = null
  try {
    tmpFile = path.join(os.tmpdir(), `resumo_proc_${Date.now()}.txt`)
    fs.writeFileSync(tmpFile, prompt, 'utf8')

    const resultado = execSync(`type "${tmpFile}" | claude --print`, {
      shell: 'cmd.exe',
      timeout: 120000,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    })

    const secoes = parseSecoesSumario(resultado)
    console.log(`[Processos] Resumo IA gerado com ${resultado.length} caracteres`)

    res.json({
      success: true,
      resumoCompleto: resultado,
      secoes,
    })
  } catch (err) {
    console.error('[Processos] Erro ao gerar resumo IA:', err.message)

    // Verifica se e problema do claude nao estar no PATH
    if (err.message.includes('nao e reconhecido') || err.message.includes('not recognized') || err.message.includes('ENOENT')) {
      return res.status(500).json({
        success: false,
        message: 'Claude nao encontrado no PATH. Certifique-se de que o Claude Code esta instalado e disponivel na linha de comando.',
      })
    }

    res.status(500).json({
      success: false,
      message: `Erro ao gerar resumo com IA: ${err.message}`,
    })
  } finally {
    if (tmpFile && fs.existsSync(tmpFile)) {
      try { fs.unlinkSync(tmpFile) } catch {}
    }
  }
})

// ============================================================
// GERACAO DO RELATORIO EM DOCX
// ============================================================

const COLOR_PRIMARY = '46548C'
const COLOR_ACCENT = 'E8A14A'
const COLOR_DARK = '222B4C'
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
        children: [new Paragraph({ children: [new TextRun({
          text: a.complemento ? `${a.descricao} [${a.complemento}]` : (a.descricao || ''),
          size: 18,
        })] })],
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

    let partesChildren = [paragraph('Nao informado')]
    if (processo.partes && processo.partes.length > 0) {
      partesChildren = processo.partes.map(p => new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun({ text: p, size: 22 })],
      }))
    }

    const toParagraphs = (texto, opts = {}) => {
      if (!texto || !texto.trim()) return [paragraph('(Nao informado)', { italics: true, color: '888888' })]
      return texto.split('\n').map(linha =>
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
            id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
            run: { size: 32, bold: true, font: 'Arial', color: COLOR_PRIMARY },
            paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 0 },
          },
          {
            id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
            run: { size: 26, bold: true, font: 'Arial', color: COLOR_PRIMARY },
            paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 1 },
          },
        ],
      },
      numbering: {
        config: [{
          reference: 'bullets',
          levels: [{
            level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        }],
      },
      sections: [{
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
          },
        },
        headers: {
          default: new Header({
            children: [new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: 'GESTAO 360  |  IPECONECT', bold: true, color: COLOR_ACCENT, size: 16 })],
              border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR_ACCENT, space: 4 } },
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
          // CAPA
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

          // 1. DADOS
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
              ...(processo.valorCausa ? [infoRow('Valor da causa', processo.valorCausa)] : []),
              ...(processo.sistema ? [infoRow('Sistema', processo.sistema)] : []),
            ],
          }),

          // 2. PARTES
          heading('2. Partes do Processo', HeadingLevel.HEADING_1),
          ...partesChildren,

          // 3. RESUMO
          heading('3. Resumo do Caso', HeadingLevel.HEADING_1),
          ...toParagraphs(resumo),

          // 4. STATUS
          heading('4. Status Atual', HeadingLevel.HEADING_1),
          ...toParagraphs(statusAtual),

          // 5. PROXIMOS PASSOS
          heading('5. Proximos Passos', HeadingLevel.HEADING_1),
          ...toParagraphs(proximosPassos),

          // 6. ANDAMENTOS
          new Paragraph({ pageBreakBefore: true, heading: HeadingLevel.HEADING_1, children: [new TextRun('6. Andamentos do Processo')] }),
          paragraph(`Total de ${processo.andamentos?.length || 0} registros, ordenados do mais recente para o mais antigo.`, { italics: true, color: '666666', size: 20 }),
          new Paragraph({ children: [new TextRun('')], spacing: { after: 120 } }),
          ...(processo.andamentos && processo.andamentos.length > 0
            ? [andamentosTable(processo.andamentos)]
            : [paragraph('(Nenhum andamento registrado)', { italics: true, color: '888888' })]),

          // RODAPE
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
