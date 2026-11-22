import { CERTIFICATE_PROJECT_TITLE } from '@/lib/certificate-project';
import type { SapiensStats } from '@/lib/sapiens-stats';

/**
 * Conteúdo do banner IX SAPIENS (UEMASUL) — duas versões de layout.
 * Fonte única: usada pela aba "Sapiens" do painel, pelas páginas públicas /sapiens e
 * /sapiens/banner e pelo gerador do .pptx (scripts/sapiens/gerar_banner.py, via /api/sapiens).
 *
 * Para ajustar textos do banner, edite somente este arquivo.
 * Os tamanhos de fonte são os ORIGINAIS do template — não alterar.
 */

export const SAPIENS_REPORT_PATH = '/sapiens';
export const SAPIENS_BANNER_PATH = '/sapiens/banner';

export const BANNER_DOWNLOADS = {
  v1: '/sapiens/Banner_IX_Sapiens_TecnoProdutivo_Versao1.pptx',
  v2: '/sapiens/Banner_IX_Sapiens_TecnoProdutivo_Versao2.pptx',
} as const;

export type BannerVersion = keyof typeof BANNER_DOWNLOADS;

/** URL pública que vai no QR Code (precisa ser o domínio de produção para o banner impresso). */
export function sapiensPublicUrl(): string {
  const appUrl = process.env.APP_URL?.trim();
  const appIsLocal = !appUrl || /localhost|127\.0\.0\.1/.test(appUrl);
  const base = (
    process.env.SAPIENS_PUBLIC_URL?.trim() ||
    (appIsLocal ? '' : appUrl) ||
    'https://protagonismo.chatboot.cloud'
  ).replace(/\/+$/, '');
  return `${base}${SAPIENS_REPORT_PATH}`;
}

export const SAPIENS_TITLE = CERTIFICATE_PROJECT_TITLE;

export type SapiensAuthor = { name: string; email: string; role: 'voluntaria' | 'orientadora' };

/** Autoras do banner: voluntárias do projeto e a orientadora. */
export const SAPIENS_AUTHORS: SapiensAuthor[] = [
  { name: 'Mávia Guerra Grandi', email: 'mavia.grandi@uemasul.edu.br', role: 'voluntaria' },
  { name: 'Brenda Sousa Oliveira', email: 'brenda.s.oliveira@uemasul.edu.br', role: 'voluntaria' },
  { name: 'Roxanne Kelly Lima de Sousa', email: 'roxanne.sousa@uemasul.edu.br', role: 'voluntaria' },
  { name: 'Mateus Oliveira da Conceição', email: 'mateus.conceicao@uemasul.edu.br', role: 'voluntaria' },
  { name: 'Iracema Rocha da Silva', email: 'iracemarocha@uemasul.edu.br', role: 'orientadora' },
];

/** Linha do autor no banner: "Nome (e-mail)"; a orientadora vem identificada. */
export function authorLine(a: SapiensAuthor): string {
  return a.role === 'orientadora' ? `Orientadora: ${a.name} (${a.email})` : `${a.name} (${a.email})`;
}

/**
 * Fontes: seções no tamanho ORIGINAL do template (cabeçalhos 60 pt negrito, corpo 54 pt justificado).
 * Título e autoras levemente menores (44/40 pt negrito) para caberem por completo.
 * Gráficos têm tamanho próprio (títulos e rótulos internos dos cartões).
 */
const FONTS = {
  titlePt: 44,
  authorsPt: 40,
  headerPt: 60,
  bodyPt: 54,
  chartPt: 32,
  chartTitlePt: 40,
  chartValuePt: 40,
} as const;

/**
 * Layout em FLUXO (cm, folha 90 × 120 cm): cada bloco começa logo após o anterior, com o mesmo
 * espaçamento (`gap`). As alturas dos textos são medidas (fonte Calibri/Carlito) — no navegador pelo
 * próprio fluxo do HTML e no .pptx pelo gerador Python — então não sobram vãos entre as seções.
 */
