#!/bin/bash
# =============================================================
# Deploy ti-claude-toolkit para Hub-IpeConect
# =============================================================
# Requisitos:
#   - Git instalado
#   - GitHub CLI (gh) instalado e autenticado: gh auth login
#   - Permissao de admin na org Hub-IpeConect
# =============================================================

set -e

ORG="Hub-IpeConect"
REPO="ti-claude-toolkit"
REPO_FULL="$ORG/$REPO"
DESCRIPTION="Toolkit de Skills e Plugins do Claude para a equipe IpeConect"

echo ""
echo "========================================"
echo " Deploy: $REPO_FULL"
echo "========================================"
echo ""

# 1. Verificar pre-requisitos
echo "[1/6] Verificando pre-requisitos..."
if ! gh auth status &>/dev/null; then
    echo "ERRO: GitHub CLI nao esta autenticado. Execute: gh auth login"
    exit 1
fi
if ! git --version &>/dev/null; then
    echo "ERRO: Git nao encontrado."
    exit 1
fi
echo "  OK - gh e git disponiveis"

# 2. Criar repo
echo "[2/6] Verificando repositorio..."
if ! gh repo view "$REPO_FULL" &>/dev/null; then
    echo "  Criando repo $REPO_FULL..."
    gh repo create "$REPO_FULL" \
        --private \
        --description "$DESCRIPTION" \
        --clone=false
    echo "  OK - Repo criado"
else
    echo "  OK - Repo ja existe"
fi

# 3. Ir para pasta do toolkit
echo "[3/6] Preparando arquivos..."
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TOOLKIT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$TOOLKIT_DIR"

# 4. Inicializar git
echo "[4/6] Inicializando git..."
if [ ! -d ".git" ]; then
    git init
    git branch -M main
fi

REMOTE_URL="https://github.com/$REPO_FULL.git"
CURRENT_REMOTE=$(git remote get-url origin 2>/dev/null || echo "")
if [ -z "$CURRENT_REMOTE" ]; then
    git remote add origin "$REMOTE_URL"
elif [ "$CURRENT_REMOTE" != "$REMOTE_URL" ]; then
    git remote set-url origin "$REMOTE_URL"
fi
echo "  OK - Git configurado"

# 5. Commit
echo "[5/6] Preparando commit..."
cat > .gitignore << 'EOF'
# Cache dos plugins
**/.mcpb-cache/
**/node_modules/
**/__pycache__/
*.pyc
.DS_Store
Thumbs.db
EOF

git add -A
git commit -m "feat: adiciona toolkit completo de skills e plugins do Claude

Inclui 12 skills (docx, pdf, pptx, xlsx, canvas-design, etc.)
e 10 plugins (engineering, data, design, operations, etc.)
para uso compartilhado pela equipe IpeConect."
echo "  OK - Commit criado"

# 6. Push
echo "[6/6] Fazendo push..."
git push -u origin main

echo ""
echo "========================================"
echo " SUCESSO!"
echo "========================================"
echo ""
echo "Repo: https://github.com/$REPO_FULL"
echo ""
echo "Proximo passo: adicione o time @$ORG/ti com acesso admin"
echo "  gh api orgs/$ORG/teams/ti/repos/$REPO_FULL -X PUT -f permission=admin"
echo ""
