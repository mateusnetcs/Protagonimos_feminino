'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Copy, Check, Link2, ExternalLink } from 'lucide-react';
import CatalogView from '../CatalogView';
import type { ManagementProductRow } from './ProductsTabView';

export type CatalogManagementTabProps = {
  products: ManagementProductRow[];
  loading: boolean;
  onEditProduct: (product: ManagementProductRow) => void;
  onAddProduct: () => void;
  /** ID do usuário cujos produtos estão sendo exibidos. Usado para gerar link do catálogo personalizado. */
  userId?: string | null;
};

export default function CatalogManagementTab({
  products,
  loading,
  onEditProduct,
  onAddProduct,
  userId,
}: CatalogManagementTabProps) {
  const [copied, setCopied] = useState(false);

  const catalogLink = userId
    ? (typeof window !== 'undefined' ? window.location.origin : '') + `/catalogo/${userId}`
    : (typeof window !== 'undefined' ? window.location.origin : '') + '/catalogo';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(catalogLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback para navegadores antigos
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <a
            href={userId ? `/catalogo/${userId}` : '/catalogo'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
          >
            {userId ? (
              <>
                <Link2 size={16} />
                Seu catálogo (somente seus produtos)
              </>
            ) : (
              <>
                <ExternalLink size={16} />
                Catálogo geral (todos os produtos)
              </>
            )}
          </a>
        </div>
        {userId && (
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            {copied ? (
              <>
                <Check size={16} />
                Copiado!
              </>
            ) : (
              <>
                <Copy size={16} />
                Copiar link
              </>
            )}
          </button>
        )}
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
