import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BarChart3,
  Book,
  Camera,
  ClipboardList,
  ImagePlus,
  Images,
  Package,
  QrCode,
  ShoppingBag,
  Sparkles,
  Store,
  Users,
} from 'lucide-react';
import { getSapiensPosts, getSapiensStats } from '@/lib/sapiens-stats';
import { buildBannerContent, SAPIENS_AUTHORS } from '@/lib/sapiens-content';
import { CERTIFICATE_OFFERED_BY } from '@/lib/certificate-project';
import { AdoptionChart } from '@/components/sapiens/SapiensCharts';
import SapiensGallery from '@/components/sapiens/SapiensGallery';
import SapiensPhotos from '@/components/sapiens/SapiensPhotos';
import { SAPIENS_PHOTO_GROUPS } from '@/lib/sapiens-photos';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'TecnoProdutivo · Relatório do projeto (IX SAPIENS)',
  description:
    'Protagonismo feminino na produção local de Imperatriz-MA: indicadores, artes geradas por IA e funcionalidades da plataforma Jornada do Produtor.',
};

const FEATURES = [
  {
    icon: Package,
    title: 'Cadastro de produtos',
    text: 'Cada produtora cadastra seus produtos com foto, preço de venda e custo (CMV). É a base para vender e calcular o lucro de verdade.',
  },
  {
    icon: ShoppingBag,
    title: 'PDV – venda no balcão',
    text: 'Na feira ou na banca, monta o carrinho, soma automaticamente e recebe por PIX com QR Code ou em dinheiro. Toda venda fica registrada.',
  },
  {
    icon: Store,
    title: 'Catálogo on-line',
    text: 'Uma vitrine na internet com link próprio. O cliente escolhe os produtos, informa entrega ou retirada e paga sem sair de casa.',
  },
  {
    icon: ImagePlus,
    title: 'Posts com Inteligência Artificial',
    text: 'A partir da foto do produto, a IA cria a arte e a legenda para Instagram e WhatsApp, prontas para divulgar.',
  },
  {
    icon: Images,
    title: 'Galeria',
    text: 'Todas as artes geradas ficam guardadas para reutilizar em campanhas, catálogo e materiais impressos.',
  },
  {
    icon: BarChart3,
    title: 'Relatórios e DRE simplificada',
    text: 'Receita, custo, lucro bruto, produtos mais vendidos e vendas por período — números claros para decidir melhor.',
  },
  {
    icon: ClipboardList,
    title: 'Diagnóstico por questionário',
    text: 'Questionário público que mapeia o perfil e os gargalos de cada empreendedora antes das oficinas.',
  },
  {
    icon: Book,
    title: 'Trilha formativa e certificados',
    text: 'Conteúdo programático de 80 horas e certificados de participação com verificação de autenticidade por QR Code.',
  },
];

const STEPS = [
  { title: 'Diagnóstico', text: 'Mapeamento inicial e escuta ativa das produtoras.' },
  { title: 'Oficinas', text: 'Gestão, finanças, marketing e sustentabilidade.' },
  { title: 'Laboratórios', text: 'Prática com a plataforma e os próprios produtos.' },
  { title: 'Implantação', text: 'Uso no dia a dia: PDV, catálogo e posts.' },
  { title: 'Mostra', text: 'Exposição e celebração dos resultados.' },
];

