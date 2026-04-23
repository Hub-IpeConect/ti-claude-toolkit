import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { SidebarProvider } from './hooks/useSidebar'
import { AuthProvider } from './hooks/useAuth'
import App from './App'
import './index.css'

// ============================================================
// Patch global do fetch: injeta Authorization: Bearer <token>
// automaticamente em todas as chamadas para /api/*
// e redireciona para o login se receber 401.
// Isso evita ter que alterar cada pagina individualmente.
// ============================================================
const _originalFetch = window.fetch.bind(window)

window.fetch = function (url, options = {}) {
  const urlStr = typeof url === 'string' ? url : (url?.url || '')

  if (urlStr.startsWith('/api/')) {
    const token = sessionStorage.getItem('gestao360_token')
    if (token) {
      options = {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          ...(options.headers || {}),
        },
      }
    }
  }

  return _originalFetch(url, options).then(response => {
    // Token expirado ou invalido => limpa sessao e recarrega para tela de login
    if (
      response.status === 401 &&
      urlStr.startsWith('/api/') &&
      !urlStr.includes('/api/auth/login')
    ) {
      sessionStorage.removeItem('gestao360_token')
      sessionStorage.removeItem('gestao360_user')
      window.location.reload()
    }
    return response
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SidebarProvider>
          <App />
        </SidebarProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
