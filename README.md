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
├── plugins/             → Plugins do Cowork/Windows (marketplace knowledge-work-plugins)
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
├── claude-code/         → Plugins do Claude Code/Pi (marketplace claude-plugins-official)
│   ├── plugins/             Backup dos 11 plugins usados no dev do gestão-360 e afins
│   ├── plugins.json         Manifesto (nome, versão, descrição)
│   └── README.md            Lista e como instalar via /plugin
│
├── gestao-360/          → App do gestão-360 (React + Node.js)
│
└── scripts/
    ├── deploy.ps1       → Script para criar repo e fazer push (Windows)
    └── deploy.sh        → Script equivalente para Linux/Pi
```

> **Cowork/Windows vs Claude Code/Pi:** são dois ambientes distintos com marketplaces
> diferentes. `skills/` + `plugins/` vêm do Cowork; `claude-code/` vem do Claude Code no Pi
> (onde o gestão-360 foi desenvolvido). Skills/agents/commands específicos do bot de cripto
> não entram neste toolkit.

## Como Usar

### Opção 1: Instalar Skills no Cowork

Copie a pasta `skills/` para `~/.claude/skills/` (ou a pasta de skills do seu Cowork).

### Opção 2: Instalar Plugins do Cowork

Os plugins do marketplace (data, design, engineering, etc.) podem ser instalados diretamente pelo Cowork em **Settings > Plugins**. Este repo serve como backup e referência.

### Opção 3: Instalar Plugins do Claude Code (Pi)

Os 11 plugins em `claude-code/plugins/` são do marketplace oficial `claude-plugins-official` e
instaláveis via `/plugin install <nome>@claude-plugins-official`. Veja
[`claude-code/README.md`](claude-code/README.md) para a lista completa e comandos.

### Opção 4: Referência

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
