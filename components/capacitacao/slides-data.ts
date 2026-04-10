import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Book,
  Goal,
  ImagePlus,
  Images,
  LayoutDashboard,
  Package,
  Presentation,
  Settings,
  ShoppingBag,
  Users,
} from 'lucide-react';

export type SlideAction = {
  href: string;
  label: string;
};

export type SlideItem = {
  id: string;
  title: string;
  subtitle?: string;
  /** Texto corrido extra abaixo do subtítulo */
  paragraph?: string;
  bullets: string[];
  adminOnly?: boolean;
  icon: LucideIcon;
  /** Um ou mais botões “ir para a tela” */
  actions?: SlideAction[];
  /** Aviso abaixo dos botões (ex.: precisa login) */
  actionHint?: string;
};

export const CAPACITACAO_SLIDES: SlideItem[] = [
  {
    id: 'titulo',
    title: 'Capacitação',
    subtitle: 'Plataforma Jornada do Produtor',
    paragraph:
      'Ferramenta digital para organizar produtos, vender no balcão (PDV) e na internet (catálogo), além de acompanhar resultados com relatórios e DRE simplificada. Programa Inovação Imperatriz — protagonismo feminino na produção e na ciência.',
    bullets: [
      'Uma única plataforma para a produtora e para a equipe do programa.',
      'Nesta apresentação você vê cada módulo; use o botão para abrir a tela real no sistema.',
    ],
    icon: Presentation,
    actions: [{ href: '/', label: 'Abrir página inicial' }],
    actionHint: 'Página pública de boas-vindas. Para o painel, faça login em “Gestão”.',
  },
  {
    id: 'objetivos',
    title: 'Objetivos desta capacitação',
    subtitle: 'O que você saberá usar ao final',
    paragraph:
      'O foco é autonomia no dia a dia: cadastrar bem os produtos (com custo), operar vendas presenciais e online, e ler os números sem depender só de planilhas externas.',
    bullets: [
      'Entender o fluxo visitante × produtora logada e a diferença entre perfil admin e usuário geral.',
      'Localizar cada função no painel e saber quando usar PDV, catálogo ou relatórios.',
      'Reconhecer por que o CMV (custo no cadastro do produto) é essencial para lucro e DRE corretos.',
    ],
    icon: Goal,
    actions: [{ href: '/login', label: 'Ir para tela de login' }],
    actionHint: 'Use seu e-mail e senha cadastrados. Depois você cai no painel de gestão.',
  },
  {
    id: 'publicos',
    title: 'Dois públicos na mesma plataforma',
    subtitle: 'Visitante e equipe não usam o sistema do mesmo jeito',
    paragraph:
      'Quem chega pelo site pode responder o questionário sem senha. Quem vende ou gerencia entra com login e vê o painel com abas (Produtos, PDV, Catálogo, etc.).',
    bullets: [
      'Visitante: interesse no programa → responde perguntas → dados ficam disponíveis para o admin em “Respostas”.',
      'Produtora/equipe: login → painel completo conforme o papel (admin vê mais abas).',
      'O administrador do programa ainda pode filtrar o painel por produtora para acompanhar cada uma.',
    ],
    icon: Users,
    actions: [
      { href: '/questionario', label: 'Abrir questionário (visitante)' },
      { href: '/login', label: 'Abrir login (gestão)' },
    ],
    actionHint: 'O questionário é público. O painel exige usuário e senha.',
  },
  {
    id: 'painel',
    title: 'Painel de Gestão',
    subtitle: 'O centro de comando após o login',
    paragraph:
      'No topo há busca, atualizar dados e sair; o admin pode escolher uma produtora no filtro para ver só os dados dela. As abas mudam o conteúdo sem sair da página; o endereço pode incluir ?tab= para você marcar favoritos ou colar link em treinamento.',
    bullets: [
      'Atalho Ctrl+K abre a barra de comandos rápidos (quando disponível).',
      'Cada aba corresponde a um módulo: catálogo, PDV, produtos, post, galeria, relatórios, etc.',
      'Voltar no canto superior retorna à página inicial da plataforma (landing).',
    ],
    icon: LayoutDashboard,
    actions: [{ href: '/?tab=catalogo', label: 'Abrir painel na aba Catálogo' }],
    actionHint: 'É necessário estar logado. Se não estiver, você verá a landing — use Login antes.',
  },
  {
    id: 'respostas',
    title: 'Módulo: Respostas',
    subtitle: 'Questionário público — visão do administrador',
    paragraph:
      'Aqui se centralizam as respostas enviadas por quem clicou em “Participar” ou equivalente na landing. Serve para acompanhar adesão, perfil das participantes e evolução do programa.',
    bullets: [
      'Busca e filtros ajudam a achar respostas específicas ou por questionário.',
      'Abrir um registro mostra o detalhe do preenchimento (conforme a tela).',
      'Somente perfil administrador enxerga esta aba; usuário geral do painel não.',
    ],
    adminOnly: true,
    icon: LayoutDashboard,
    actions: [{ href: '/?tab=responses', label: 'Abrir aba Respostas' }],
    actionHint: 'Apenas admin. Requer login.',
  },
  {
    id: 'catalogo',
    title: 'Módulo: Catálogo',
    subtitle: 'Sua loja na internet',
    paragraph:
      'Este módulo configura o canal digital: o que aparece para o cliente comprar online. Ele depende dos produtos cadastrados em “Produtos” e da opção de exibir no catálogo. Nos relatórios, a “receita catálogo” considera pedidos pagos ou entregues.',
    bullets: [
      'Cliente final acessa o catálogo público (link próprio do programa/produtora).',
      'Preço, foto e disponibilidade vêm do cadastro de produtos.',
      'Pedidos concluídos alimentam relatórios e DRE no canal “catálogo”.',
    ],
    icon: Book,
    actions: [{ href: '/?tab=catalogo', label: 'Abrir aba Catálogo' }],
    actionHint: 'Requer login no painel.',
  },
  {
    id: 'pdv',
    title: 'Módulo: PDV',
    subtitle: 'Venda presencial na hora',
    paragraph:
      'Use na feira, banca ou loja: monte o carrinho com os produtos já cadastrados, finalize a venda e, se a integração estiver ativa, receba com Mercado Pago ou PIX. Tudo que passa aqui entra como receita PDV nos relatórios.',
    bullets: [
      'Reduz erro de cálculo: o sistema soma itens e totais automaticamente.',
      'Pode haver tela de pagamento em destaque para o cliente pagar com QR ou link.',
      'Após configurar uma vez, o fluxo do dia a dia é rápido para repetir vendas.',
    ],
    icon: ShoppingBag,
    actions: [{ href: '/?tab=pdv', label: 'Abrir aba PDV' }],
    actionHint: 'Requer login no painel.',
  },
  {
    id: 'produtos',
    title: 'Módulo: Produtos',
    subtitle: 'Cadastro do mix e custos',
    paragraph:
      'É a base de tudo: sem produto cadastrado, não há PDV nem catálogo coerente. Além de nome e preço de venda, informe o CMV (custo da mercadoria) sempre que possível — assim lucro bruto e DRE refletem a realidade. A importação de nota (XML) acelera quando você tem NF-e.',
    bullets: [
      'Incluir, editar e arquivar itens; marcar se aparecem no catálogo online.',
      'CMV por produto: usado para calcular custo das vendas (PDV + catálogo) nos relatórios.',
      'Importar nota: traz dados da NF para conferência e cadastro mais rápido.',
    ],
    icon: Package,
    actions: [{ href: '/?tab=produtos', label: 'Abrir aba Produtos' }],
    actionHint: 'Requer login no painel.',
  },
  {
    id: 'post',
    title: 'Módulo: Post',
    subtitle: 'Apoio para redes sociais',
    paragraph:
      'Gera sugestões de texto/imagem com base nos produtos que você já cadastrou. Ajuda a manter Instagram ou WhatsApp alinhados ao que realmente está à venda — quanto mais atualizado o cadastro, melhor o resultado.',
    bullets: [
      'Ideal para oficinas de comunicação ou rotina semanal de divulgação.',
      'Não substitui criatividade: use como ponto de partida e adapte ao tom da marca.',
      'Funciona em conjunto com a Galeria para combinar texto + imagens.',
    ],
    icon: ImagePlus,
    actions: [{ href: '/?tab=post', label: 'Abrir aba Post' }],
    actionHint: 'Requer login no painel.',
  },
  {
    id: 'galeria',
    title: 'Módulo: Galeria',
    subtitle: 'Banco de imagens',
    paragraph:
      'Organize fotos de produtos, feiras e eventos em um só lugar. Facilita reutilizar material em posts, catálogo e materiais impressos, sem ficar caçando arquivo no celular.',
    bullets: [
      'Upload e listagem conforme as regras da tela (tamanho/formato).',
      'Complementa o módulo Post para campanhas visuais consistentes.',
      'Manter imagens nomeadas e atualizadas melhora a apresentação no catálogo.',
    ],
    icon: Images,
    actions: [{ href: '/?tab=galeria', label: 'Abrir aba Galeria' }],
    actionHint: 'Requer login no painel.',
  },
  {
    id: 'relatorios',
    title: 'Módulo: Relatórios',
    subtitle: 'Números, gráficos e DRE simplificada',
    paragraph:
      'Escolha o período (De/Até ou atalhos de 7/30 dias). Você pode alternar entre visão só do catálogo online, DRE detalhada com todas as linhas explicadas, vendas por semana, por dia da semana, ranking de produtos e visão mensal. Admin pode filtrar por produtora.',
    bullets: [
      'Catálogo online: métricas apenas do digital (pedidos pagos, CMV do canal, etc.).',
      'DRE detalhada: receita PDV + catálogo, CMV, lucro bruto, despesas (quando houver), resultado.',
      'Use “Relatório por mês” para reuniões rápidas de fechamento.',
    ],
    icon: BarChart3,
    actions: [{ href: '/?tab=relatorios', label: 'Abrir aba Relatórios' }],
    actionHint: 'Requer login no painel.',
  },
  {
    id: 'usuarios',
    title: 'Módulo: Usuários',
    subtitle: 'Quem acessa o painel',
    paragraph:
      'Gestão de contas: criar usuários, definir se são administradores ou perfil geral e manter o acesso seguro. Importante em programas com muitas produtoras: cada login deve ser pessoal e com senha forte.',
    bullets: [
      'Admin cuida de permissões; usuário geral não vê esta aba.',
      'Revogue ou altere senha quando alguém sair do projeto.',
      'Combine com a política de privacidade dos dados do questionário e das vendas.',
    ],
    adminOnly: true,
    icon: Users,
    actions: [{ href: '/?tab=usuarios', label: 'Abrir aba Usuários' }],
    actionHint: 'Apenas admin. Requer login.',
  },
  {
    id: 'configuracao',
    title: 'Módulo: Configuração',
    subtitle: 'Pagamentos e integrações do PDV',
    paragraph:
      'Conecte Mercado Pago e opções de PIX para que o PDV possa gerar cobrança e conferir status. Credenciais são sensíveis: só pessoas autorizadas devem colar tokens ou alterar ambiente (teste x produção).',
    bullets: [
      'Sem configuração, o PDV ainda pode registrar vendas “manualmente” conforme fluxo da tela.',
      'Após conectar, teste com valor pequeno antes de usar em evento com público.',
      'Em dúvida, peça apoio técnico antes de expor chaves em grupo aberto.',
    ],
    icon: Settings,
    actions: [{ href: '/?tab=configuracao', label: 'Abrir aba Configuração' }],
    actionHint: 'Requer login no painel.',
  },
  {
    id: 'encerramento',
    title: 'Encerramento',
    subtitle: 'Leve estas ideias para o dia a dia',
    paragraph:
      'A plataforma funciona melhor quando produto, preço e custo estão completos. Separe mentalmente os três canais: balcão (PDV), internet (catálogo) e leitura gerencial (relatórios). Em caso de dúvida, retome esta apresentação em /capacitacao.',
    bullets: [
      'Produto com preço e CMV → relatórios e DRE confiáveis.',
      'PDV = dinheiro na hora no balcão; Catálogo = cliente pedindo online.',
      'Próximo passo: praticar cada aba com dados reais e anotar dúvidas para o suporte.',
    ],
    icon: Presentation,
    actions: [
      { href: '/', label: 'Voltar à página inicial' },
      { href: '/capacitacao', label: 'Rever esta apresentação' },
    ],
    actionHint: 'Obrigada por participar da capacitação.',
  },
];
