import Link from 'next/link';
import ConteudoProgramaticoView from '@/components/ConteudoProgramaticoView';

export const metadata = {
  title: 'Conteúdo Programático | Protagonismo Feminino',
  description: 'Módulos e trilha formativa do programa Protagonismo Feminino — Uemasul e Inovação Imperatriz.',
};

export default function ConteudoProgramaticoPage() {
  return (
    <div className="min-h-screen bg-[#f8f7f5]">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold text-primary hover:underline">
            ← Início
          </Link>
          <span className="text-sm font-semibold text-slate-600">Inovação Imperatriz</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-10 md:py-14">
        <ConteudoProgramaticoView />
      </main>
    </div>
  );
}
