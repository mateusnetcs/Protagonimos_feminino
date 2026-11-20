import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import SapiensView from '@/components/sapiens/SapiensView';

export const metadata: Metadata = {
  title: 'Banner IX SAPIENS · TecnoProdutivo',
  description: 'Visualize e baixe as duas versões do banner IX SAPIENS do projeto TecnoProdutivo.',
};

/** Página pública (sem login): prévia e download das duas versões do banner. */
export default function SapiensBannerPage() {
  return (
    <main className="min-h-screen bg-[#f4f6fb] text-slate-800">
      <header className="bg-[#021e5d] text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white px-3 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/sapiens/ix-sapiens-logo.png" alt="IX SAPIENS" className="h-6 sm:h-7 w-auto" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7acbcc]">Banner do projeto</p>
              <h1 className="text-lg sm:text-xl font-black">TecnoProdutivo · Protagonismo Feminino</h1>
            </div>
          </div>
          <Link
            href="/sapiens"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm font-bold ring-1 ring-white/30 hover:bg-white/20"
          >
            <ArrowLeft size={16} /> Relatório do projeto
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
        <SapiensView publicMode />
      </div>
    </main>
  );
}
