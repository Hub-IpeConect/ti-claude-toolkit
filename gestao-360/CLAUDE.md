# Gestao 360 - Contexto do Projeto

## Sobre
Sistema modular de gestao empresarial para a empresa Ipeconect (ipeconect.com.br).
Frontend em React + Vite + Tailwind CSS com arquitetura modular.

## Identidade Visual
- **Azul principal**: #46548C (RGB 70, 84, 140)
- **Azul escuro**: #3A4A81 (RGB 58, 74, 130)
- **Azul claro**: #8098C8 (RGB 128, 152, 200)
- **Laranja/dourado**: #E8A14A (RGB 232, 160, 74)
- **Pessego claro**: #F0DCCC (RGB 240, 220, 204)
- **Fonte**: Inter (Google Fonts)
- **Grafismos**: Triangulos/setas derivados do logo (ver src/components/BrandGraphics.jsx)

## Estrutura
```
gestao-360/
├── src/
│   ├── config/         # Configuracao centralizada (modules.js)
│   ├── components/     # Componentes reutilizaveis
│   │   ├── Sidebar.jsx         # Menu lateral com sub-itens expansiveis
│   │   ├── Header.jsx          # Cabecalho com busca e notificacoes
│   │   ├── ModuleCard.jsx      # Card de modulo (usado na Home)
│   │   ├── SubModuleCard.jsx   # Card de sub-modulo
│   │   ├── StatsCard.jsx       # Card de indicadores
│   │   └── BrandGraphics.jsx   # SVGs dos grafismos da marca
│   ├── pages/
│   │   ├── Home.jsx            # Dashboard principal
│   │   ├── ModulePage.jsx      # Pagina de modulo (lista sub-modulos)
│   │   └── SubModulePage.jsx   # Pagina placeholder de sub-modulo
│   ├── hooks/
│   │   └── useSidebar.jsx      # Contexto da sidebar (colapso)
│   ├── modules/        # [FUTURO] Modulos independentes
│   ├── utils/          # [FUTURO] Funcoes utilitarias
│   └── assets/         # [FUTURO] Imagens, logos, fontes
```

## Modulos e Sub-modulos
Cada modulo possui 3 sub-modulos. A config central esta em `src/config/modules.js`.
Para renomear ou alterar sub-modulos, edite APENAS este arquivo.

1. **Administrativo** - Sub-modulo 1, Sub-modulo 2, Sub-modulo 3
2. **Financeiro** - Sub-modulo 1, Sub-modulo 2, Sub-modulo 3
3. **Juridico** - Sub-modulo 1, Sub-modulo 2, Sub-modulo 3
4. **Controladoria** - Sub-modulo 1, Sub-modulo 2, Sub-modulo 3
5. **Marketing** - OpenSquad, Sub-modulo 2, Sub-modulo 3

## Navegacao / Rotas
- `/` - Home (dashboard)
- `/:moduleKey` - Pagina do modulo (ex: /financeiro)
- `/:moduleKey/:subKey` - Sub-modulo (ex: /marketing/opensquad)

## Como rodar
```bash
cd gestao-360
npm install
npm run dev
```
Acesse http://localhost:3000

## Arquitetura modular
Cada modulo futuro deve ser desenvolvido dentro de `src/modules/{nome}/` com:
- `index.jsx` - Componente principal do modulo
- `routes.jsx` - Rotas internas do modulo
- `components/` - Componentes especificos do modulo
- `hooks/` - Hooks especificos
- `services/` - Chamadas API

Os modulos se plugam via lazy loading no App.jsx.
Cores customizadas estao no tailwind.config.js usando tokens `primary-*` e `accent-*`.