const BASE = {
  page: { w: 90, h: 120 },
  /** Arte de fundo do template (deslocada 3,87 cm para baixo, como no original). */
  background: { x: 0, y: 3.87, w: 90, h: 120 },
  logo: { x: 28.42, y: 10.51, w: 33.16, h: 7.11 },
  fonts: FONTS,
  /** Bloco título + autoras, logo abaixo do logo. */
  title: { x: 6, y: 18.2, w: 78 },
  /** Área das seções: duas colunas de 35,6 cm (como no template). Abaixo de `bottom` ficam os logos. */
  content: { x: 7.4, w: 75.2, colW: 35.6, colGap: 4.0, bottom: 111.5 },
  /** Os gráficos crescem até o conteúdo chegar aqui (sem deixar faixa branca no fim). */
  fillTo: 109.0,
  headerH: 2.81,
  /** Espaço entre o cabeçalho da seção e o texto. */
  headerGap: 0.4,
  /** Espaço uniforme entre blocos. */
  gap: 1.0,
  /** Margens internas das caixas de texto (padrão do PowerPoint). */
  inset: { x: 0.25, y: 0.13 },
  /** Altura de linha (espaçamento simples da Calibri). */
  lineHeight: 1.22,
} as const;

/**
 * Versão 1 — duas colunas (como o template original).
 * Esquerda: Introdução, Materiais e Métodos, Conclusões, QR. Direita: Resultados + gráfico, Referências.
 */
export const BANNER_LAYOUT = {
  ...BASE,
  /** Altura mínima do gráfico; ele cresce para a coluna direita chegar a `fillTo`. */
  chartMinH: 18.0,
  qrSize: 12.6,
} as const;

/**
 * Versão 2 — Resultados e Discussões em faixa horizontal de largura total.
 * Topo: Introdução | Materiais e Métodos. Meio: cartões com 2 gráficos + QR e legenda.
 * Base: Conclusões | Referências.
 */
export const BANNER_LAYOUT_V2 = {
  ...BASE,
  /** `minH`: altura mínima dos cartões; eles crescem para o conteúdo chegar a `fillTo`. */
  cards: { minH: 18.6, titleH: 4.6, qrW: 14.4, gap: 1.0 },
} as const;

export type BannerLayoutV1 = typeof BANNER_LAYOUT;
export type BannerLayoutV2 = typeof BANNER_LAYOUT_V2;

export type BannerSection = { id: string; title: string; paragraphs: string[] };
export type ChartDatum = { label: string; value: number };

export type BannerContent = {
  title: string;
  authors: (SapiensAuthor & { line: string })[];
  introducao: BannerSection;
  metodos: BannerSection;
  resultados: BannerSection;
  conclusoes: BannerSection;
  referencias: BannerSection;
  /** Gráfico da versão 1 (e da página do relatório). */
  chart: { title: string; caption: string; data: ChartDatum[] };
  /** Versão 2: gráfico de colunas (%) e de barras (registros) + legenda com fonte. */
  v2: {
    chartPct: { title: string; data: ChartDatum[]; suffix: string };
    chartVolume: { title: string; data: ChartDatum[] };
    qrTitle: string;
    qrHint: string;
    caption: { source: string; text: string };
  };
  qr: { url: string; caption: string };
  layout: BannerLayoutV1;
  layoutV2: BannerLayoutV2;
  downloads: typeof BANNER_DOWNLOADS;
};

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

const pct = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

