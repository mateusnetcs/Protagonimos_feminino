'use client';

import { LayoutDashboard } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';

type LandingPageProps = {
  onStart: () => void;
  onGoToManagement: () => void;
};

const Navbar = ({ onStart, onGoToManagement }: LandingPageProps) => (
  <nav className="sticky top-0 z-50 bg-background-light/80 backdrop-blur-md border-b border-primary/10">
    <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="bg-primary p-2 rounded-lg text-white">
          <span className="material-symbols-outlined block">science</span>
        </div>
        <span className="text-xl font-extrabold tracking-tight">
          Inovação <span className="text-primary">Imperatriz</span>
        </span>
      </div>
      <div className="hidden md:flex items-center gap-8 font-semibold text-sm">
        <a className="hover:text-primary transition-colors" href="#sobre">
          Sobre
        </a>
        <a className="hover:text-primary transition-colors" href="#objetivos">
          Objetivos
        </a>
        <a className="hover:text-primary transition-colors" href="#metodologia">
          Metodologia
        </a>
        <Link
          href="/catalogo"
          className="text-slate-600 hover:text-primary transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-xl">inventory_2</span>
          Catálogo
        </Link>
        <button
          onClick={onGoToManagement}
          className="text-slate-600 hover:text-primary transition-colors flex items-center gap-1"
        >
          <LayoutDashboard size={18} />
          Gestão
        </button>
        <button
          onClick={onStart}
          className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-full transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
        >
          Participar Agora
        </button>
      </div>
      <button className="md:hidden text-primary">
        <span className="material-symbols-outlined text-3xl">menu</span>
      </button>
    </div>
  </nav>
);

const Hero = ({ onStart }: { onStart: () => void }) => (
  <section className="relative overflow-hidden pt-10 pb-20 px-4">
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div className="space-y-8">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider">
          <span className="material-symbols-outlined text-sm">auto_awesome</span>
          Transformação Regional
        </div>
        <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tight text-slate-900">
          Inovação e <span className="text-primary">Sustentabilidade</span> em Imperatriz
        </h1>
        <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-xl">
          Impulsionando o protagonismo feminino na ciência e na produção sustentável para
          transformar a economia local através da tecnologia e empreendedorismo.
        </p>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={onStart}
            className="bg-primary text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-primary/30 hover:shadow-primary/40 transition-all transform hover:-translate-y-1"
          >
            Quero fazer parte
          </button>
          <button className="bg-white border-2 border-primary/20 hover:border-primary px-8 py-4 rounded-full font-bold text-lg transition-all">
            Saiba Mais
          </button>
        </div>
      </div>
      <div className="relative">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
        <div className="relative rounded-xl overflow-hidden shadow-2xl border-4 border-white rotate-2 hover:rotate-0 transition-transform duration-500 aspect-video">
          <Image
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHiCLgzKmJrxGow1Ui9TvKceZXSpE2481gNLn952Cmbt3yqASdsND9I2l1xUgbmoO61L1nD0dg-SSHA_mL_xZWH9xfN_kzv6heu3Uj2X9-lKwyrMxBOO7NCAtE4XWRV09dt_VYIG22EJ_nulSjJ0Ft90TnNkyiB8aaRVqQE3Eso5BIz6w1TUuxWmyLjyMDaAcUykfHaOktcRmDGTRlrDSEOH_pfjaCbYydfTGU9ZaGS6LAisrUJ48G1FgEXgygYGFISY8x8YtoAxAL"
            alt="Women entrepreneurs collaborating"
            fill
            className="object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </div>
  </section>
);

const About = () => (
  <section className="py-24 bg-white" id="sobre">
    <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
      <h2 className="text-3xl md:text-4xl font-bold">Conectando Academia e Produção Local</h2>
      <p className="text-xl text-slate-600 leading-relaxed">
        Nosso projeto integra estudantes de Administração e pesquisadores com produtores locais — da
        agricultura familiar ao artesanato e manufatura — criando uma ponte de conhecimento que
        fortalece a economia regional através da tecnologia e inovação prática.
      </p>
    </div>
  </section>
);

