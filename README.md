# ti-claude-toolkit

Toolkit de Skills e Plugins do Claude para a equipe IpeConect.

Contém as skills (Cowork/Claude Code) e os plugins instalados, organizados para
compartilhamento e backup entre a equipe. Inclui também o projeto **gestao-360** e
a configuração do ambiente **Claude Code**.

> Última sincronização feita pelo Cowork (Gabriel). Skills/plugins de crypto foram
> deliberadamente deixados de fora (skill `edge-validator`, conector Crypto.com e o
> plugin `lseg`).

## Estrutura

```
ti-claude-toolkit/
├── skills/              → Skills do Cowork (15)
│   ├── algorithmic-art/        Arte generativa com p5.js
│   ├── canvas-design/          Design visual (posters, arte em PNG/PDF)
│   ├── consolidate-memory/     Consolidação de memória/contexto
│   ├── docx/                   Criação/edição de documentos Word
│   ├── internal-comms/         Comunicações internas (status, updates, FAQs)
│   ├── learn/                  Explicações didáticas e estudo de conceitos
│   ├── mcp-builder/            Criação de servidores MCP
│   ├── pdf/                    Manipulação de PDFs
│   ├── pptx/                   Criação de apresentações PowerPoint
│   ├── schedule/               Tarefas agendadas
│   ├── setup-cowork/           Setup inicial do Cowork
│   ├── skill-creator/          Criação de novas skills
│   ├── theme-factory/          Temas visuais para artefatos
│   ├── web-artifacts-builder/  Artefatos HTML/React complexos
│   └── xlsx/                   Criação/edição de planilhas Excel
│
├── plugins/             → Plugins completos (skills + conectores MCP) — 23
│   ├── adobe-for-creativity/      Ferramentas Adobe Creative Cloud
│   ├── ai-firstify/               Auditoria/re-engenharia AI-first
│   ├── base44/                    Apps full-stack Base44 (CLI + SDK)
│   ├── box/                       Integrações com o Box Platform
│   ├── brightdata-plugin/         Web scraping, busca e extração de dados
│   ├── cowork-plugin-management/  Gerenciamento de plugins
│   ├── data/                      Análise de dados, SQL, dashboards
│   ├── design/                    UX/UI, acessibilidade, pesquisa
│   ├── desktop-commander/         Terminal, processos e arquivos locais
│   ├── engineering/               Code review, debug, deploy, docs técnicas
│   ├── enterprise-search/         Busca unificada (email, chat, docs, wikis)
│   ├── fastly-agent-toolkit/      Ferramentas e VCL da plataforma Fastly
│   ├── figma/                     MCP do Figma + skills de design
│   ├── finance/                   Contabilidade, SOX, reconciliação
│   ├── operations/                Processos, compliance, runbooks
│   ├── pdf-viewer/                Visualizador interativo de PDFs
│   ├── product-management/        Specs, roadmap, pesquisa de produto
│   ├── product-tracking-skills/   Instrumentação/analytics de produto
│   ├── productivity/              Gestão de tarefas e memória
│   ├── sales/                     Prospecção, outreach, pipeline
│   ├── sanity/                    MCP e skills do Sanity CMS
│   ├── sp-global/                 Dados/analytics financeiros (S&P Global)
│   ├── superpowers/               TDD, debugging, planejamento, code review
│   └── manifest.json              Manifesto dos plugins instalados
│
├── claude-code/         → Configuração do ambiente Claude Code (Raspberry Pi)
│   ├── plugins/                Plugins do Claude Code
│   └── plugins.json           Lista de plugins do Claude Code
│
├── gestao-360/          → Projeto Gestão 360 (app Vite + React + server)
│
└── scripts/
    ├── deploy.ps1       → Script (Windows) para criar repo e fazer push
    └── deploy.sh        → Script (Unix) equivalente
```

## Como Usar

### Opção 1: Instalar Skills no Cowork

Copie a pasta `skills/` para a pasta de skills do seu Cowork
(geralmente `~/.claude/skills/`).

### Opção 2: Instalar Plugins

Os plugins do marketplace **knowledge-work-plugins** (data, design, engineering,
finance, sales, etc.) podem ser instalados direto pelo Cowork em
**Settings > Plugins**. Este repo serve como backup e referência.

O plugin **superpowers** é custom (marketplace "My Uploads") e pode ser
importado manualmente.

### Opção 3: Referência

Use este repo como documentação das capacidades disponíveis no Claude para a equipe.
Consulte `plugins/manifest.json` para a lista completa com versões e descrições.

## Manutenção

- Ao instalar novas skills ou plugins, atualize este repo.
- Mantenha o `plugins/manifest.json` atualizado com os plugins em uso.
- Itens de crypto/trading (`edge-validator`, conector Crypto.com, plugin `lseg`)
  são mantidos fora deste toolkit por decisão da equipe.

## Equipe

Mantido pelo time de TI da IpeConect.
