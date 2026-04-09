# ti-claude-toolkit

Toolkit de Skills e Plugins do Claude para a equipe IpeConect.

Contém todas as skills (Cowork/Claude Code) e plugins instalados, organizados para compartilhamento entre a equipe.

## Estrutura

```
ti-claude-toolkit/
├── skills/              → Skills do Cowork (criação de docs, design, etc.)
│   ├── algorithmic-art/    Arte generativa com p5.js
│   ├── canvas-design/      Design visual (posters, arte em PNG/PDF)
│   ├── docx/               Criação/edição de documentos Word
│   ├── mcp-builder/        Criação de servidores MCP
│   ├── pdf/                Manipulação de PDFs
│   ├── pptx/               Criação de apresentações PowerPoint
│   ├── schedule/           Tarefas agendadas
│   ├── setup-cowork/       Setup inicial do Cowork
│   ├── skill-creator/      Criação de novas skills
│   ├── theme-factory/      Temas visuais para artefatos
│   ├── web-artifacts-builder/  Artefatos HTML/React complexos
│   └── xlsx/               Criação/edição de planilhas Excel
│
├── plugins/             → Plugins completos (skills + conectores MCP)
│   ├── cowork-plugin-management/  Gerenciamento de plugins
│   ├── data/                      Análise de dados, SQL, dashboards
│   ├── design/                    UX/UI, acessibilidade, pesquisa
│   ├── engineering/               Code review, debug, deploy, docs técnicas
│   ├── finance/                   Contabilidade, SOX, reconciliação
│   ├── operations/                Processos, compliance, runbooks
│   ├── pdf-viewer/                Visualizador interativo de PDFs
│   ├── product-management/        Specs, roadmap, sprint planning
│   ├── productivity/              Gestão de tarefas e memória
│   ├── superpowers/               TDD, debugging, planejamento, code review
│   └── manifest.json              Manifesto dos plugins instalados
│
└── scripts/
    └── deploy.ps1       → Script para criar repo e fazer push
```

## Como Usar

### Opção 1: Instalar Skills no Cowork

Copie a pasta `skills/` para `~/.claude/skills/` (ou a pasta de skills do seu Cowork).

### Opção 2: Instalar Plugins

Os plugins do marketplace (data, design, engineering, etc.) podem ser instalados diretamente pelo Cowork em **Settings > Plugins**. Este repo serve como backup e referência.

O plugin **superpowers** é custom e pode ser importado manualmente.

### Opção 3: Referência

Use este repo como documentação das capacidades disponíveis no Claude para a equipe.

## Deploy Inicial

Execute o script PowerShell na sua máquina:

```powershell
.\scripts\deploy.ps1
```

Ele vai criar o repo na organização Hub-IpeConect e fazer o push inicial.

## Manutenção

- Ao instalar novas skills ou plugins, atualize este repo
- Mantenha o `manifest.json` atualizado com os plugins em uso

## Equipe

Mantido pelo time de TI da IpeConect.
