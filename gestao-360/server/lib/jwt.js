/**
 * Implementacao minima de JWT usando somente crypto nativo do Node.js.
 * Algoritmo: HS256 (HMAC-SHA256).
 * Nao requer dependencias externas.
 */
import crypto from 'crypto'

function parseExpiry(str) {
  const m = String(str).match(/^(\d+)([smhd])$/)
  if (!m) return 8 * 3600
  const mul = { s: 1, m: 60, h: 3600, d: 86400 }
  return parseInt(m[1]) * (mul[m[2]] || 3600)
}

function b64url(obj) {
  return Buffer.from(typeof obj === 'string' ? obj : JSON.stringify(obj))
    .toString('base64url')
}

function fromB64url(str) {
  return Buffer.from(str, 'base64url').toString('utf8')
}

export function sign(payload, secret, expiresIn = '8h') {
  const now = Math.floor(Date.now() / 1000)
  const header = b64url({ alg: 'HS256', typ: 'JWT' })
  const body   = b64url({ ...payload, iat: now, exp: now + parseExpiry(expiresIn) })
  const sig    = crypto.createHmac('sha256', secret)
                       .update(`${header}.${body}`)
                       .digest('base64url')
  return `${header}.${body}.${sig}`
}

export function verify(token, secret) {
  const parts = (token || '').split('.')
  if (parts.length !== 3) throw new Error('Token mal-formado')

  const [header, body, sig] = parts
  const expected = crypto.createHmac('sha256', secret)
                         .update(`${header}.${body}`)
                         .digest('base64url')

  // Comparacao em tempo constante (previne timing attacks)
  const bufSig  = Buffer.from(sig,      'base64url')
  const bufExp  = Buffer.from(expected, 'base64url')
  if (bufSig.length !== bufExp.length || !crypto.timingSafeEqual(bufSig, bufExp)) {
    throw new Error('Assinatura invalida')
  }

  const payload = JSON.parse(fromB64url(body))
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expirado')
  }

  return payload
}
