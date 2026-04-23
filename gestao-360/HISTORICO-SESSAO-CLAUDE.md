# Histórico de Sessão — Gestao 360 com Claude
> Gerado em: 22/04/2026 — Para continuar em outra conta/sessão sem perder contexto.

---

## 🗂️ Visão Geral do Projeto

**Projeto:** Gestao 360 — Sistema interno da Ipeconect
**Caminho:** `C:\Users\roosevelt.af\Documents\ti-claude-toolkit\gestao-360`
**Stack:**
- Frontend: React + Vite + TailwindCSS → porta **3000** (`npm run dev` na raiz)
- Backend: Node.js + Express → porta **3001** (`npm run dev` na pasta `server/`)
- Auth: JWT HS256 + LDAP (Active Directory Ipeconect)
- Sem banco de dados — dados em arquivos JSON em `server/data/`

---

## ✅ O Que Foi Feito Nessa Sessão

### 1. Módulo: Relatórios Processuais — Certificados A1

**Objetivo:** Permitir que advogados façam upload de certificados digitais `.pfx` para consulta autenticada em tribunais (PJe, EPROC, PROJUDI).

**Arquivo:** `server/routes/processos.js` — **completamente reescrito**

O que foi implementado:
- Armazenamento de `.pfx` em `server/data/certificados/{id}.pfx` + `{id}.json`
- Senha do certificado criptografada com AES-256-CBC (`encryptSenha` / `decryptSenha`)
- Mutual TLS via `https.request()` com `pfx` + `passphrase`
- Mapa `PJE_ENDPOINTS` com host/path por tribunal
- Parser XML SOAP via regex (`parsePJeSOAP`)
- Endpoints novos:
  - `POST /api/processos/certificado` — upload
  - `GET /api/processos/certificados` — listar
  - `DELETE /api/processos/certificado/:id` — excluir
  - `POST /api/processos/buscar-autenticado` — consulta com mTLS
  - `POST /api/processos/resumo-ia` — gera resumo via `claude --print`

**Arquivo:** `src/pages/RelatoriosProcessuais.jsx` — **completamente reescrito**

O que foi implementado:
- 3 abas: "Busca automática", "Entrada manual", "Certificados A1"
- Modal de upload de `.pfx` (lê como base64 via FileReader)
- Checkbox para selecionar certificado na busca
- Card violeta "Gerar resumo com IA" após processo carregado
- Função `gerarResumoIA()` que chama `/api/processos/resumo-ia`

---

### 2. Segurança — Etapa 2 de 2

**Objetivo:** JWT em todas as rotas, remover `admin/admin` hardcoded, LDAP config no servidor.

#### Novos arquivos criados:

**`server/lib/jwt.js`**
```js
// JWT HS256 do zero usando apenas crypto nativo do Node.js
// (sem dependência jsonwebtoken — bloqueada pela política de segurança)
export function sign(payload, secret, expiresIn = '8h') { ... }
export function verify(token, secret) { ... }
```

**`server/lib/ldapAuth.js`**
```js
// Funções extraídas do ldap.js para reutilização
export function createLdapClient(config) { ... }
export function bindAsUser(config, username, password) { ... }
export function searchUserData(client, config, username) { ... }
export function checkGroupMembership(config, memberOf, username) { ... }
```

**`server/middleware/auth.js`**
```js
const PUBLIC_PATHS = ['/api/auth/login', '/api/health']
export function jwtMiddleware(req, res, next) {
  // Verifica Bearer token em todas as rotas protegidas
}
```

**`server/routes/auth.js`**
```js
// POST /api/auth/login — login local (users.json + PBKDF2) ou LDAP
// GET/POST /api/auth/users — gerenciar usuários (admin only)
// POST /api/auth/users/:username/senha — trocar senha
// Primeiro uso: cria users.json com admin + ADMIN_PASSWORD do .env
```

#### Arquivos modificados:

**`server/server.js`** — ordem correta das rotas:
```js
app.use('/api/auth', authRoutes)      // público
app.get('/api/health', ...)           // público
app.use(jwtMiddleware)                // protege tudo abaixo
app.use('/api/ldap', ldapRoutes)
app.use('/api/processos', processosRoutes)
```

**`server/.env`** — adicionado:
```
JWT_SECRET=gestao360-jwt-mudar-em-producao-2024
JWT_EXPIRES=8h
ADMIN_PASSWORD=gestao360@admin
```

