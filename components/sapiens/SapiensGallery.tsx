'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import type { SapiensPost } from '@/lib/sapiens-stats';

/** Grade de artes geradas por IA com ampliação ao toque. */
export default function SapiensGallery({ posts }: { posts: SapiensPost[] }) {
  const [open, setOpen] = useState<SapiensPost | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!posts.length) {
    return <p className="text-slate-500">Nenhuma arte publicada ainda.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {posts.map((post) => (
          <button
            key={post.id}
            type="button"
            onClick={() => setOpen(post)}
            className="group text-left rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0435da]"
          >
            <div className="relative aspect-square bg-slate-100 overflow-hidden">
              {/* Miniatura otimizada (os originais têm ~1,6 MB cada) */}
              <Image
                src={post.imageUrl}
                alt={post.productName ? `Arte gerada por IA para ${post.productName}` : 'Arte gerada por IA'}
                fill
                sizes="(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw"
                quality={70}
                className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
              />
            </div>
            {post.productName && (
              <p className="px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 line-clamp-2">
                {post.productName}
              </p>
            )}
          </button>
        ))}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(null)}
        >
          <div
            className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(null)}
              aria-label="Fechar"
              className="absolute top-2 right-2 rounded-full bg-white/90 p-2 shadow"
            >
              <X size={18} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={open.imageUrl} alt="" className="w-full h-auto" />
            <div className="p-4 space-y-2">
              {open.productName && <p className="font-bold text-slate-900">{open.productName}</p>}
              {open.caption && <p className="text-sm text-slate-600 whitespace-pre-line">{open.caption}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
