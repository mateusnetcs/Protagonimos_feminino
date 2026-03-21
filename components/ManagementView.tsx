'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  BarChart3,
  Book,
  ImagePlus,
  Images,
  LayoutDashboard,
  Package,
  RefreshCw,
  Settings,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import type { SurveyResponse } from '@/types/survey';
import type { ManagementProductRow } from './management/ProductsTabView';
import ProductRegistrationView from './ProductRegistrationView';
import PostGeneratorView from './PostGeneratorView';
import GalleryView from './GalleryView';
import ReportsView from './ReportsView';
import PDVView from './pdv/PDVView';
import ResponsesView from './management/ResponsesView';
import ProductsTabView from './management/ProductsTabView';
import CatalogManagementTab from './management/CatalogManagementTab';
import UsersTabView from './management/UsersTabView';

type ManagementViewProps = {
  onBack: () => void;
};

const VALID_TABS = ['responses', 'catalogo', 'pdv', 'produtos', 'post', 'galeria', 'relatorios', 'usuarios', 'configuracao'] as const;
type TabId = (typeof VALID_TABS)[number];

export default function ManagementView({ onBack }: ManagementViewProps) {
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === 'admin';
  const searchParams = useSearchParams();
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('responses');
  const [mpConnectedToast, setMpConnectedToast] = useState(false);
  const [users, setUsers] = useState<{ id: string; name: string | null; email: string }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && VALID_TABS.includes(tab as TabId)) {
      setActiveTab(tab as TabId);
    }
    if (searchParams.get('mp_connected') === '1') {
      setMpConnectedToast(true);
      setTimeout(() => setMpConnectedToast(false), 5000);
    }
  }, [searchParams]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ManagementProductRow | null>(null);
  const [products, setProducts] = useState<ManagementProductRow[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const fetchResponses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/survey-responses');
      if (res.status === 401) {
        onBack();
        return;
      }
      if (!res.ok) throw new Error('Erro ao carregar');
      const data = await res.json();
      setResponses(data);
    } catch (err: unknown) {
      console.error('Error fetching responses:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      onBack();
    } catch (err) {
      console.error('Logout error:', err);
      onBack();
    }
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const url = selectedUserId && isAdmin
        ? `/api/products?user_id=${encodeURIComponent(selectedUserId)}`
        : '/api/products';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch {
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetch('/api/users', { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => setUsers(Array.isArray(d) ? d : []))
        .catch(() => setUsers([]));
    }
  }, [isAdmin]);

  useEffect(() => {
    if (activeTab === 'produtos' || activeTab === 'catalogo' || activeTab === 'post') fetchProducts();
  }, [activeTab, selectedUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeleteProduct = (p: ManagementProductRow) => {
    if (!window.confirm(`Excluir o produto "${p.name}"? Esta ação não pode ser desfeita.`)) return;
    void fetch(`/api/products/${p.id}`, { method: 'DELETE' })
      .then((r) => {
        if (r.ok) void fetchProducts();
        else void r.json().then((d: { error?: string }) => alert(d.error ?? 'Erro ao excluir.'));
      })
      .catch(() => alert('Erro ao excluir.'));
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 pb-24">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {mpConnectedToast && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-800 font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600">check_circle</span>
            Mercado Pago conectado! Você já pode gerar QR Code PIX no PDV.
          </div>
        )}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white rounded-full transition-colors shadow-sm bg-white md:bg-transparent"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-900">
                Painel de <span className="text-primary">Gestão</span>
              </h1>
              <p className="text-slate-500">
                Visualize e analise as respostas coletadas.
              </p>
            </div>
          </div>
          {isAdmin && users.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-bold text-slate-600 shrink-0">Filtrar por usuário:</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-2 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-primary focus:border-primary min-w-[180px]"
              >
                <option value="">Todos os usuários</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={fetchResponses}
              className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 hover:border-primary transition-all shadow-sm"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              Atualizar Dados
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg border border-red-100 hover:bg-red-100 transition-all shadow-sm"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Menu de Navegação */}
        <div className="flex flex-nowrap gap-1.5 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
          <button
            onClick={() => setActiveTab('responses')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === 'responses'
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard size={20} />
            Respostas
          </button>
          <button
            onClick={() => setActiveTab('catalogo')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === 'catalogo'
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Book size={20} />
            Catálogo
          </button>
          <button
            onClick={() => setActiveTab('pdv')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === 'pdv'
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <ShoppingBag size={20} />
            PDV
          </button>
          <button
            onClick={() => setActiveTab('produtos')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === 'produtos'
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Package size={20} />
            Produtos
          </button>
          <button
            onClick={() => setActiveTab('post')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === 'post'
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <ImagePlus size={20} />
            Post
          </button>
          <button
            onClick={() => setActiveTab('galeria')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === 'galeria'
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Images size={20} />
            Galeria
          </button>
          <button
            onClick={() => setActiveTab('relatorios')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === 'relatorios'
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <BarChart3 size={20} />
            Relatórios
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('usuarios')}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold transition-all shrink-0 ${
                activeTab === 'usuarios'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Users size={20} />
              Usuários
            </button>
          )}
          <button
            onClick={() => setActiveTab('configuracao')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === 'configuracao'
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Settings size={20} />
            Configuração
          </button>
        </div>

        {activeTab === 'responses' ? (
          <ResponsesView
            responses={responses}
            loading={loading}
            error={error}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            selectedResponse={selectedResponse}
            onSelectResponse={setSelectedResponse}
            onRetry={fetchResponses}
          />
        ) : activeTab === 'pdv' ? (
          <PDVView />
        ) : activeTab === 'configuracao' ? (
          <PDVView initialSettingsOpen configOnly onCloseConfig={() => setActiveTab('pdv')} />
        ) : activeTab === 'post' ? (
          <PostGeneratorView
            products={products}
            productsLoading={productsLoading}
            onRefreshProducts={fetchProducts}
          />
        ) : activeTab === 'galeria' ? (
          <GalleryView />
        ) : activeTab === 'relatorios' ? (
          <ReportsView selectedUserId={isAdmin && selectedUserId ? selectedUserId : undefined} />
        ) : activeTab === 'usuarios' ? (
          <UsersTabView />
        ) : activeTab === 'produtos' ? (
          showProductForm ? (
            <ProductRegistrationView
              product={editingProduct}
              onBack={() => {
                setShowProductForm(false);
                setEditingProduct(null);
              }}
              onSaved={() => {
                setShowProductForm(false);
                setEditingProduct(null);
                fetchProducts();
              }}
            />
          ) : (
            <ProductsTabView
              products={products}
              productsLoading={productsLoading}
              onAdd={() => {
                setEditingProduct(null);
                setShowProductForm(true);
              }}
              onEdit={(p) => {
                setEditingProduct(p);
                setShowProductForm(true);
              }}
              onDelete={handleDeleteProduct}
            />
          )
        ) : activeTab === 'catalogo' ? (
          showProductForm ? (
            <ProductRegistrationView
              product={editingProduct}
              onBack={() => {
                setShowProductForm(false);
                setEditingProduct(null);
              }}
              onSaved={() => {
                setShowProductForm(false);
                setEditingProduct(null);
                fetchProducts();
              }}
            />
          ) : (
            <CatalogManagementTab
              products={products}
              loading={productsLoading}
              onEditProduct={(p) => {
                setEditingProduct(p);
                setShowProductForm(true);
              }}
              onAddProduct={() => {
                setEditingProduct(null);
                setShowProductForm(true);
              }}
            />
          )
        ) : null}
      </div>
    </div>
  );
}
