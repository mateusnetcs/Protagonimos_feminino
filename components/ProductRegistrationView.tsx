'use client';

import React, { useEffect, useState } from 'react';

const CATEGORIES = [
  { value: 'agriculture', label: 'Agricultura' },
  { value: 'craft', label: 'Artesanato' },
  { value: 'food', label: 'Alimentos' },
  { value: 'Geleias', label: 'Geleias' },
  { value: 'Cestas', label: 'Cestas' },
  { value: 'Bebidas', label: 'Bebidas' },
  { value: 'Orgânicos', label: 'Orgânicos' },
];

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
  show_in_catalog?: boolean | number;
  barcode?: string | null;
};

type Props = {
  product?: Product | null;
  onBack: () => void;
  onSaved: () => void;
};

function formatVal(v: number | string): string {
  const n = Number(v ?? 0);
  if (n === 0) return '';
  return n.toFixed(2).replace('.', ',');
}
function formatDisplay(v: number): string {
  return Number(v ?? 0).toFixed(2).replace('.', ',');
}
function parseVal(s: string): number {
  const cleaned = s.replace(/\s/g, '').replace(',', '.');
  if (!cleaned || cleaned === '.') return 0;
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

export default function ProductRegistrationView({ product, onBack, onSaved }: Props) {
  const isEdit = !!product?.id;
  const [name, setName] = useState(product?.name ?? '');
  const [category, setCategory] = useState(product?.category ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [stockCurrent, setStockCurrent] = useState(Number(product?.stock_current ?? 0));
  const [stockMin, setStockMin] = useState(Number(product?.stock_min ?? 0));
  const [costCmv, setCostCmv] = useState(Number(product?.cost_cmv ?? 0));
  const [priceSale, setPriceSale] = useState(Number(product?.price_sale ?? 0));
  const [costRaw, setCostRaw] = useState(formatVal(product?.cost_cmv ?? 0));
  const [priceRaw, setPriceRaw] = useState(formatVal(product?.price_sale ?? 0));
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '');
  const [barcode, setBarcode] = useState(product?.barcode ?? '');
  const [showInCatalog, setShowInCatalog] = useState(product?.show_in_catalog !== 0 && product?.show_in_catalog !== false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setName(product.name);
      setCategory(product.category ?? '');
      setDescription(product.description ?? '');
      setStockCurrent(Number(product.stock_current ?? 0));
      setStockMin(Number(product.stock_min ?? 0));
      setCostCmv(Number(product.cost_cmv ?? 0));
      setPriceSale(Number(product.price_sale ?? 0));
      setCostRaw(formatVal(product.cost_cmv ?? 0));
      setPriceRaw(formatVal(product.price_sale ?? 0));
      setImageUrl(product.image_url ?? '');
      setBarcode(product.barcode ?? '');
      setShowInCatalog(product.show_in_catalog !== 0 && product.show_in_catalog !== false);
    }
  }, [product]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload/product-image', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Erro ao fazer upload');
      setImageUrl(data.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erro ao enviar imagem.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const lucro = Math.max(0, priceSale - costCmv);
  const margem = priceSale > 0 ? (lucro / priceSale) * 100 : 0;
  const catLabel = CATEGORIES.find((c) => c.value === category || c.label === category)?.label ?? category;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        const res = await fetch(`/api/products/${product!.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            category: catLabel || category,
            description,
            stock_current: stockCurrent,
            stock_min: stockMin,
            cost_cmv: costCmv,
            price_sale: priceSale,
            image_url: imageUrl || null,
            barcode: barcode.trim() || null,
            show_in_catalog: showInCatalog,
          }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error ?? 'Erro ao atualizar');
        }
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            category: catLabel || category,
            description,
            stock_current: stockCurrent,
            stock_min: stockMin,
            cost_cmv: costCmv,
            price_sale: priceSale,
            image_url: imageUrl || null,
            barcode: barcode.trim() || null,
            show_in_catalog: showInCatalog,
          }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error ?? 'Erro ao cadastrar');
        }
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">inventory_2</span>
        {isEdit ? 'Editar Produto' : 'Novo Produto'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <label className="md:col-span-2">
            <span className="block text-sm font-bold text-slate-700 mb-2">Nome</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 h-12 px-4"
              placeholder="Ex: Geleia Artesanal 250g"
            />
          </label>
          <label>
            <span className="block text-sm font-bold text-slate-700 mb-2">Código de Barras (EAN)</span>
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 h-12 px-4"
              placeholder="Ex: 7891234567890"
              maxLength={20}
              inputMode="numeric"
            />
            <p className="text-xs text-slate-400 mt-1">Use leitor de código de barras ou digite. Essencial para vendas rápidas no PDV.</p>
          </label>
          <label>
            <span className="block text-sm font-bold text-slate-700 mb-2">Categoria</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 h-12 px-4"
            >
              <option value="">Selecione</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="md:col-span-2">
            <span className="block text-sm font-bold text-slate-700 mb-2">Foto do Produto</span>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {imageUrl && (
                <div className="shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative group">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    title="Remover foto"
                  >
                    <span className="material-symbols-outlined text-white text-2xl">close</span>
                  </button>
                </div>
              )}
              <div className="flex-1 w-full space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer shrink-0">
                    <span className="material-symbols-outlined text-primary">upload_file</span>
                    <span className="text-sm font-medium text-slate-600">
                      {uploading ? 'Enviando...' : 'Fazer upload'}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  <span className="flex items-center text-slate-400 text-sm">ou</span>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => { setImageUrl(e.target.value); setUploadError(''); }}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 h-12 px-4"
                    placeholder="Colar URL ou use o upload acima"
                  />
                </div>
                {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
                <p className="text-xs text-slate-400">Envie uma foto (JPG, PNG, WebP ou GIF, máx. 5MB) ou cole a URL de uma imagem.</p>
              </div>
            </div>
          </label>
          <label className="md:col-span-2">
            <span className="block text-sm font-bold text-slate-700 mb-2">Descrição</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 min-h-[80px] p-4"
              placeholder="Descrição do produto..."
            />
          </label>
          <label>
            <span className="block text-sm font-bold text-slate-700 mb-2">Estoque Atual <span className="text-red-500">*</span></span>
            <input
              type="number"
              min={0}
              value={stockCurrent}
              onChange={(e) => setStockCurrent(Number(e.target.value) || 0)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 h-12 px-4"
              required
            />
          </label>
          <label>
            <span className="block text-sm font-bold text-slate-700 mb-2">Estoque Mínimo <span className="text-red-500">*</span></span>
            <input
              type="number"
              min={0}
              value={stockMin}
              onChange={(e) => setStockMin(Number(e.target.value) || 0)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 h-12 px-4"
              required
            />
          </label>
          <label>
            <span className="block text-sm font-bold text-slate-700 mb-2">Custo CMV (R$) <span className="text-red-500">*</span></span>
            <input
              type="text"
              inputMode="decimal"
              value={costRaw}
              onChange={(e) => {
                const next = e.target.value;
                setCostRaw(next);
                setCostCmv(parseVal(next));
              }}
              onBlur={() => setCostRaw(parseVal(costRaw) === 0 ? '' : formatVal(costCmv))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 h-12 px-4"
              placeholder="0,00"
              required
            />
          </label>
          <label>
            <span className="block text-sm font-bold text-slate-700 mb-2">Preço de Venda (R$) <span className="text-red-500">*</span></span>
            <input
              type="text"
              inputMode="decimal"
              value={priceRaw}
              onChange={(e) => {
                const next = e.target.value;
                setPriceRaw(next);
                setPriceSale(parseVal(next));
              }}
              onBlur={() => setPriceRaw(parseVal(priceRaw) === 0 ? '' : formatVal(priceSale))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 h-12 px-4"
              placeholder="0,00"
              required
            />
          </label>
        </div>
        <label className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
          <input
            type="checkbox"
            checked={showInCatalog}
            onChange={(e) => setShowInCatalog(e.target.checked)}
            className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
          />
          <div>
            <p className="font-bold text-slate-700">Mostrar no catálogo</p>
            <p className="text-sm text-slate-500">Quando ligado, o produto aparece no catálogo. Desligado, não aparece.</p>
          </div>
        </label>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Lucro Estimado</p>
            <p className="text-lg font-black text-primary">R$ {formatDisplay(lucro)}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Margem</p>
            <p className="text-lg font-black text-green-600">{margem.toFixed(0)}%</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-primary text-white font-bold py-3 rounded-xl disabled:opacity-70"
          >
            {saving ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Cadastrar Produto'}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
