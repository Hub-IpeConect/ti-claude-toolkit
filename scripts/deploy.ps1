# =============================================================
# Deploy ti-claude-toolkit para Hub-IpeConect
# =============================================================
# Requisitos:
#   - Git instalado
#   - GitHub CLI (gh) instalado e autenticado: gh auth login
#   - Permissao de admin na org Hub-IpeConect
# =============================================================

$ErrorActionPreference = "Stop"

$ORG = "Hub-IpeConect"
$REPO = "ti-claude-toolkit"
$REPO_FULL = "$ORG/$REPO"
$DESCRIPTION = "Toolkit de Skills e Plugins do Claude para a equipe IpeConect"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Deploy: $REPO_FULL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar pre-requisitos
Write-Host "[1/6] Verificando pre-requisitos..." -ForegroundColor Yellow

try { gh auth status 2>&1 | Out-Null }
catch {
    Write-Host "ERRO: GitHub CLI nao esta autenticado. Execute: gh auth login" -ForegroundColor Red
    exit 1
}

try { git --version | Out-Null }
catch {
    Write-Host "ERRO: Git nao encontrado. Instale em https://git-scm.com" -ForegroundColor Red
    exit 1
}

Write-Host "  OK - gh e git disponiveis" -ForegroundColor Green

# 2. Criar repo na organizacao (se nao existir)
Write-Host "[2/6] Verificando repositorio..." -ForegroundColor Yellow

$repoExists = gh repo view $REPO_FULL 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Criando repo $REPO_FULL..." -ForegroundColor Yellow
    gh repo create $REPO_FULL `
        --private `
        --description $DESCRIPTION `
        --clone=false
    Write-Host "  OK - Repo criado" -ForegroundColor Green
} else {
    Write-Host "  OK - Repo ja existe" -ForegroundColor Green
}

# 3. Ir para a pasta do toolkit
Write-Host "[3/6] Preparando arquivos..." -ForegroundColor Yellow

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$TOOLKIT_DIR = Split-Path -Parent $SCRIPT_DIR

Push-Location $TOOLKIT_DIR

# 4. Inicializar git (se necessario)
Write-Host "[4/6] Inicializando git..." -ForegroundColor Yellow

if (-not (Test-Path ".git")) {
    git init
    git branch -M main
}

# Configurar remote
$remoteUrl = "https://github.com/$REPO_FULL.git"
$currentRemote = git remote get-url origin 2>&1
if ($LASTEXITCODE -ne 0) {
    git remote add origin $remoteUrl
} elseif ($currentRemote -ne $remoteUrl) {
    git remote set-url origin $remoteUrl
}

Write-Host "  OK - Git configurado" -ForegroundColor Green

# 5. Criar .gitignore
Write-Host "[5/6] Preparando commit..." -ForegroundColor Yellow

@"
# Cache dos plugins
**/.mcpb-cache/
**/node_modules/
**/__pycache__/
*.pyc
.DS_Store
Thumbs.db
"@ | Set-Content ".gitignore" -Encoding UTF8

# Add e commit
git add -A
git commit -m "feat: adiciona toolkit completo de skills e plugins do Claude

Inclui 12 skills (docx, pdf, pptx, xlsx, canvas-design, etc.)
e 10 plugins (engineering, data, design, operations, etc.)
para uso compartilhado pela equipe IpeConect."

Write-Host "  OK - Commit criado" -ForegroundColor Green

# 6. Push
Write-Host "[6/6] Fazendo push..." -ForegroundColor Yellow

git push -u origin main

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Repo: https://github.com/$REPO_FULL" -ForegroundColor Cyan
Write-Host ""
Write-Host "Proximo passo: adicione o time @$ORG/ti com acesso admin" -ForegroundColor Yellow
Write-Host "  gh api orgs/$ORG/teams/ti/repos/$REPO_FULL -X PUT -f permission=admin" -ForegroundColor Gray
Write-Host ""

Pop-Location
