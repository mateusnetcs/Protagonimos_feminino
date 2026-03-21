'use client';

import React from 'react';
import { motion } from 'motion/react';
import CatalogView from '../CatalogView';
import type { ManagementProductRow } from './ProductsTabView';

export type CatalogManagementTabProps = {
  products: ManagementProductRow[];
  loading: boolean;
  onEditProduct: (product: ManagementProductRow) => void;
  onAddProduct: () => void;
};

export default function CatalogManagementTab({
  products,
  loading,
  onEditProduct,
  onAddProduct,
}: CatalogManagementTabProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
      <div className="mb-4 flex justify-end">
        <a
          href="/catalogo"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
        >
          Ver catálogo público (para clientes)
          <span className="material-symbols-outlined text-lg">open_in_new</span>
        </a>
      </div>
      <CatalogView
        products={products}
        loading={loading}
        onEditProduct={onEditProduct}
        onAddProduct={onAddProduct}
      />
    </motion.div>
  );
}
