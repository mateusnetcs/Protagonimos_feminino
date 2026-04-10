'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, ExternalLink, Home } from 'lucide-react';
import { CAPACITACAO_SLIDES } from './slides-data';

const TOTAL = CAPACITACAO_SLIDES.length;

export default function CapacitacaoSlideshow() {
  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const wheelLock = useRef(false);

  const go = useCallback((delta: number) => {
    setIndex((i) => {
      const n = i + delta;
      if (n < 0) return 0;
      if (n >= TOTAL) return TOTAL - 1;
      return n;
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (wheelLock.current) return;
      wheelLock.current = true;
      const threshold = 40;
      if (e.deltaY > threshold) go(1);
      else if (e.deltaY < -threshold) go(-1);
      window.setTimeout(() => {
        wheelLock.current = false;
      }, 450);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        go(1);
      }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        go(-1);
      }
      if (e.key === 'Home') {
        e.preventDefault();
        setIndex(0);
      }
      if (e.key === 'End') {
        e.preventDefault();
        setIndex(TOTAL - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const slide = CAPACITACAO_SLIDES[index];
  const Icon = slide.icon;

  return (
    <div
      ref={containerRef}
      className="min-h-[100dvh] bg-gradient-to-br from-slate-900 via-slate-900 to-[#2a1810] text-white flex flex-col"
      tabIndex={0}
      role="region"
      aria-label="Apresentação de capacitação"
    >
      <header className="flex items-center justify-between gap-4 px-4 py-3 border-b border-white/10 shrink-0">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-primary transition-colors"
        >
          <Home size={18} />
          Início
        </Link>
        <span className="text-xs font-bold text-white/50 uppercase tracking-wider">
          Capacitação · use a roda do mouse ou as setas
        </span>
        <span className="text-sm font-mono text-primary tabular-nums">
          {index + 1} / {TOTAL}
        </span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10 md:px-16 md:py-12 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-4xl"
          >
          <div className="flex items-start gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-primary/20 border border-primary/40 text-primary shrink-0">
              <Icon size={40} strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              {slide.adminOnly && (
                <span className="inline-block mb-2 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Somente administrador
                </span>
              )}
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
                {slide.title}
              </h1>
              {slide.subtitle && (
                <p className="mt-3 text-lg md:text-xl text-white/70 font-medium">{slide.subtitle}</p>
              )}
            </div>
          </div>

          {slide.paragraph && (
            <p className="mb-8 text-sm md:text-base text-white/65 leading-relaxed max-w-3xl">
              {slide.paragraph}
            </p>
          )}

          <ul className="space-y-4 md:space-y-5">
            {slide.bullets.map((line, i) => (
              <li
                key={i}
                className="flex gap-4 text-base md:text-lg text-white/85 leading-relaxed pl-1 border-l-4 border-primary/60 pl-5 py-1"
              >
                <span className="text-primary font-black shrink-0 w-6">{i + 1}.</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>

          {slide.actions && slide.actions.length > 0 && (
            <div className="mt-10 pt-8 border-t border-white/10">
              <p className="text-xs font-bold uppercase tracking-wider text-primary mb-4">
                Ir para a tela no sistema
              </p>
              <div className="flex flex-wrap gap-3">
                {slide.actions.map((a) => (
                  <Link
                    key={`${a.href}-${a.label}`}
                    href={a.href}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm md:text-base bg-white text-slate-900 hover:bg-primary hover:text-white transition-colors shadow-lg shadow-black/20 border border-white/10"
                  >
                    <ExternalLink size={18} className="shrink-0" />
                    {a.label}
                  </Link>
                ))}
              </div>
              {slide.actionHint && (
                <p className="mt-3 text-xs md:text-sm text-white/45 max-w-2xl leading-relaxed">
                  {slide.actionHint}
                </p>
              )}
            </div>
          )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="shrink-0 border-t border-white/10 bg-black/20 px-4 py-5 md:py-6">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-5">
          <div
            className="flex flex-wrap items-center justify-center gap-2"
            role="tablist"
            aria-label="Slides"
          >
            {CAPACITACAO_SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Ir para slide ${i + 1}: ${s.title}`}
                onClick={() => setIndex(i)}
                className={`h-3 rounded-full transition-all duration-300 ${
                  i === index
                    ? 'w-10 bg-primary shadow-lg shadow-primary/40'
                    : 'w-3 bg-white/25 hover:bg-white/45 hover:w-4'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3 w-full max-w-md justify-center">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={index === 0}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold bg-white/10 hover:bg-white/15 disabled:opacity-30 disabled:pointer-events-none border border-white/10"
            >
              <ChevronLeft size={22} />
              Anterior
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              disabled={index === TOTAL - 1}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 disabled:opacity-30 disabled:pointer-events-none shadow-lg shadow-primary/25"
            >
              Próximo
              <ChevronRight size={22} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