export default async function SapiensReportPage() {
  let stats: Awaited<ReturnType<typeof getSapiensStats>> | null = null;
  let posts: Awaited<ReturnType<typeof getSapiensPosts>> = [];
  try {
    [stats, posts] = await Promise.all([getSapiensStats(), getSapiensPosts(24)]);
  } catch (err) {
    console.error('[sapiens page]', err);
  }

  if (!stats) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <p className="text-slate-600 text-center">
          Não foi possível carregar o relatório agora. Tente novamente em instantes.
        </p>
      </main>
    );
  }

  const banner = buildBannerContent(stats);
  const kpis = [
    { icon: Users, value: stats.participantes, label: 'mulheres empreendedoras participantes', color: '#0435da' },
    { icon: Package, value: stats.produtos, label: 'produtos cadastrados na plataforma', color: '#3ab54b' },
    { icon: Sparkles, value: stats.imagensIa, label: 'artes de divulgação geradas por IA', color: '#f5b41c' },
    { icon: ClipboardList, value: stats.diagnosticos, label: 'questionários de diagnóstico respondidos', color: '#7c3aed' },
  ];

  return (
    <main className="min-h-screen bg-[#f4f6fb] text-slate-800">
      {/* Cabeçalho */}
      <header className="relative overflow-hidden bg-[#021e5d] text-white">
        <div aria-hidden className="absolute -right-24 -top-24 h-56 w-56 sm:h-72 sm:w-72 rounded-full bg-[#0435da]" />
        <div aria-hidden className="hidden md:block absolute right-20 top-32 h-16 w-16 rounded-full bg-[#f5b41c]" />
        <div aria-hidden className="hidden md:block absolute -left-16 -bottom-10 h-40 w-40 rounded-full border-[18px] border-[#7acbcc]/70" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 pt-8 pb-12 sm:pt-12 sm:pb-16">
          <div className="inline-flex items-center gap-3 rounded-2xl bg-white px-4 py-2.5 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sapiens/ix-sapiens-logo.png" alt="IX SAPIENS" className="h-7 sm:h-9 w-auto" />
          </div>
          <p className="mt-6 text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-[#7acbcc]">
            Relatório público do projeto
          </p>
          <h1 className="mt-2 text-2xl sm:text-4xl font-black leading-tight max-w-4xl">{banner.title}</h1>
          <p className="mt-4 text-sm sm:text-base text-white/80">
            {CERTIFICATE_OFFERED_BY} · Orientação: Profa.{' '}
            {SAPIENS_AUTHORS.find((a) => a.role === 'orientadora')?.name}
          </p>
          <p className="mt-1 text-sm sm:text-base text-white/80">
            Voluntárias:{' '}
            {SAPIENS_AUTHORS.filter((a) => a.role === 'voluntaria')
              .map((a) => a.name)
              .join(', ')}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#indicadores"
              className="rounded-full bg-[#3ab54b] px-5 py-2.5 text-sm font-bold hover:brightness-110"
            >
              Ver resultados
            </a>
            <a
              href="#fotos"
              className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold ring-1 ring-white/30 hover:bg-white/20"
            >
              Ver fotos
            </a>
            <a
              href="#funcionalidades"
              className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold ring-1 ring-white/30 hover:bg-white/20"
            >
              Conhecer a plataforma
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14 space-y-14 sm:space-y-20">
        {/* Sobre */}
        <section className="grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#021e5d]">Sobre o projeto</h2>
            {banner.introducao.paragraphs.map((t) => (
              <p key={t} className="mt-3 text-slate-600 leading-relaxed">
                {t}
              </p>
            ))}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#021e5d]">Como foi feito</h2>
            {banner.metodos.paragraphs.map((t) => (
              <p key={t} className="mt-3 text-slate-600 leading-relaxed">
                {t}
              </p>
            ))}
          </div>
        </section>

        {/* Fotos do projeto */}
        <section id="fotos" className="scroll-mt-6">
          <div className="flex items-center gap-2">
            <Camera className="text-[#0435da]" size={22} />
            <h2 className="text-xl sm:text-2xl font-black text-[#021e5d]">O projeto em fotos</h2>
          </div>
          <p className="mt-1 mb-6 text-sm text-slate-500">
            Oficinas, ação na feira e encerramento com entrega de certificados. Toque em uma foto para ampliar.
          </p>
          <SapiensPhotos groups={SAPIENS_PHOTO_GROUPS} />
        </section>

        {/* Indicadores */}
        <section id="indicadores" className="scroll-mt-6">
          <h2 className="text-xl sm:text-2xl font-black text-[#021e5d]">Resultados em números</h2>
          <p className="mt-1 text-sm text-slate-500">
            Dados reais da plataforma, contando apenas contas de participantes (sem contas administrativas ou de
            teste). Atualizado em {new Date(stats.atualizadoEm).toLocaleDateString('pt-BR')}.
          </p>
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {kpis.map(({ icon: Icon, value, label, color }) => (
              <div key={label} className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm border border-slate-200/70">
                <div
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: color }}
                >
                  <Icon size={18} />
                </div>
                <p className="mt-3 text-3xl sm:text-4xl font-black tabular-nums" style={{ color }}>
                  {value.toLocaleString('pt-BR')}
                </p>
                <p className="mt-1 text-xs sm:text-sm font-medium text-slate-600 leading-snug">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-white p-4 sm:p-6 shadow-sm border border-slate-200/70">
              <h3 className="font-bold text-slate-900">{banner.chart.title}</h3>
              <p className="text-xs text-slate-500 mb-3">Quantas participantes usaram cada funcionalidade</p>
              <AdoptionChart data={banner.chart.data} />
          </div>
        </section>

        {/* Galeria IA */}
        <section>
          <div className="flex items-center gap-2">
            <Sparkles className="text-[#f5b41c]" size={22} />
            <h2 className="text-xl sm:text-2xl font-black text-[#021e5d]">Artes geradas por Inteligência Artificial</h2>
          </div>
          <p className="mt-1 mb-6 text-sm text-slate-500">
            Posts criados pelas próprias participantes a partir das fotos dos seus produtos. Toque para ampliar e ver a
            legenda.
          </p>
          <SapiensGallery posts={posts} />
        </section>

        {/* Funcionalidades */}
        <section id="funcionalidades" className="scroll-mt-6">
          <h2 className="text-xl sm:text-2xl font-black text-[#021e5d]">Funcionalidades da plataforma</h2>
          <p className="mt-1 text-sm text-slate-500">
            A Jornada do Produtor reúne em um só lugar o que a empreendedora precisa para produzir, vender e divulgar.
          </p>
          <div className="mt-6 grid gap-3 sm:gap-4 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4 rounded-2xl bg-white p-4 sm:p-5 shadow-sm border border-slate-200/70">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0435da] text-white">
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{title}</h3>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Metodologia + trilha */}
        <section>
          <h2 className="text-xl sm:text-2xl font-black text-[#021e5d]">Jornada de impacto</h2>
          <ol className="mt-6 grid gap-3 sm:grid-cols-5">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200/70">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3ab54b] text-sm font-black text-white">
                  {i + 1}
                </span>
                <p className="mt-3 font-bold text-slate-900">{s.title}</p>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Conclusão */}
        <section className="rounded-3xl bg-[#021e5d] text-white p-6 sm:p-10">
          <h2 className="text-xl sm:text-2xl font-black">Conclusões</h2>
          {banner.conclusoes.paragraphs.map((t) => (
            <p key={t} className="mt-3 text-white/85 leading-relaxed">
              {t}
            </p>
          ))}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full bg-[#f5b41c] px-5 py-2.5 text-sm font-bold text-[#021e5d] hover:brightness-105"
            >
              Acessar a plataforma
            </Link>
            <Link
              href="/sapiens/banner"
              className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold ring-1 ring-white/30 hover:bg-white/20"
            >
              Ver e baixar o banner
            </Link>
            <Link
              href="/conteudo-programatico"
              className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold ring-1 ring-white/30 hover:bg-white/20"
            >
              Ver conteúdo programático
            </Link>
          </div>
        </section>
      </div>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/uemasul-brasao.png" alt="UEMASUL" className="h-8 w-auto" />
            <span>Projeto TecnoProdutivo · UEMASUL · Imperatriz-MA</span>
          </div>
          <span className="inline-flex items-center gap-1.5">
            <QrCode size={14} /> Página do QR Code do banner IX SAPIENS
          </span>
        </div>
      </footer>
    </main>
  );
}
