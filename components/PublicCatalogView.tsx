'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import CheckoutModal from './CheckoutModal';
import CatalogLoginModal from './CatalogLoginModal';
import CustomerSettingsModal from './CustomerSettingsModal';

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

type CartItem = {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
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

export default function PublicCatalogView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customer, setCustomer] = useState<{
    id: number;
    name: string;
    last_name: string;
    email: string;
    photo_url?: string | null;
    cidade?: string | null;
    bairro?: string | null;
    rua?: string | null;
    numero?: string | null;
    cep?: string | null;
    complemento?: string | null;
  } | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [orders, setOrders] = useState<{ id: number; total: number; status: string; created_at: string; items_summary: string }[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string } | null>(null);

  const fetchCustomer = () => {
    fetch('/api/catalog/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setCustomer(data.customer || null))
      .catch(() => setCustomer(null));
  };

  useEffect(() => {
    fetchCustomer();
  }, []);

  useEffect(() => {
    if (showOrders && customer) {
      setOrdersLoading(true);
      fetch('/api/catalog/my-orders', { credentials: 'include' })
        .then((r) => r.json())
        .then((data) => setOrders(Array.isArray(data) ? data : []))
        .catch(() => setOrders([]))
        .finally(() => setOrdersLoading(false));
    }
  }, [showOrders, customer]);

  useEffect(() => {
    fetch('/api/products?scope=public')
      .then((r) => r.json())
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = category === 'Todos' || (p.category || 'Outros') === category;
      const matchSearch = !search.trim() ||
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, category, search]);

  const cartTotal = cart.reduce((s, i) => s + i.quantity, 0);
  const addToCart = (p: Product, qty: number = 1) => {
    const stock = Number(p.stock_current ?? 0);
    if (stock < 1) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === p.id);
      const newQty = Math.min((existing?.quantity ?? 0) + qty, stock);
      if (newQty <= 0) return prev.filter((i) => i.product_id !== p.id);
      const item: CartItem = {
        product_id: p.id,
        name: p.name,
        quantity: newQty,
        unit_price: Number(p.price_sale ?? 0),
      };
      const rest = prev.filter((i) => i.product_id !== p.id);
      return [...rest, item];
    });
  };
  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      const item = prev.find((i) => i.product_id === productId);
      if (!item) return prev;
      const p = products.find((x) => x.id === productId);
      const stock = Number(p?.stock_current ?? 0);
      const newQty = Math.max(0, Math.min(item.quantity + delta, stock));
      if (newQty <= 0) return prev.filter((i) => i.product_id !== productId);
      return prev.map((i) =>
        i.product_id === productId ? { ...i, quantity: newQty } : i
      );
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="h-10 bg-slate-200 rounded-xl animate-pulse w-48 mb-8" />
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-light/95 backdrop-blur-md border-b border-primary/10 py-4 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-primary p-2 rounded-lg text-white">
              <span className="material-symbols-outlined block">storefront</span>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              Inovação <span className="text-primary">Imperatriz</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {customer ? (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowOrders(!showOrders)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-primary/10 transition-colors"
                    title="Meus pedidos"
                  >
                    <span className="material-symbols-outlined text-slate-600">receipt_long</span>
                    <span className="text-sm font-semibold text-slate-700 hidden sm:inline">Meus pedidos</span>
                  </button>
                  {showOrders && (
                    <div className="absolute top-full right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-50">
                      <h3 className="font-bold mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">shopping_bag</span>
                        Meus pedidos
                      </h3>
                      {ordersLoading ? (
                        <p className="text-slate-500 text-sm py-4">Carregando...</p>
                      ) : orders.length === 0 ? (
                        <p className="text-slate-500 text-sm py-4">Nenhum pedido ainda.</p>
                      ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {orders.map((o) => {
                            const statusLabel = { pendente: 'Aguardando pagamento', pago: 'Pago (em entrega)', entregue: 'Entregue', cancelado: 'Cancelado' }[o.status] || o.status;
                            const statusClass = { pendente: 'bg-amber-100 text-amber-700', pago: 'bg-blue-100 text-blue-700', entregue: 'bg-emerald-100 text-emerald-700', cancelado: 'bg-slate-100 text-slate-600' }[o.status] || 'bg-slate-100 text-slate-600';
                            const date = new Date(o.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                            return (
                              <div key={o.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                                <div className="flex justify-between items-start gap-2">
                                  <span className="text-xs text-slate-500">Pedido #{o.id}</span>
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusClass}`}>{statusLabel}</span>
                                </div>
                                <p className="text-sm text-slate-700 mt-1 line-clamp-2">{o.items_summary || 'Itens do pedido'}</p>
                                <div className="flex justify-between items-center mt-2 text-sm">
                                  <span className="text-slate-500">{date}</span>
                                  <span className="font-bold text-primary">{formatPrice(o.total)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-sm font-semibold text-slate-700 hidden md:inline max-w-[120px] truncate" title={customer.email}>{customer.email}</span>
                <button
                  type="button"
                  onClick={() => setShowSettings(true)}
                  className="flex items-center gap-2 p-1.5 hover:bg-primary/10 rounded-full transition-colors"
                  title="Configurações"
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center shrink-0">
                    {customer.photo_url ? (
                      <img src={customer.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-slate-500">person</span>
                    )}
                  </div>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowLogin(true)}
                className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-primary/10 hover:text-primary transition-colors"
              >
                Entrar
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowCart(!showCart)}
              className="relative p-2 hover:bg-primary/10 rounded-full transition-colors"
              title="Carrinho"
            >
              <span className="material-symbols-outlined text-2xl text-slate-700">shopping_cart</span>
              {cartTotal > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full">
                  {cartTotal}
                </span>
              )}
            </button>
            <Link
              href="/"
              className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Voltar
            </Link>
          </div>
        </div>
        {/* Cart dropdown */}
        {showCart && (
          <div className="absolute top-full right-4 lg:right-8 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-50">
            <h3 className="font-bold mb-3">Carrinho</h3>
            {cart.length === 0 ? (
              <p className="text-slate-500 text-sm">Carrinho vazio.</p>
            ) : (
              <>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {cart.map((i) => (
                    <div key={i.product_id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate flex-1">{i.name}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateQuantity(i.product_id, -1)}
                          className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-medium">{i.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(i.product_id, 1)}
                          className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-semibold w-16 text-right">{formatPrice(i.quantity * i.unit_price)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(cart.reduce((s, i) => s + i.quantity * i.unit_price, 0))}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowCart(false); setShowCheckout(true); }}
                  className="mt-3 w-full bg-primary text-white py-3 rounded-xl font-bold"
                >
                  Finalizar compra
                </button>
              </>
            )}
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto py-6 lg:py-8 px-4 lg:px-8">
        <div className="lg:hidden space-y-4 mb-6">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              type="text"
              placeholder="Pesquisar produtos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary text-sm shadow-sm"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold ${
                  category === cat ? 'bg-primary text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          <aside className="hidden lg:flex w-64 flex-col gap-6 shrink-0">
            <h2 className="text-2xl font-black text-slate-900">Catálogo</h2>
            <p className="text-slate-600 text-sm">Produtos dos produtores de Imperatriz.</p>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                type="text"
                placeholder="Pesquisar produtos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none shadow-sm"
              />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
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
                      category === cat ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">{CATEGORY_ICONS[cat] || 'category'}</span>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="py-20 text-center text-slate-500 bg-white rounded-xl border border-slate-100">
                <span className="material-symbols-outlined text-6xl text-slate-300 mb-4 block">inventory_2</span>
                <p className="font-medium text-lg">Nenhum produto encontrado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((p) => {
                  const badge = getStockBadge(Number(p.stock_current ?? 0), Number(p.stock_min ?? 0));
                  const dot = getStockDot(Number(p.stock_current ?? 0), Number(p.stock_min ?? 0));
                  const imgUrl = p.image_url || '';
                  const stock = Number(p.stock_current ?? 0);
                  const inCart = cart.find((i) => i.product_id === p.id)?.quantity ?? 0;
                  const canAdd = stock > 0;
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl overflow-hidden border border-slate-100 hover:shadow-xl transition-shadow group"
                    >
                      <div className="aspect-square bg-slate-100 relative overflow-hidden">
                        {imgUrl ? (
                          <img src={imgUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-6xl text-slate-300">image</span>
                          </div>
                        )}
                        <div className="absolute top-4 right-4">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${badge.class}`}>{badge.label}</span>
                        </div>
                      </div>
                      <div className="p-5">
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">{p.category || 'Outros'}</span>
                        <h4 className="text-lg font-bold text-slate-900 mt-1 line-clamp-2">{p.name}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                          <span className={`w-2 h-2 rounded-full ${dot}`} />
                          Estoque: {stock} un
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-2">
                          <span className="text-2xl font-black text-slate-900">{formatPrice(Number(p.price_sale ?? 0))}</span>
                          {canAdd ? (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => updateQuantity(p.id, -1)}
                                disabled={inCart <= 0}
                                className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center disabled:opacity-50"
                              >
                                −
                              </button>
                              <span className="w-8 text-center font-bold">{inCart}</span>
                              <button
                                type="button"
                                onClick={() => addToCart(p, 1)}
                                className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">Indisponível</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {showCheckout && cart.length > 0 && (
        <CheckoutModal
          items={cart}
          customer={customer}
          onClose={() => setShowCheckout(false)}
          onSuccess={(customerName) => {
            const nome = (customerName || '').trim();
            const nomeExibir = nome ? nome.split(' ')[0] : 'cliente';
            setCart([]);
            setShowCheckout(false);
            setToast({ msg: `Obrigado, ${nomeExibir}! Obrigado por comprar na Inovação Imperatriz. Sua compra foi confirmada com sucesso!` });
            setTimeout(() => setToast(null), 6000);
          }}
        />
      )}
      {showLogin && (
        <CatalogLoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={() => { fetchCustomer(); setShowLogin(false); }}
        />
      )}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] max-w-md mx-4 px-6 py-4 rounded-2xl shadow-2xl bg-emerald-600 text-white font-semibold text-center border-2 border-emerald-500">
          <span className="material-symbols-outlined text-3xl mb-2 block">check_circle</span>
          {toast.msg}
        </div>
      )}
      {showSettings && customer && (
        <CustomerSettingsModal
          customer={customer}
          onClose={() => setShowSettings(false)}
          onUpdated={(c) => setCustomer(c)}
          onLogout={() => { setCustomer(null); setShowSettings(false); }}
        />
      )}
    </div>
  );
}