export function buildBannerContent(stats: SapiensStats): BannerContent {
  const p = stats.participantes;
  const MESES_ABNT = ['jan.', 'fev.', 'mar.', 'abr.', 'maio', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
  const now = new Date();
  const accessDate = `${now.getDate()} ${MESES_ABNT[now.getMonth()]} ${now.getFullYear()}`;
  const site = sapiensPublicUrl().replace(/\/sapiens$/, '');

  const pProdutos = pct(stats.participantesComProdutos, p);
  const pPdv = pct(stats.participantesQueVenderam, p);
  const pCatalogo = pct(stats.participantesComPedidosOnline, p);
  const pPosts = pct(stats.participantesComPosts, p);

  return {
    title: SAPIENS_TITLE,
    authors: SAPIENS_AUTHORS.map((a) => ({ ...a, line: authorLine(a) })),
    introducao: {
      id: 'introducao',
      title: 'INTRODUÇÃO',
      paragraphs: [
        `Mulheres da agricultura familiar, do artesanato e de pequenos negócios de Imperatriz-MA enfrentam baixa digitalização. O projeto TecnoProdutivo (UEMASUL) une formação e tecnologia para fortalecer o protagonismo feminino. Propor melhorias em processos produtivos com base em tecnologia e inovação acessível. Foram capacitadas ${p} mulheres empreendedoras de Imperatriz.`,
      ],
    },
    metodos: {
      id: 'metodos',
      title: 'MATERIAIS E MÉTODOS',
      paragraphs: [
        'Pesquisa-ação em cinco etapas (diagnóstico, oficinas, laboratórios, implantação e mostra), com trilha de 80 h e a plataforma web Jornada do Produtor: produtos e custos, PDV com PIX, catálogo on-line, posts com IA e relatórios.',
      ],
    },
    resultados: {
      id: 'resultados',
      title: 'RESULTADOS E DISCUSSÕES',
      paragraphs: [
        `${p} mulheres foram cadastradas; ${stats.participantesComProdutos} registraram ${stats.produtos} produtos e ${stats.participantesQueVenderam} lançaram ${stats.vendasPdv} vendas no PDV (${brl(stats.receitaPdv)}). A IA gerou ${stats.imagensIa} artes de divulgação, mas só ${stats.participantesComPosts} participantes usaram essa função.`,
      ],
    },
    conclusoes: {
      id: 'conclusoes',
      title: 'CONCLUSÕES',
      paragraphs: [
        'A união entre formação e tecnologia mostrou-se viável: as participantes ganharam autonomia para precificar, vender no balcão e pela internet e acompanhar os próprios números. Recomenda-se manter o acompanhamento após as oficinas.',
      ],
    },
    referencias: {
      id: 'referencias',
      title: 'REFERÊNCIAS',
      paragraphs: [
        'THIOLLENT, M. Metodologia da pesquisa-ação. 18. ed. São Paulo: Cortez, 2011.',
        `UEMASUL. Plataforma Jornada do Produtor. Imperatriz, 2026. Disponível em: ${site}. Acesso em: ${accessDate}`,
      ],
    },
    chart: {
      title: 'Adoção da plataforma pelas participantes',
      caption: `Gráfico 1 – Participantes por funcionalidade utilizada (n = ${p}).`,
      data: [
        { label: 'Cadastradas', value: p },
        { label: 'Cadastraram produtos', value: stats.participantesComProdutos },
        { label: 'Venderam no PDV', value: stats.participantesQueVenderam },
        { label: 'Geraram posts com IA', value: stats.participantesComPosts },
      ],
    },
    v2: {
      chartPct: {
        title: '% das participantes que usaram cada função',
        suffix: '%',
        data: [
          { label: 'Produtos', value: pProdutos },
          { label: 'PDV', value: pPdv },
          { label: 'Catálogo', value: pCatalogo },
          { label: 'Posts IA', value: pPosts },
        ],
      },
      chartVolume: {
        title: 'Registros gerados na plataforma',
        data: [
          { label: 'Produtos', value: stats.produtos },
          { label: 'Vendas PDV', value: stats.vendasPdv },
          { label: 'Artes com IA', value: stats.imagensIa },
          { label: 'Diagnósticos', value: stats.diagnosticos },
          { label: 'Pedidos on-line', value: stats.pedidosOnlinePagos },
        ],
      },
      qrTitle: 'Relatório completo',
      qrHint: 'Escaneie',
      caption: {
        source: `Fonte: plataforma Jornada do Produtor (n = ${p}).`,
        text: `A adesão ao cadastro (${pProdutos}%) e ao PDV (${pPdv}%) foi alta, com ${stats.vendasPdv} vendas (${brl(stats.receitaPdv)}), mas só ${pPosts}% usaram os posts com IA, o que pede reforço em comunicação digital.`,
      },
    },
    qr: {
      url: sapiensPublicUrl(),
      caption: 'Escaneie e veja o relatório completo do projeto',
    },
    layout: BANNER_LAYOUT,
    layoutV2: BANNER_LAYOUT_V2,
    downloads: BANNER_DOWNLOADS,
  };
}
