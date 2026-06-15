# Claude Code — Plugins (Raspberry Pi / Linux)

Plugins do **Claude Code** (CLI no terminal) usados no desenvolvimento do **gestão-360** e demais
projetos de software da IpeConect. Todos vêm do marketplace oficial `claude-plugins-official`.

> Ambiente diferente da pasta `../plugins/` (raiz), que contém plugins do **Cowork/Windows**
> (marketplace `knowledge-work-plugins`). Aqui ficam os do Claude Code no Pi.

> Skills/agents/commands específicos do bot de cripto **não** entram neste toolkit por serem
> de uso interno daquele projeto.

## Plugins incluídos

| Plugin | O que faz |
|--------|-----------|
| **superpowers** | Biblioteca central de skills: TDD, debugging sistemático, brainstorming, planejamento, code review, worktrees. Base de quase todo fluxo. |
| **feature-dev** | Workflow de desenvolvimento de feature com agentes de exploração de código, design de arquitetura e revisão. |
| **frontend-design** | Implementação de UI/UX com qualidade de produção (usado no front do gestão-360). |
| **code-review** | Code review automatizado de PRs com agentes especializados e score de confiança. |
| **pr-review-toolkit** | Agentes de revisão de PR: comentários, testes, tratamento de erro, type design, simplificação. |
| **claude-md-management** | Auditar e manter arquivos `CLAUDE.md` (memória de projeto) atualizados. |
| **skill-creator** | Criar, melhorar e medir performance de skills novas. |
| **github** | MCP oficial do GitHub: issues, PRs, busca em repositórios via API. |
| **context7** | MCP do Context7: documentação atualizada de libs/frameworks direto na fonte. |
| **ralph-loop** | Loops iterativos contínuos (técnica Ralph Wiggum) para desenvolvimento autônomo. |
| **security-guidance** | Revisão de segurança de código gerado: secrets, injection, XSS, SSRF e 25+ classes de vulnerabilidade. |

Detalhes de versão em [`plugins.json`](plugins.json).

## Como instalar

Estes plugins são instaláveis direto pelo marketplace oficial do Claude Code:

```bash
# adicionar o marketplace oficial (se ainda não estiver)
/plugin marketplace add anthropics/claude-plugins

# instalar os plugins
/plugin install superpowers@claude-plugins-official
/plugin install feature-dev@claude-plugins-official
/plugin install frontend-design@claude-plugins-official
/plugin install code-review@claude-plugins-official
/plugin install pr-review-toolkit@claude-plugins-official
/plugin install claude-md-management@claude-plugins-official
/plugin install skill-creator@claude-plugins-official
/plugin install github@claude-plugins-official
/plugin install context7@claude-plugins-official
/plugin install ralph-loop@claude-plugins-official
/plugin install security-guidance@claude-plugins-official
```

A pasta `plugins/` aqui é um **backup fiel** do conteúdo instalado, para referência e para
restaurar caso o marketplace mude. Para uso normal, prefira instalar pelo `/plugin`.
