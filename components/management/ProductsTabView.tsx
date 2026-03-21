'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Eye, Package, Trash2 } from 'lucide-react';

export type ManagementProductRow = {
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

export type ProductsTabViewProps = {
  products: ManagementProductRow[];
  productsLoading: boolean;
  onAdd: () => void;
  onEdit: (product: ManagementProductRow) => void;
  onDelete: (product: ManagementProductRow) => void;
};

export default function ProductsTabView({
  products,
  productsLoading,
  onAdd,
  onEdit,
  onDelete,
}: ProductsTabViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
    >
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Package size={20} className="text-primary" />
            Produtos
          </h2>
          <p className="text-slate-500 text-sm mt-1">{products.length} produto(s) cadastrado(s)</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 shrink-0"
        >
          <Package size={20} />
          Cadastrar Produto
        </button>
      </div>
      <div className="overflow-x-auto">
        {productsLoading ? (
          <div className="p-8">
            <div className="h-8 bg-slate-100 rounded animate-pulse w-48 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Package size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="font-medium">Nenhum produto cadastrado.</p>
            <p className="text-sm mt-1">Clique em &quot;Cadastrar Produto&quot; para adicionar.</p>
          </div>
        ) : (
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-sm uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Estoque</th>
                <th className="px-6 py-4">Custo CMV</th>
                <th className="px-6 py-4">Preço Venda</th>
                <th className="px-6 py-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium text-slate-900">{p.name}</td>
                  <td className="px-6 py-4 text-slate-600">{p.category || '-'}</td>
                  <td className="px-6 py-4">{p.stock_current ?? 0}</td>
                  <td className="px-6 py-4">R$ {Number(p.cost_cmv ?? 0).toFixed(2).replace('.', ',')}</td>
                  <td className="px-6 py-4 font-bold text-primary">
                    R$ {Number(p.price_sale ?? 0).toFixed(2).replace('.', ',')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEdit(p)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg"
                        title="Editar"
                      >
                        <Eye size={20} />
                      </button>
                      <button
                        onClick={() => onDelete(p)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Excluir"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}
