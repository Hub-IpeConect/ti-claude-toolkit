/**
 * Middleware JWT para proteger todas as rotas /api/*.
 * Rotas isentas: /api/auth/login, /api/health
 */
import { verify } from '../lib/jwt.js'

const JWT_SECRET = process.env.JWT_SECRET || 'gestao360-jwt-mudar-em-producao-2024'

// Rotas que nao precisam de token (endpoints de login e health check)
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/health',
]

export function jwtMiddleware(req, res, next) {
  const path = req.path

  // Libera rotas publicas
  if (PUBLIC_PATHS.some(p => path === p || path.startsWith(p + '/'))) {
    return next()
  }

  const authHeader = req.headers['authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Nao autenticado. Faca login novamente.', code: 'UNAUTHORIZED' })
  }

  const token = authHeader.slice(7)
  try {
    const payload = verify(token, JWT_SECRET)
    req.user = payload // disponibiliza dados do usuario nas rotas
    next()
  } catch (err) {
    const expired = err.message.includes('expirado')
    return res.status(401).json({
      success: false,
      message: expired ? 'Sessao expirada. Faca login novamente.' : 'Token invalido.',
      code: expired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
    })
  }
}