**`src/hooks/useAuth.jsx`** — completamente reescrito:
- Removido array `localUsers` com `admin/admin` hardcoded
- `login()` agora chama `POST /api/auth/login`
- JWT salvo em `sessionStorage('gestao360_token')`
- Usuário salvo em `sessionStorage('gestao360_user')`

**`src/main.jsx`** — patch global do fetch:
```js
// Injeta automaticamente Authorization: Bearer <token> em todas as chamadas /api/*
// Se receber 401, limpa sessão e recarrega para tela de login
window.fetch = function(url, options = {}) { ... }
```

**`src/pages/LdapConfig.jsx`** — modificado:
- `useEffect` carrega config de `GET /api/ldap/config` ao montar
- `handleSave()` chama `POST /api/ldap/config` (era `localStorage.setItem`)
- Removido todo uso de `localStorage`

**`server/routes/ldap.js`** — modificado:
- Importa funções de `server/lib/ldapAuth.js`
- `GET /api/ldap/config` e `POST /api/ldap/config` (admin only)
- Config salva em `server/data/ldap-config.json`

#### Credenciais após a mudança:
- **Usuário:** `admin` (ou login LDAP da rede)
- **Senha:** `gestao360@admin` (definida no `.env` como `ADMIN_PASSWORD`)
- Login LDAP continua funcionando normalmente (testado: Roosevelt Afonso Filho ✅)

---

### 3. OpenSquad — Fix do Passo 6 "Revisar dados"

**Problema:** Ao chegar no Passo 6 após a pesquisa do Sherlock, todos os campos ficavam vazios.

**Arquivo:** `src/components/NewSquadWizard.jsx` — modificado

O que foi adicionado:
- Estado `sherlockRaw` — armazena o output completo do Sherlock
- Estado `sherlockRawOpen` — controla painel colapsável
- SSE `done` handler salva `evt.raw` em `sherlockRaw`
- `useEffect` abre o painel automaticamente quando campos estão vazios
- Passo 5 reconstruído com 3 estados:
  - ✅ Verde: `description` E `audience` preenchidos pelo Sherlock
  - ⚠️ Âmbar: Sherlock pesquisou mas não estruturou — painel abre automaticamente
  - ⬜ Cinza: sem dados — preenchimento manual

**Arquivo:** `server/routes/opensquad.js` — modificado

O que foi corrigido:
- `tryExtractJson()` reescrito com parser de chaves (profundidade) — o regex antigo `*?` era não-greedy e errava em JSON multi-linha
- `raw: fullOutput.slice(-500)` → `raw: fullOutput.slice(0, 6000)` — agora envia o output completo
- `raw` enviado também no caso de sucesso (não só na falha)
- Logs de diagnóstico adicionados

---

## 🔴 Problema em Aberto — NÃO RESOLVIDO

### OpenSquad: `claude --print` retorna `output=0 chars, code=null`

**Sintoma no log do servidor:**
```
[sherlock:B2B-Certificadora] finalizado (code=null, output=0 chars)
[sherlock:B2B-Certificadora] JSON nao encontrado na 1a tentativa — output: ""
[sherlock:B2B-Certificadora] Output vazio — abortando 2a tentativa
```

**`code=null`** = processo morto por sinal (não saiu normalmente).
**`output=0`** = Claude não produziu nada antes de morrer.

**Causa provável:** O `spawn` de `claude --print` está falhando silenciosamente. Já tentamos:
1. ❌ Mudar cwd para pasta do projeto novo → pasta vazia, Claude pede configuração
2. ❌ Mudar cwd para pasta `server/` → ainda `output=0`
3. ❌ Remover crases do prompt (quebravam PowerShell)
4. ❌ Escapar aspas duplas no prompt
5. 🔄 **Última tentativa (NÃO TESTADA AINDA):** passar prompt via `stdin` em vez de argumento:

```js
// Em server/routes/opensquad.js — router.post('/research-profile-stream', ...)
const child = spawn('claude', ['--print', '--output-format', 'text'], {
  cwd: serverDir,   // path.resolve(__dirname, '..') = pasta server/
  shell: true,
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, FORCE_COLOR: '0', PYTHONIOENCODING: 'utf-8' },
})
child.stdin.write(prompt, 'utf8')
child.stdin.end()
```

**Próximos passos para resolver:**

1. **Testar a versão stdin** — reiniciar o servidor e rodar um novo squad. Ver no terminal se `output` é > 0.