const Objectives = () => (
  <section className="py-24 px-4 bg-background-light" id="objetivos">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-4xl font-black">
          Nossos <span className="text-primary">Objetivos</span>
        </h2>
        <div className="h-1.5 w-24 bg-primary mx-auto rounded-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            icon: 'troubleshoot',
            title: 'Diagnosticar gargalos',
            desc: 'Identificação precisa das barreiras que impedem o crescimento da produção local.',
          },
          {
            icon: 'lightbulb',
            title: 'Propor melhorias',
            desc: 'Desenvolvimento de soluções tecnológicas e processos inovadores sob medida.',
          },
          {
            icon: 'school',
            title: 'Capacitar a comunidade',
            desc: 'Workshops e treinamentos focados em gestão, sustentabilidade e tecnologia.',
          },
          {
            icon: 'recycling',
            title: 'Reduzir desperdícios',
            desc: 'Implementação de práticas de produção limpa e economia circular.',
          },
        ].map((obj) => (
          <div
            key={obj.title}
            className="bg-white p-8 rounded-lg shadow-sm border border-transparent hover:border-primary/30 transition-all hover:shadow-xl group"
          >
            <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-3xl">{obj.icon}</span>
            </div>
            <h3 className="text-xl font-bold mb-3">{obj.title}</h3>
            <p className="text-slate-600">{obj.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Audience = () => (
  <section className="py-24 px-4 bg-white overflow-hidden">
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
        <div className="max-w-2xl">
          <h2 className="text-4xl font-black mb-4">
            Público <span className="text-primary">Alvo</span>
          </h2>
          <p className="text-lg text-slate-600">
            Nossa missão é fortalecer quem faz a economia real de Imperatriz girar todos os dias.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { icon: 'potted_plant', label: 'Agricultores familiares' },
          { icon: 'brush', label: 'Artesãos locais' },
          { icon: 'factory', label: 'Micro indústrias' },
          { icon: 'woman', label: 'Mulheres empreendedoras' },
        ].map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center text-center p-6 space-y-4"
          >
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/30">
              <span className="material-symbols-outlined text-4xl">{item.icon}</span>
            </div>
            <span className="text-lg font-bold">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Methodology = () => (
  <section className="py-24 px-4 bg-background-light overflow-x-hidden" id="metodologia">
    <div className="max-w-7xl mx-auto">
      <h2 className="text-4xl font-black text-center mb-20">
        Nossa Jornada de <span className="text-primary">Impacto</span>
      </h2>
      <div className="relative flex flex-col md:flex-row justify-between gap-12 md:gap-4 step-line">
        {[
          { num: 1, title: 'Diagnóstico', desc: 'Mapeamento inicial e escuta ativa dos produtores.' },
          { num: 2, title: 'Oficinas', desc: 'Troca de conhecimento técnico e gestão.' },
          { num: 3, title: 'Laboratórios', desc: 'Desenvolvimento prático de protótipos.' },
          { num: 4, title: 'Implantação', desc: 'Adoção das melhorias no dia a dia produtivo.' },
          { num: 5, title: 'Mostra', desc: 'Exposição e celebração dos resultados obtidos.' },
        ].map((step) => (
          <div
            key={step.num}
            className="relative flex flex-col items-center text-center md:w-1/5 bg-background-light px-4"
          >
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold mb-4 relative z-10">
              {step.num}
            </div>
            <h4 className="font-bold text-lg mb-2">{step.title}</h4>
            <p className="text-sm text-slate-500">{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const CTA = ({ onStart }: { onStart: () => void }) => (
  <section className="py-24 px-4">
    <div className="max-w-5xl mx-auto bg-primary rounded-xl p-12 text-center text-white relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <span className="material-symbols-outlined text-[150px]">rocket_launch</span>
      </div>
      <div className="relative z-10 space-y-6">
        <h2 className="text-4xl md:text-5xl font-black">Pronto para transformar o futuro?</h2>
        <p className="text-xl opacity-90 max-w-2xl mx-auto">
          Junte-se a nós nesta jornada de inovação e protagonismo em Imperatriz. Seja como produtor,
          estudante ou parceiro.
        </p>
        <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={onStart}
            className="bg-white text-primary hover:bg-slate-100 px-10 py-4 rounded-full font-bold text-lg shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            Participar agora
          </button>
          <button
            onClick={onStart}
            className="bg-primary/20 backdrop-blur-sm border border-white/40 hover:bg-primary/30 px-10 py-4 rounded-full font-bold text-lg transition-all"
          >
            Preencher formulário
          </button>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="py-12 px-4 border-t border-primary/10 bg-background-light">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
      <div className="flex items-center gap-2">
        <div className="bg-primary/10 p-2 rounded-lg text-primary">
          <span className="material-symbols-outlined block">science</span>
        </div>
        <span className="text-xl font-bold">
          Inovação <span className="text-primary">Imperatriz</span>
        </span>
      </div>
      <p className="text-slate-500 text-sm">
        © Projeto Inovação Imperatriz. Todos os direitos reservados.
      </p>
      <div className="flex gap-4">
        <a className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center hover:bg-primary hover:text-white transition-all" href="#">
          <span className="material-symbols-outlined text-xl">share</span>
        </a>
        <a className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center hover:bg-primary hover:text-white transition-all" href="#">
          <span className="material-symbols-outlined text-xl">mail</span>
        </a>
      </div>
    </div>
  </footer>
);

export default function LandingPage({ onStart, onGoToManagement }: LandingPageProps) {
  return (
    <motion.div
      className="animate-fade-in"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Navbar onStart={onStart} onGoToManagement={onGoToManagement} />
      <Hero onStart={onStart} />
      <About />
      <Objectives />
      <Audience />
      <Methodology />
      <CTA onStart={onStart} />
      <Footer />
    </motion.div>
  );
}

