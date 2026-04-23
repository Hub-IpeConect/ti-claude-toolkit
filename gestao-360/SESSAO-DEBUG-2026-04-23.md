# Gestao-360 — Sessao de Debug: Sherlock Research Profile
**Data:** 23 de Abril de 2026
**Autor:** Roosevelt Afonso Filho + Claude (Cowork Mode)
**Projeto:** `C:\Users\roosevelt.af\Documents\ti-claude-toolkit\gestao-360`

---

## Contexto do Projeto

O **Gestao 360** e um sistema de gestao empresarial modular da Ipeconect (ipeconect.com.br).

### Stack

| Camada   | Tecnologia                       | Porta |
|----------|----------------------------------|-------|
| Frontend | Vite + React 18 + Tailwind CSS   | 3000  |
| Backend  | Node.js + Express                | 3001  |
| Auth     | LDAP/Active Directory + JWT HS256 | —     |

### Como rodar

```bash
# Frontend (raiz do projeto)
npm run dev          # Vite dev server na porta 3000

# Backend (pasta server/)
cd server
npm run dev          # node --watch server.js na porta 3001
```

### Modulos do sistema

1. Administrativo — RH, contratos, recursos
2. Financeiro — Contabilidade, contas a pagar/receber, fluxo de caixa
3. Juridico — Processos legais, compliance, relatorios processuais
4. Controladoria — Auditoria, KPIs, gestao de riscos
5. Marketing — Campanhas, conteudo, **OpenSquad**
6. Legalizacao — Abertura de empresas, licencas
7. Configuracao — Setup do sistema, autenticacao, integracoes

---

## Problema Investigado Nesta Sessao

**O Passo 6 "Revisar dados" do wizard de criacao de Squad (OpenSquad) nao mostrava os dados pesquisados.** Os campos ficavam vazios.

### Sintoma nos logs do servidor

```
[sherlock:B2B] finalizado (code=null, output=0 chars)
[sherlock:B2B] JSON nao encontrado na 1a tentativa — output: ""
[sherlock:B2B] Output vazio — abortando 2a tentativa
```

### Diagnostico

- `code=null` = processo morto por sinal (SIGTERM)
- `output=0` = Claude nao produziu nenhum output

---

## Tentativas de Correcao (em ordem cronologica)

### 1. stdin.write() no spawn — NAO FUNCIONOU

**Hipotese:** Prompt multi-linha passado como argumento de linha de comando quebra no Windows.
**Tentativa:** Usar `child.stdin.write(prompt)` + `child.stdin.end()` em vez de argumento CLI.

```js
const child = spawn('claude', ['--print', '--output-format', 'text'], {
  shell: true,
  stdio: ['pipe', 'pipe', 'pipe'],
})
child.stdin.write(prompt, 'utf8')
child.stdin.end()
```

**Resultado:** `code=null, output=0 chars` — mesmo problema. No Windows, `spawn()` + `shell:true` + `stdin.write()` nao funciona porque `cmd.exe` nao repassa stdin corretamente para o `.cmd` wrapper do Claude.

### 2. type "arquivo" | claude (pipe via arquivo temp) — NAO FUNCIONOU

**Hipotese:** Gravar prompt em arquivo temp e usar pipe do `type` (Windows) / `cat` (Linux).

```js
const tmpFile = path.join(os.tmpdir(), `sherlock-${safeName}-${Date.now()}.txt`)
fs.writeFileSync(tmpFile, prompt, 'utf8')
const pipeCmd = `type "${tmpFile}" | claude --print --output-format text`
const child = spawn(pipeCmd, [], { shell: true, stdio: ['ignore', 'pipe', 'pipe'] })
```

**Resultado:** `code=null, signal=SIGTERM, output=0 chars` — pipe tambem nao funciona com o `.cmd` wrapper.

### 3. Redirecionamento < (input redirect) — NAO FUNCIONOU

**Hipotese:** Redirecionamento `<` e tratado pelo shell antes de invocar o processo, pode funcionar melhor que pipe.

```js
const shellCmd = `chcp 65001 >nul && claude --print --output-format text < "${tmpFile}"`
const child = spawn(shellCmd, [], { shell: true, stdio: ['ignore', 'pipe', 'pipe'] })
```

**Resultado:** `code=null, signal=SIGTERM, output=0 chars` — o `.cmd` wrapper do Claude nao recebe stdin nem via redirecionamento `<`.

### 4. Prompt achatado como argumento direto (uma linha) — SPAWN OK, MAS SSE QUEBRA