2. **Se ainda falhar:** testar manualmente no terminal o comando:
   ```powershell
   cd C:\Users\roosevelt.af\Documents\ti-claude-toolkit\gestao-360\server
   echo "Diga ola" | claude --print --output-format text
   ```
   Se funcionar, o problema é de como o Node.js está fazendo o spawn.

3. **Se `claude --print` não aceitar stdin:** usar arquivo temporário:
   ```js
   import { tmpdir } from 'os'
   const tmpFile = path.join(tmpdir(), `prompt-${Date.now()}.txt`)
   fs.writeFileSync(tmpFile, prompt, 'utf8')
   const cmd = isWindows
     ? `chcp 65001 >nul && claude --print --output-format text < "${tmpFile}"`
     : `cat "${tmpFile}" | claude --print --output-format text`
   ```

4. **Alternativa final:** chamar a API da Anthropic diretamente no backend (requer `ANTHROPIC_API_KEY` no `.env`):
   ```js
   const res = await fetch('https://api.anthropic.com/v1/messages', {
     method: 'POST',
     headers: {
       'x-api-key': process.env.ANTHROPIC_API_KEY,
       'anthropic-version': '2023-06-01',
       'content-type': 'application/json',
     },
     body: JSON.stringify({
       model: 'claude-opus-4-5',
       max_tokens: 1024,
       messages: [{ role: 'user', content: prompt }],
     }),
   })
   ```

---

## 📁 Mapa de Arquivos Modificados

```
gestao-360/
├── server/
│   ├── server.js              ✅ modificado (ordem das rotas + JWT middleware)
│   ├── .env                   ✅ modificado (JWT_SECRET, JWT_EXPIRES, ADMIN_PASSWORD)
│   ├── routes/
│   │   ├── auth.js            ✅ NOVO (login unificado + gerenciamento de usuários)
│   │   ├── ldap.js            ✅ modificado (GET/POST /config, usa ldapAuth.js)
│   │   ├── processos.js       ✅ reescrito (certificados A1 + resumo IA)
│   │   └── opensquad.js       🔴 modificado + problema em aberto (spawn claude)
│   ├── middleware/
│   │   └── auth.js            ✅ NOVO (jwtMiddleware)
│   ├── lib/
│   │   ├── jwt.js             ✅ NOVO (JWT HS256 nativo)
│   │   └── ldapAuth.js        ✅ NOVO (funções LDAP extraídas)
│   └── data/
│       ├── users.json         ✅ criado automaticamente no 1º uso
│       ├── ldap-config.json   ✅ criado automaticamente
│       └── certificados/      ✅ criado automaticamente
│           ├── {id}.pfx
│           └── {id}.json
└── src/
    ├── main.jsx               ✅ modificado (patch global fetch)
    ├── hooks/
    │   └── useAuth.jsx        ✅ reescrito (sem admin hardcoded, JWT)
    ├── pages/
    │   ├── LdapConfig.jsx     ✅ modificado (GET/POST /api/ldap/config)
    │   └── RelatoriosProcessuais.jsx  ✅ reescrito (certificados A1)
    └── components/
        └── NewSquadWizard.jsx ✅ modificado (sherlockRaw, painel colapsável)
```

---

## 🚀 Como Rodar o Projeto

```bash
# Terminal 1 — Backend
cd C:\Users\roosevelt.af\Documents\ti-claude-toolkit\gestao-360\server
npm run dev
# Servidor sobe em http://localhost:3001

# Terminal 2 — Frontend
cd C:\Users\roosevelt.af\Documents\ti-claude-toolkit\gestao-360
npm run dev
# App em http://localhost:3000
```

**Login:**
- Via LDAP: usuário e senha da rede Ipeconect (ex: `roosevelt.af`)
- Via local: `admin` / `gestao360@admin`

---

## 💡 Observações Importantes

- O JWT é implementado do zero com `crypto` nativo do Node.js (sem `jsonwebtoken`) porque pacotes externos estão bloqueados pela política de segurança da máquina.
- `node --watch` faz reload automático do servidor ao salvar qualquer arquivo — não precisa reiniciar manualmente.
- O Vite do frontend faz hot reload automático também.
- Os arquivos `users.json` e `ldap-config.json` são criados automaticamente no primeiro uso — não precisam existir previamente.
- A pasta `server/data/certificados/` também é criada automaticamente.
