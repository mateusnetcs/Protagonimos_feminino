import type { LucideIcon } from 'lucide-react';
import {
  CERTIFICATE_OFFERED_BY,
  CERTIFICATE_PROJECT_TITLE,
} from '@/lib/certificate-project';
import {
  BarChart3,
  HeartHandshake,
  ImagePlus,
  Leaf,
  LineChart,
  Package,
  Presentation,
  ShoppingBag,
  Sparkles,
  Users,
} from 'lucide-react';

export type ModuloProgramatico = {
  id: string;
  ordem: number;
  titulo: string;
  subtitulo: string;
  cargaHoraria: string;
  descricao: string;
  topicos: string[];
  icon: LucideIcon;
  categoria: 'formacao' | 'plataforma';
};

export const CONTEUDO_PROGRAMATICO_INTRO = {
  titulo: 'Conteúdo Programático',
  programa: CERTIFICATE_PROJECT_TITLE,
  oferta: CERTIFICATE_OFFERED_BY,
  descricao:
    'Trilha formativa que integra empreendedorismo feminino, gestão, sustentabilidade e uso da plataforma digital para fortalecer produtoras e empreendedoras de Imperatriz — MA.',
  cargaHorariaTotal: '80 horas',
};

export const MODULOS_PROGRAMATICOS: ModuloProgramatico[] = [
  {
    id: 'intro-protagonismo',
    ordem: 1,
    titulo: 'Introdução ao Protagonismo Feminino',
    subtitulo: 'Fundamentos e contexto do programa',
    cargaHoraria: '8h',
    descricao:
      'Apresenta o projeto TecnoProdutivo, o papel da mulher na economia local e os objetivos da formação em protagonismo feminino.',
    topicos: [
      'Protagonismo feminino na produção e na ciência',
      'Economia local e agricultura familiar em Imperatriz',
      'Papel da Uemasul e do Curso de Administração',
      'Metodologia: diagnóstico, oficinas e acompanhamento',
    ],
    icon: Sparkles,
    categoria: 'formacao',
  },
  {
    id: 'diagnostico-planejamento',
    ordem: 2,
    titulo: 'Diagnóstico e Planejamento do Negócio',
    subtitulo: 'Entendendo o ponto de partida',
    cargaHoraria: '10h',
    descricao:
      'Ferramentas para mapear o negócio, identificar gargalos e definir prioridades de crescimento com foco prático.',
    topicos: [
      'Mapeamento do negócio e perfil da produtora',
      'Identificação de gargalos e oportunidades',
      'Planejamento de curto e médio prazo',
      'Questionário e escuta ativa no programa',
    ],
    icon: LineChart,
    categoria: 'formacao',
  },
  {
    id: 'gestao-financeira',
    ordem: 3,
    titulo: 'Gestão Financeira e Precificação',
    subtitulo: 'Números que sustentam decisões',
    cargaHoraria: '12h',
    descricao:
      'Conceitos de custo, preço, margem e fluxo de caixa aplicados ao dia a dia da produção e da venda.',
    topicos: [
      'CMV, custos fixos e variáveis',
      'Formação de preço de venda',
      'Fluxo de caixa simplificado',
      'Leitura de resultados para tomada de decisão',
    ],
    icon: BarChart3,
    categoria: 'formacao',
  },
  {
    id: 'empreendedorismo',
    ordem: 4,
    titulo: 'Empreendedorismo e Modelo de Negócio',
    subtitulo: 'Estratégia e posicionamento',
    cargaHoraria: '10h',
    descricao:
      'Desenvolvimento de proposta de valor, canais de venda e diferenciação para mulheres empreendedoras.',
    topicos: [
      'Proposta de valor e público-alvo',
      'Canais de venda: feira, loja e digital',
      'Marca pessoal e narrativa da produtora',
      'Networking e parcerias locais',
    ],
    icon: HeartHandshake,
    categoria: 'formacao',
  },
  {
    id: 'comunicacao-marketing',
    ordem: 5,
    titulo: 'Comunicação e Marketing Digital',
    subtitulo: 'Divulgação com identidade',
    cargaHoraria: '8h',
    descricao:
      'Boas práticas de comunicação em redes sociais, WhatsApp e materiais visuais alinhados ao que está à venda.',
    topicos: [
      'Linguagem e tom de voz da marca',
      'Instagram, WhatsApp e catálogo online',
      'Fotos de produto e consistência visual',
      'Uso do módulo Post e da Galeria na plataforma',
    ],
    icon: ImagePlus,
    categoria: 'formacao',
  },
  {
    id: 'sustentabilidade',
    ordem: 6,
    titulo: 'Sustentabilidade e Produção Responsável',
    subtitulo: 'Menos desperdício, mais valor',
    cargaHoraria: '6h',
    descricao:
      'Práticas de produção limpa, economia circular e redução de desperdícios na cadeia produtiva.',
    topicos: [
      'Desperdício e eficiência na produção',
      'Embalagens e logística consciente',
      'Sustentabilidade como diferencial de mercado',
      'Boas práticas para agricultura familiar',
    ],
    icon: Leaf,
    categoria: 'formacao',
  },
  {
    id: 'plataforma-visao',
    ordem: 7,
    titulo: 'Plataforma Jornada do Produtor',
    subtitulo: 'Visão geral do sistema',
    cargaHoraria: '4h',
    descricao:
      'Introdução ao painel de gestão: login, abas, fluxo de trabalho e integração entre módulos digitais.',
    topicos: [
      'Acesso ao painel e perfis de usuário',
      'Navegação entre abas e atalhos',
      'Fluxo: cadastrar → vender → acompanhar',
      'Capacitação interativa em /capacitacao',
    ],
    icon: Presentation,
    categoria: 'plataforma',
  },
  {
    id: 'modulo-produtos',
    ordem: 8,
    titulo: 'Módulo: Produtos',
    subtitulo: 'Cadastro, custos e mix',
    cargaHoraria: '6h',
    descricao:
      'Base do sistema: cadastro de itens com preço, foto, estoque e CMV para relatórios confiáveis.',
    topicos: [
      'Cadastro completo de produtos',
      'CMV e impacto na DRE',
      'Importação de nota fiscal (XML)',
      'Exibir produto no catálogo online',
    ],
    icon: Package,
    categoria: 'plataforma',
  },
  {
    id: 'modulo-catalogo-pdv',
    ordem: 9,
    titulo: 'Módulos: Catálogo e PDV',
    subtitulo: 'Venda online e presencial',
    cargaHoraria: '8h',
    descricao:
      'Operação dos canais digitais e do ponto de venda na feira ou loja, com PIX e acompanhamento de pedidos.',
    topicos: [
      'Catálogo público e link da loja',
      'Kanban de vendas do catálogo',
      'PDV: carrinho e finalização rápida',
      'Pagamentos e configurações de PIX',
    ],
    icon: ShoppingBag,
    categoria: 'plataforma',
  },
  {
    id: 'modulo-relatorios',
    ordem: 10,
    titulo: 'Módulo: Relatórios',
    subtitulo: 'Gestão de resultados',
    cargaHoraria: '8h',
    descricao:
      'Leitura de gráficos, vendas por período e DRE simplificada para fechamento e reuniões de acompanhamento.',
    topicos: [
      'Filtros por período e por canal',
      'Receita PDV x catálogo',
      'DRE detalhada e lucro bruto',
      'Ranking de produtos e visão mensal',
    ],
    icon: BarChart3,
    categoria: 'plataforma',
  },
  {
    id: 'encerramento-certificacao',
    ordem: 11,
    titulo: 'Encerramento e Certificação',
    subtitulo: 'Consolidação da jornada',
    cargaHoraria: '4h',
    descricao:
      'Revisão da trilha, entrega de certificado de participação e orientações para continuidade do negócio.',
    topicos: [
      'Síntese dos aprendizados',
      'Plano de ação pós-formação',
      'Certificado de participação (Protagonismo Feminino)',
      'Verificação de autenticidade via QR Code',
    ],
    icon: Users,
    categoria: 'formacao',
  },
];

export function getModulosPorCategoria(categoria: ModuloProgramatico['categoria']) {
  return MODULOS_PROGRAMATICOS.filter((m) => m.categoria === categoria);
}
