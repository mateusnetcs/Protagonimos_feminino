'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { SapiensPhoto, SapiensPhotoGroup } from '@/lib/sapiens-photos';

/** Fotos do projeto agrupadas, com ampliação e navegação (setas, teclado e toque). */
export default function SapiensPhotos({ groups }: { groups: SapiensPhotoGroup[] }) {
  const all = useMemo(
    () => groups.flatMap((g) => g.photos.map((p) => ({ ...p, group: g.title }))),
    [groups]
  );
  const [open, setOpen] = useState<number | null>(null);
  const [touchX, setTouchX] = useState<number | null>(null);

  const go = useCallback(
    (delta: number) => setOpen((i) => (i === null ? i : (i + delta + all.length) % all.length)),
    [all.length]
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, go]);

  const indexOf = (p: SapiensPhoto) => all.findIndex((a) => a.src === p.src);
  const current = open === null ? null : all[open];

  return (
    <>
      <div className="space-y-8">
        {groups.map((g) => (
          <div key={g.id}>
            <h3 className="font-bold text-slate-900">{g.title}</h3>
            <p className="mt-0.5 text-sm text-slate-500">{g.description}</p>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
              {g.photos.map((p, i) => (
                <button
                  key={p.src}
                  type="button"
                  onClick={() => setOpen(indexOf(p))}
                  className={`group relative overflow-hidden rounded-xl bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0435da] ${
                    /* no celular (2 colunas), grupos ímpares destacam a 1ª foto para a grade fechar */
                    i === 0 && g.photos.length % 2 === 1
                      ? 'col-span-2 aspect-[4/3] sm:col-span-1 sm:aspect-square'
                      : 'aspect-square'
                  }`}
                  aria-label={`Ampliar foto: ${p.alt}`}
                >
                  <Image
                    src={p.src}
                    alt={p.alt}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                    quality={70}
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {current && open !== null && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black"
          role="dialog"
          aria-modal="true"
          aria-label="Foto ampliada"
          onClick={() => setOpen(null)}
          onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX === null) return;
            const dx = e.changedTouches[0].clientX - touchX;
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
            setTouchX(null);
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm font-semibold">
              {current.group} · {open + 1}/{all.length}
            </span>
            <button type="button" onClick={() => setOpen(null)} aria-label="Fechar" className="rounded-full bg-white/10 p-2">
              <X size={20} />
            </button>
          </div>
          <div className="relative flex-1 min-h-0" onClick={(e) => e.stopPropagation()}>
            <Image src={current.src} alt={current.alt} fill sizes="100vw" quality={85} className="object-contain" priority />
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Foto anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
            >
              <ChevronLeft size={26} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Próxima foto"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
            >
              <ChevronRight size={26} />
            </button>
          </div>
          <p className="px-4 py-3 text-center text-sm text-white/85">{current.alt}</p>
        </div>
      )}
    </>
  );
}
