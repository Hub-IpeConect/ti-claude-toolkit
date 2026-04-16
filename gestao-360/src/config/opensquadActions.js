/**
 * Catalogo de acoes pre-configuradas do OpenSquad.
 * Cada acao tem um formulario proprio e monta um prompt para o Claude.
 *
 * Campos de cada acao:
 *   key         - identificador unico
 *   title       - nome visivel no card
 *   description - descricao curta
 *   icon        - nome do icone lucide-react
 *   category    - categoria (usado para agrupar)
 *   color       - cor tailwind (ex: 'rose', 'amber', 'blue')
 *   fields      - array de campos do formulario
 *   buildPrompt - funcao que recebe os valores do form e retorna o prompt completo
 */

export const OPENSQUAD_ACTIONS = [
  // ============ REDES SOCIAIS ============
  {
    key: 'instagram-post',
    title: 'Post para Instagram',
    description: 'Gera legenda + sugestao de imagem para um post.',
    icon: 'Instagram',
    category: 'Redes Sociais',
    color: 'rose',
    fields: [
      { key: 'topic', label: 'Sobre o que e o post?', type: 'textarea', required: true, placeholder: 'Ex: Lancamento do novo servico de consultoria fiscal' },
      { key: 'objective', label: 'Objetivo', type: 'select', options: ['Engajamento', 'Venda', 'Educacao', 'Autoridade', 'Promocao'], default: 'Engajamento' },
      { key: 'tone', label: 'Tom de voz', type: 'select', options: ['Profissional', 'Amigavel', 'Divertido', 'Inspirador', 'Tecnico'], default: 'Profissional' },
      { key: 'cta', label: 'Chamada para acao (opcional)', type: 'text', placeholder: 'Ex: Agende sua reuniao' },
    ],
    buildPrompt: (v) => `Use a skill opensquad para criar um post de Instagram.

Topico: ${v.topic}
Objetivo: ${v.objective}
Tom de voz: ${v.tone}
${v.cta ? `CTA: ${v.cta}` : ''}

Entregue:
1. Legenda completa (com emojis e hashtags)
2. Sugestao de imagem/visual
3. 3 variacoes do primeiro paragrafo para teste A/B

Seja direto e pratico. Use o contexto da empresa que ja esta configurado no projeto.`,
  },
  {
    key: 'linkedin-post',
    title: 'Post para LinkedIn',
    description: 'Post corporativo para construir autoridade.',
    icon: 'Linkedin',
    category: 'Redes Sociais',
    color: 'blue',
    fields: [
      { key: 'topic', label: 'Sobre o que e o post?', type: 'textarea', required: true },
      { key: 'format', label: 'Formato', type: 'select', options: ['Texto corrido', 'Lista/topicos', 'Case de sucesso', 'Reflexao pessoal', 'Dica pratica'], default: 'Texto corrido' },
      { key: 'tone', label: 'Tom', type: 'select', options: ['Profissional', 'Conversacional', 'Inspirador', 'Analitico'], default: 'Profissional' },
    ],
    buildPrompt: (v) => `Use a skill opensquad para criar um post de LinkedIn.

Topico: ${v.topic}
Formato: ${v.format}
Tom: ${v.tone}

Entregue o post completo pronto para publicar, com gancho forte no primeiro paragrafo, corpo com valor e CTA final. Use o contexto da empresa ja configurado.`,
  },

  // ============ EMAIL ============
  {
    key: 'email-marketing',
    title: 'E-mail Marketing',
    description: 'Campanha de e-mail com assunto, preheader e corpo.',
    icon: 'Mail',
    category: 'E-mail',
    color: 'amber',
    fields: [
      { key: 'objective', label: 'Objetivo da campanha', type: 'textarea', required: true, placeholder: 'Ex: Divulgar novo servico para clientes existentes' },
      { key: 'audience', label: 'Para quem?', type: 'text', placeholder: 'Ex: Clientes PJ com mais de 50 funcionarios' },
      { key: 'tone', label: 'Tom', type: 'select', options: ['Formal', 'Amigavel', 'Urgente', 'Consultivo'], default: 'Amigavel' },
    ],
    buildPrompt: (v) => `Use a skill opensquad para criar uma campanha de e-mail.

Objetivo: ${v.objective}
Publico: ${v.audience || 'usar publico padrao da empresa'}
Tom: ${v.tone}

Entregue:
1. 3 sugestoes de assunto (com taxa estimada de abertura)
2. Preheader (preview)
3. Corpo completo do e-mail em HTML simples
4. Assinatura

Use o contexto da empresa ja configurado.`,
  },

  // ============ BLOG / CONTEUDO LONGO ============
  {
    key: 'blog-pauta',
    title: 'Pauta de Blog',
    description: 'Gera 5 ideias de artigos com estrutura sugerida.',
    icon: 'FileText',
    category: 'Conteudo',
    color: 'emerald',
    fields: [
      { key: 'theme', label: 'Tema/area', type: 'text', required: true, placeholder: 'Ex: Direito tributario, Compliance, Folha' },
      { key: 'quantity', label: 'Quantidade de pautas', type: 'select', options: ['3', '5', '10'], default: '5' },
    ],
    buildPrompt: (v) => `Use a skill opensquad para sugerir ${v.quantity} pautas de blog sobre "${v.theme}".

Para cada pauta entregue:
- Titulo com gancho (2-3 variacoes)
- Angulo editorial (por que esse assunto agora)
- Estrutura sugerida (H2s principais)
- Publico-alvo especifico
- Palavra-chave principal para SEO

Use o contexto da empresa ja configurado.`,
  },
  {
    key: 'blog-artigo',
    title: 'Artigo de Blog',
    description: 'Redige um artigo completo otimizado para SEO.',
    icon: 'BookOpen',
    category: 'Conteudo',
    color: 'emerald',
    fields: [
      { key: 'title', label: 'Titulo do artigo', type: 'text', required: true, placeholder: 'Ex: Como fazer sua primeira declaracao de MEI' },
      { key: 'keyword', label: 'Palavra-chave principal', type: 'text', placeholder: 'Ex: declaracao MEI' },
      { key: 'length', label: 'Tamanho', type: 'select', options: ['Curto (500 palavras)', 'Medio (1000 palavras)', 'Longo (1500+ palavras)'], default: 'Medio (1000 palavras)' },
    ],
    buildPrompt: (v) => `Use a skill opensquad para escrever um artigo de blog.

Titulo: ${v.title}
Palavra-chave: ${v.keyword || 'derivar do titulo'}
Tamanho: ${v.length}

Entregue:
- Meta description (150-160 caracteres)
- Artigo completo em markdown com H2s e H3s
- 3 links internos sugeridos (assuntos, nao URLs)
- CTA ao final

Use o contexto da empresa ja configurado.`,
  },

  // ============ PLANEJAMENTO ============
  {
    key: 'calendario-editorial',
    title: 'Calendario Editorial',
    description: 'Planejamento de conteudo para o mes inteiro.',
    icon: 'Calendar',
    category: 'Planejamento',
    color: 'violet',
    fields: [
      { key: 'month', label: 'Mes/periodo', type: 'text', required: true, placeholder: 'Ex: Maio 2026' },
      { key: 'channels', label: 'Canais', type: 'text', placeholder: 'Ex: Instagram, LinkedIn, Blog' },
      { key: 'focus', label: 'Foco estrategico', type: 'textarea', placeholder: 'Ex: Aumentar leads qualificados para o servico X' },
    ],
    buildPrompt: (v) => `Use a skill opensquad para criar um calendario editorial.

Periodo: ${v.month}
Canais: ${v.channels || 'Instagram, LinkedIn, Blog'}
Foco estrategico: ${v.focus || 'equilibrar autoridade, engajamento e conversao'}

Entregue uma tabela com: Data, Canal, Formato, Titulo/Tema, Objetivo. Pelo menos 3 publicacoes por semana. Use o contexto da empresa ja configurado.`,
  },
  {
    key: 'campanha-completa',
    title: 'Campanha Integrada',
    description: 'Briefing + pecas para campanha multi-canal.',
    icon: 'Megaphone',
    category: 'Planejamento',
    color: 'violet',
    fields: [
      { key: 'objective', label: 'Objetivo da campanha', type: 'textarea', required: true },
      { key: 'duration', label: 'Duracao', type: 'select', options: ['1 semana', '2 semanas', '1 mes', '3 meses'], default: '1 mes' },
      { key: 'budget', label: 'Budget (opcional)', type: 'text', placeholder: 'Ex: R$ 5.000' },
    ],
    buildPrompt: (v) => `Use a skill opensquad para desenhar uma campanha integrada.

Objetivo: ${v.objective}
Duracao: ${v.duration}
${v.budget ? `Budget: ${v.budget}` : ''}

Entregue:
1. Briefing executivo (conceito, KPIs, publico)
2. 3 pecas de Instagram (carrosseis ou reels)
3. 1 e-mail marketing (assunto + corpo)
4. 1 post de LinkedIn
5. Cronograma semanal

Use o contexto da empresa ja configurado.`,
  },
]

export const ACTION_CATEGORIES = [
  { key: 'Redes Sociais', color: 'rose' },
  { key: 'E-mail', color: 'amber' },
  { key: 'Conteudo', color: 'emerald' },
  { key: 'Planejamento', color: 'violet' },
]
