'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronDown, GraduationCap, Monitor } from 'lucide-react';
import {
  CONTEUDO_PROGRAMATICO_INTRO,
  MODULOS_PROGRAMATICOS,
  type ModuloProgramatico,
} from '@/lib/conteudo-programatico-data';

type ConteudoProgramaticoViewProps = {
  /** Exibir link para capacitação interativa (painel) */
  showCapacitacaoLink?: boolean;
  compact?: boolean;
};

function ModuloCard({ modulo, defaultOpen }: { modulo: ModuloProgramatico; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const Icon = modulo.icon;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-4 p-5 text-left hover:bg-slate-50/80 transition-colors"
      >
        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Icon size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-bold text-primary uppercase tracking-wide">
              Módulo {modulo.ordem}
            </span>
          </div>
          <h3 className="font-bold text-slate-800 text-lg leading-snug">{modulo.titulo}</h3>
          <p className="text-sm text-slate-500 mt-0.5">{modulo.subtitulo}</p>
        </div>
        <ChevronDown
          size={20}
          className={`text-slate-400 shrink-0 mt-1 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-0 border-t border-slate-100">
          <p className="text-slate-600 text-sm leading-relaxed mt-4 mb-4">{modulo.descricao}</p>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Conteúdos</p>
          <ul className="space-y-2">
            {modulo.topicos.map((topico) => (
              <li key={topico} className="flex gap-2 text-sm text-slate-700">
                <span className="text-primary font-bold shrink-0">•</span>
                <span>{topico}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

export default function ConteudoProgramaticoView({
  showCapacitacaoLink = true,
  compact = false,
}: ConteudoProgramaticoViewProps) {
  const modulosFormacao = MODULOS_PROGRAMATICOS.filter((m) => m.categoria === 'formacao');
  const modulosPlataforma = MODULOS_PROGRAMATICOS.filter((m) => m.categoria === 'plataforma');

  return (
    <div className={compact ? 'space-y-6' : 'space-y-10'}>
      <header className={compact ? 'space-y-2' : 'space-y-4'}>
        <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wide">
          <BookOpen size={18} />
          {CONTEUDO_PROGRAMATICO_INTRO.titulo}
        </div>
        <h2 className={`font-black text-slate-900 ${compact ? 'text-2xl' : 'text-3xl md:text-4xl'}`}>
          {CONTEUDO_PROGRAMATICO_INTRO.programa}
        </h2>
        <p className="text-primary font-semibold text-sm">{CONTEUDO_PROGRAMATICO_INTRO.oferta}</p>
        <p className="text-slate-600 max-w-3xl leading-relaxed">{CONTEUDO_PROGRAMATICO_INTRO.descricao}</p>
        <p className="text-sm text-slate-500 max-w-2xl">
          Este conteúdo consta no <strong className="text-slate-700">verso do certificado</strong>{' '}
          (1 página, 3 colunas) emitido ao concluir a trilha.
        </p>
        {showCapacitacaoLink && (
          <p className="text-sm text-slate-500">
            Para treinar na plataforma passo a passo, acesse também a{' '}
            <Link href="/capacitacao" className="text-primary font-semibold hover:underline">
              apresentação interativa de capacitação
            </Link>
            .
          </p>
        )}
      </header>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="text-primary" size={22} />
          <h3 className="text-xl font-bold text-slate-800">Módulos de formação</h3>
        </div>
        <div className="grid gap-3">
          {modulosFormacao.map((modulo, i) => (
            <ModuloCard key={modulo.id} modulo={modulo} defaultOpen={!compact && i === 0} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Monitor className="text-primary" size={22} />
          <h3 className="text-xl font-bold text-slate-800">Módulos da plataforma digital</h3>
        </div>
        <p className="text-sm text-slate-500 max-w-2xl">
          Ferramentas do Jornada do Produtor trabalhadas na prática durante a capacitação.
        </p>
        <div className="grid gap-3">
          {modulosPlataforma.map((modulo) => (
            <ModuloCard key={modulo.id} modulo={modulo} />
          ))}
        </div>
      </section>
    </div>
  );
}