**Hipotese:** A rota `/init` funciona com prompt como argumento direto em uma linha. Achatar o prompt de research (remover `\n`, juntar com espacos) e passar como argumento.

```js
const prompt = [...].filter(Boolean).join(' ')  // uma unica linha
const escaped = prompt.replace(/"/g, '\\"')
const shellCmd = `chcp 65001 >nul && claude --print --output-format text "${escaped}"`
const child = spawn(shellCmd, [], { cwd: serverDir, shell: true })
```

**Resultado:** O spawn funcionou! Mas `signal=SIGTERM` continuava. Adicionamos log de diagnostico e descobrimos a causa real.

### 5. Descoberta: req.on('close') mata o child — CAUSA RAIZ ENCONTRADA

Adicionamos log ao handler `req.on('close')`:

```js
req.on('close', () => {
  console.log(`>>> req.on('close') disparou! Matando child...`)
  child.kill()  // <--- ISSO matava o Claude
})
```

**Log revelador:**
```
child.pid=26028
>>> req.on('close') disparou! Matando child...
finalizado (code=null, signal=SIGTERM, output=0 chars)
```

**A conexao SSE era fechada INSTANTANEAMENTE pelo proxy do Vite**, o que disparava `req.on('close')` que chamava `child.kill()`.

### 6. Tentativa de fix no proxy do Vite — NAO FUNCIONOU

Adicionamos `configure`, `timeout`, `proxyTimeout` no `vite.config.js`:

```js
proxy: {
  '/api': {
    target: 'http://127.0.0.1:3001',
    timeout: 300000,
    proxyTimeout: 300000,
  }
}
```

**Resultado:** `req.on('close')` continuava disparando instantaneamente. O proxy do Vite (http-proxy) nao suporta SSE via POST + fetch ReadableStream de forma confiavel.

### 7. SOLUCAO FINAL: Endpoint sincrono (sem SSE)

**Abordagem:** Criar novo endpoint `POST /api/opensquad/research-profile` que funciona como a rota `/init`:
- Espera o Claude terminar
- Retorna JSON na resposta
- Frontend faz uma chamada `fetch()` normal e aguarda

**Backend — novo endpoint em `server/routes/opensquad.js`:**
- Rota: `POST /api/opensquad/research-profile`
- Prompt achatado em uma unica linha (sem `\n`)
- Prompt passado como argumento direto ao `claude --print`
- `cwd: serverDir` (pasta server/ — ja confiavel pelo Claude)
- Sem SSE, sem pipe, sem stdin, sem arquivo temp
- Se o output nao for JSON valido, faz segunda chamada para estruturar

**Frontend — `src/components/NewSquadWizard.jsx`:**
- Chamada simples: `fetch('/api/opensquad/research-profile', { method: 'POST', body: ... })`
- Mostra "Aguardando resposta do Claude (pode levar 1-2 minutos)..."
- Quando recebe resposta, popula os campos e avanca para o step 5

---

## Arquivos Modificados Nesta Sessao

### Arquivos principais

| Arquivo | O que mudou |
|---------|-------------|
| `server/routes/opensquad.js` | Novo endpoint `/research-profile` (sincrono); `import os`; removido endpoint antigo duplicado; `req.on('close')` nao mata mais o child no endpoint SSE |
| `src/components/NewSquadWizard.jsx` | Frontend usa `/research-profile` (POST sincrono) em vez de `/research-profile-stream` (SSE) |
| `vite.config.js` | Adicionado `timeout: 300000` e `proxyTimeout: 300000` no proxy |

### Arquivos modificados em sessoes anteriores (contexto)

| Arquivo | O que mudou |
|---------|-------------|
| `server/lib/jwt.js` | JWT HS256 do zero com crypto nativo |
| `server/middleware/auth.js` | Middleware JWT para rotas protegidas |
| `server/routes/auth.js` | Login unificado local+LDAP, gerenciamento de usuarios |
| `server/routes/ldap.js` | Config LDAP movida para arquivo server-side |
| `src/hooks/useAuth.jsx` | Removido admin hardcoded, login via API |
| `src/main.jsx` | Patch global do fetch para injetar Bearer token |

---

## Status Atual (fim da sessao)

### O que esta PRONTO

- Novo endpoint `POST /api/opensquad/research-profile` — sincrono, sem SSE
- Frontend atualizado para usar o novo endpoint
- Ambos os arquivos validados (`node --check` passa)
- Endpoint antigo SSE (`/research-profile-stream`) mantido mas nao usado pelo frontend

### O que FALTA TESTAR

