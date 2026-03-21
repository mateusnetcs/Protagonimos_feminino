'use client';

import React, { useEffect, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';

type GalleryItem = {
  id: number;
  product_name: string | null;
  caption: string | null;
  image_url: string;
  image_urls: string | null;
  created_at: string;
};

export default function GalleryView() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/post/gallery');
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Excluir este post da galeria?')) return;
    try {
      const res = await fetch(`/api/post/gallery/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        if (selected?.id === id) setSelected(null);
      }
    } catch {
      alert('Erro ao excluir');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ImagePlus size={22} className="text-primary" />
            Galeria de posts gerados
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Todas as imagens que você gerou com IA estão salvas aqui.
          </p>
        </div>

        <div className="p-6">
          {items.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <ImagePlus size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="font-medium">Nenhum post na galeria.</p>
              <p className="text-sm mt-1">Gere posts na aba Post para que apareçam aqui.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-slate-50 rounded-xl overflow-hidden border border-slate-100 hover:border-primary/30 transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setSelected(item)}
                    className="block w-full aspect-square overflow-hidden"
                  >
                    <img
                      src={item.image_url}
                      alt={item.product_name || 'Post'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </button>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {item.product_name || 'Post'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(item.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalhe */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900">{selected.product_name || 'Post'}</h3>
                <p className="text-sm text-slate-500">
                  {new Date(selected.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <img
                src={selected.image_url}
                alt=""
                className="w-full rounded-xl border border-slate-200 mb-4"
              />
              {selected.caption && (
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm font-medium text-slate-600 mb-1">Legenda</p>
                  <p className="text-slate-800 whitespace-pre-wrap text-sm">{selected.caption}</p>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(selected.caption || '')}
                    className="mt-2 text-sm text-primary font-semibold hover:underline"
                  >
                    Copiar legenda
                  </button>
                </div>
              )}
              <a
                href={selected.image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-sm text-primary font-semibold hover:underline"
              >
                Abrir imagem em nova aba
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
