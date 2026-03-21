'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';

type Product = {
  id: string;
  name: string;
  category?: string;
  description?: string;
  stock_current?: number;
  stock_min?: number;
  cost_cmv?: number;
  price_sale?: number;
  image_url?: string;
};

const CATEGORIES = ['Todos', 'Geleias', 'Cestas', 'Artesanato', 'Bebidas', 'Orgânicos', 'Outros'];

const CATEGORY_ICONS: Record<string, string> = {
  Todos: 'deployed_code',
  Geleias: 'storage',
  Cestas: 'shopping_basket',
  Artesanato: 'brush',
  Bebidas: 'local_cafe',
  Orgânicos: 'eco',
  Outros: 'more_horiz',
};

function getStockBadge(stock: number, min: number): { label: string; class: string } {
  if (stock <= 0) return { label: 'Sem estoque', class: 'bg-rose-100 text-rose-700 border-rose-200' };
  if (stock <= min) return { label: 'Baixo estoque', class: 'bg-amber-100 text-amber-700 border-amber-200' };
  return { label: 'Em estoque', class: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
}

function getStockDot(stock: number, min: number): string {
  if (stock <= 0) return 'bg-red-500';
  if (stock <= min) return 'bg-yellow-500';
  return 'bg-green-500';
}

function formatPrice(v: number): string {
  return `R$ ${Number(v ?? 0).toFixed(2).replace('.', ',')}`;
}

type CatalogViewProps = {
  products: Product[];
  loading: boolean;
  onEditProduct: (p: Product) => void;
  onAddProduct: () => void;
};

export default function CatalogView({ products, loading, onEditProduct, onAddProduct }: CatalogViewProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = category === 'Todos' || (p.category || 'Outros') === category;
      const matchSearch = !search.trim() || 
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, category, search]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-slate-100 rounded-xl animate-pulse w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden border border-slate-100">
              <div className="aspect-square bg-slate-100 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
                <div className="h-6 bg-slate-100 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ========== MOBILE ========== */}
      <div className="lg:hidden w-full">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
                <input
                  type="text"
                  placeholder="Pesquisar produtos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
              <button
                type="button"
                className="aspect-square w-12 flex items-center justify-center bg-primary text-white rounded-2xl shadow-lg shadow-primary/20"
                title="Filtros"
              >
                <span className="material-symbols-outlined">tune</span>
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold ${
                    category === cat ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <main className="px-4 pb-24">
            {filteredProducts.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <span className="material-symbols-outlined text-4xl text-slate-300 mb-2 block">inventory_2</span>
                <p className="text-sm">Nenhum produto encontrado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 pb-4">
                {filteredProducts.map((p) => {
                  const badge = getStockBadge(Number(p.stock_current ?? 0), Number(p.stock_min ?? 0));
                  const dot = getStockDot(Number(p.stock_current ?? 0), Number(p.stock_min ?? 0));
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-3xl p-3 shadow-sm border border-slate-100"
                    >
                      <div
                        className="aspect-square rounded-2xl bg-slate-100 mb-3 bg-cover bg-center"
                        style={{ backgroundImage: p.image_url ? `url('${p.image_url}')` : undefined }}
                      />
                      <h3 className="font-bold text-sm line-clamp-1 mb-1">{p.name}</h3>
                      <p className="text-primary font-bold text-base mb-2">{formatPrice(Number(p.price_sale ?? 0))}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                        Estoque: {p.stock_current ?? 0} un
                      </div>
                      <button
                        type="button"
                        onClick={() => onEditProduct(p)}
                        className="mt-2 w-full py-2 text-xs font-semibold text-primary border border-primary rounded-xl hover:bg-primary hover:text-white transition-colors"
                      >
                        Editar
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
        <button
          type="button"
          onClick={onAddProduct}
          className="fixed right-6 bottom-24 w-14 h-14 bg-primary text-white rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center z-20 hover:bg-primary/90"
        >
          <span className="material-symbols-outlined text-3xl">add</span>
        </button>
      </div>

      {/* ========== WEB ========== */}
      <div className="hidden lg:block w-full">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 flex flex-col gap-8 shrink-0">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                type="text"
                placeholder="Pesquisar produtos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">category</span>
                Categorias
              </h3>
              <div className="flex flex-col gap-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-colors ${
                      category === cat
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {CATEGORY_ICONS[cat] || 'category'}
                    </span>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <section className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-slate-900">Catálogo de Produtos</h2>
              <button
                type="button"
                onClick={onAddProduct}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined">add</span>
                Cadastrar Novo
              </button>
            </div>
            {filteredProducts.length === 0 ? (
              <div className="py-16 text-center text-slate-500 bg-white rounded-xl border border-slate-100">
                <span className="material-symbols-outlined text-5xl text-slate-300 mb-4 block">inventory_2</span>
                <p className="font-medium">Nenhum produto encontrado.</p>
                <p className="text-sm mt-1">Cadastre produtos na aba Produtos ou ajuste os filtros.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((p) => {
                  const badge = getStockBadge(Number(p.stock_current ?? 0), Number(p.stock_min ?? 0));
                  const imgUrl = p.image_url || '';
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl overflow-hidden border border-slate-100 hover:shadow-xl transition-shadow group"
                    >
                      <div className="aspect-square bg-slate-100 relative overflow-hidden">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-6xl text-slate-300">image</span>
                          </div>
                        )}
                        <div className="absolute top-4 right-4">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${badge.class}`}>
                            {badge.label}
                          </span>
                        </div>
                      </div>
                      <div className="p-5">
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">
                          {p.category || 'Outros'}
                        </span>
                        <h4 className="text-lg font-bold text-slate-900 mt-1 line-clamp-2">{p.name}</h4>
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-2xl font-black text-slate-900">
                            {formatPrice(Number(p.price_sale ?? 0))}
                          </span>
                          <button
                            type="button"
                            onClick={() => onEditProduct(p)}
                            className="p-2 bg-slate-100 rounded-lg hover:bg-primary hover:text-white transition-colors"
                            title="Editar"
                          >
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