- **Reiniciar ambos os servidores (frontend + backend) e testar o wizard completo**
- Verificar nos logs se aparece:
  ```
  [sherlock:NomeDoProjeto] Prompt (XXX chars) — modo sincrono
  [sherlock:NomeDoProjeto] child.pid=XXXXX
  [sherlock:NomeDoProjeto] finalizado (code=0, signal=null, output=XXX chars)
  [sherlock:NomeDoProjeto] JSON extraido com sucesso
  ```
- Se `code=0` e output > 0 chars, o problema esta resolvido
- Verificar que o Passo 6 do wizard exibe os dados preenchidos

### Possiveis problemas restantes

1. **Se `code=null` persistir no novo endpoint:** O problema nao e SSE/proxy, e algo no Claude CLI no Windows. Proximo passo seria testar manualmente no terminal:
   ```powershell
   cd C:\Users\roosevelt.af\Documents\ti-claude-toolkit\gestao-360\server
   chcp 65001
   claude --print --output-format text "Diga oi em uma palavra"
   ```
   Se isso tambem falhar, o problema e com o Claude CLI (auth, permissao, etc).

2. **Se funcionar no terminal mas nao via spawn:** Investigar se o `node --watch` esta interferindo (reiniciando o servidor durante a execucao do Claude).

3. **Prompt muito longo para cmd.exe:** O limite e 8191 chars. O prompt atual tem ~1070 chars, bem abaixo do limite. Mas se o nome da empresa ou proposito forem muito longos, pode ultrapassar.

---

## Licoes Aprendidas

1. **No Windows, `spawn()` + `shell:true` + stdin/pipe/redirect nao funciona** com wrappers `.cmd` do Node.js (como o `claude.cmd`). A unica forma confiavel e passar o prompt como argumento direto de linha de comando.

2. **SSE via POST + fetch ReadableStream nao funciona com o proxy do Vite** (http-proxy). O proxy fecha a conexao imediatamente. Para SSE funcionar, seria necessario: usar EventSource (GET only), WebSocket, ou acessar o backend diretamente (bypass proxy).

3. **`req.on('close')` no Express** dispara quando o proxy fecha a conexao, mesmo que o cliente real ainda esteja esperando. Nao confiar nesse evento para cleanup de processos longos quando ha proxy no meio.

4. **O Edit tool do Cowork pode corromper arquivos** com null bytes quando ha dessincronia entre o filesystem do Windows e o sandbox Linux. Workaround: fazer edicoes via `python3` ou `sed` no bash, e sempre verificar com `cat -A` e `node --check`.

5. **Padrao confiavel para spawn no Windows:**
   ```js
   const prompt = 'texto em uma unica linha sem newlines'
   const escaped = prompt.replace(/"/g, '\\"')
   const cmd = `chcp 65001 >nul && claude --print --output-format text "${escaped}"`
   const child = spawn(cmd, [], { cwd: dirConfiavel, shell: true })
   ```

---

## Estrutura do Projeto (referencia rapida)

```
gestao-360/
├── package.json           # Frontend deps
├── vite.config.js         # Vite + proxy config
├── index.html             # Entry point
├── src/
│   ├── App.jsx
│   ├── main.jsx           # Fetch patch (Bearer token)
│   ├── components/
│   │   ├── NewSquadWizard.jsx  # Wizard de criacao de Squad
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   └── ...
│   ├── config/
│   │   └── modules.js     # 7 modulos + sub-modulos
│   ├── hooks/
│   │   ├── useAuth.jsx    # Auth context
│   │   └── useSidebar.jsx
│   └── pages/
│       ├── Home.jsx
│       ├── Login.jsx
│       ├── OpenSquadPage.jsx
│       └── ...
├── server/
│   ├── server.js          # Express entry point
│   ├── package.json       # Backend deps
│   ├── .env               # JWT_SECRET, LDAP config
│   ├── lib/
│   │   ├── jwt.js         # JWT HS256
│   │   └── ldapAuth.js    # LDAP auth
│   ├── middleware/
│   │   └── auth.js        # JWT middleware
│   ├── routes/
│   │   ├── auth.js        # Login/logout
│   │   ├── ldap.js        # LDAP config
│   │   ├── opensquad.js   # OpenSquad (init, research, squads)
│   │   ├── processos.js   # Relatorios processuais
│   │   └── terminal.js    # Terminal web
│   ├── data/
│   │   ├── users.json
│   │   └── ldap-config.json
│   └── opensquad-projects/
│       └── B2B/            # Projetos criados pelo wizard
└── SESSAO-DEBUG-2026-04-23.md  # Este arquivo
```

---

*Documento gerado automaticamente pela sessao de debug com Claude (Cowork Mode) em 23/04/2026.*
