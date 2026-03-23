'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { FileText, ImagePlus, Sparkles, Upload, Check, X, Loader2 } from 'lucide-react';
import { parseNfeXml, type NfeParsed, type NfeItem } from '@/lib/parse-nfe-xml';

export type ProductOption = { id: string; name: string; price_sale?: number | null };

type PreviewResult = {
  item: NfeItem;
  matchedProduct: { id: string; name: string; price_sale?: number | null; cost_cmv?: number | null } | null;
  fromMapping: boolean;
};

type DecisionState = {
  action: 'map' | 'create';
  productId?: string;
  customName?: string;
  priceSale?: number;
  updatePrice?: boolean;
  imageUrl?: string | null;
};

type Props = {
  onClose: () => void;
  onSuccess: () => void;
  products: ProductOption[];
  userId?: string | null;
};

export default function ImportNotaModal({ onClose, onSuccess, products, userId }: Props) {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nfe, setNfe] = useState<NfeParsed | null>(null);
  const [previewResults, setPreviewResults] = useState<PreviewResult[]>([]);
  const [decisions, setDecisions] = useState<Map<number, DecisionState>>(new Map());
  const [fetchingImageFor, setFetchingImageFor] = useState<number | null>(null);
  const [cleaningImageFor, setCleaningImageFor] = useState<number | null>(null);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setError('');
      const reader = new FileReader();
      reader.onload = () => {
        const xml = String(reader.result ?? '');
        const parsed = parseNfeXml(xml);
        if (!parsed) {
          setError('Arquivo XML inválido ou não é uma NF-e válida.');
          return;
        }
        setNfe(parsed);
        setLoading(true);
        fetch('/api/nota/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supplierCnpj: parsed.supplierCnpj,
            items: parsed.items.map((i) => ({ itemIndex: i.itemIndex, cEAN: i.cEAN, cProd: i.cProd, xProd: i.xProd })),
            ...(userId && { userId }),
          }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.error) throw new Error(data.error);
            setPreviewResults(data.results ?? []);
            const init = new Map<number, DecisionState>();
            (data.results ?? []).forEach((r: PreviewResult) => {
              const cost = parsed.items.find((i) => i.itemIndex === r.item.itemIndex)?.vUnCom ?? 0;
              if (r.matchedProduct) {
                const currentPrice = r.matchedProduct.price_sale ?? cost;
                init.set(r.item.itemIndex, {
                  action: 'map',
                  productId: r.matchedProduct.id,
                  priceSale: currentPrice,
                  updatePrice: false,
                });
              } else {
                init.set(r.item.itemIndex, {
                  action: 'create',
                  customName: r.item.xProd,
                  priceSale: cost,
                });
              }
            });
            setDecisions(init);
            setStep('preview');
            (data.results ?? []).forEach((r: PreviewResult) => {
              const code = String(r.item.cEAN || '').replace(/\D/g, '');
              if (code.length >= 8) {
                fetch(`/api/nota/fetch-image?barcode=${encodeURIComponent(code)}`)
                  .then((res) => res.json().catch(() => ({})))
                  .then((d) => {
                    if (d?.imageUrl) {
                      setDecisions((prev) => {
                        const next = new Map(prev);
                        const cur = next.get(r.item.itemIndex) ?? { action: 'create' as const };
                        next.set(r.item.itemIndex, { ...cur, imageUrl: d.imageUrl });
                        return next;
                      });
                    }
                  });
              }
            });
          })
          .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao analisar nota.'))
          .finally(() => setLoading(false));
      };
      reader.readAsText(file, 'UTF-8');
    },
    [userId]
  );

  const setDecision = useCallback((itemIndex: number, patch: Partial<DecisionState>) => {
    setDecisions((prev) => {
      const next = new Map(prev);
      const cur = next.get(itemIndex) ?? { action: 'create' as const };
      next.set(itemIndex, { ...cur, ...patch });
      return next;
    });
  }, []);

  const fetchImageByBarcode = useCallback(async (itemIndex: number, barcode: string) => {
    const code = String(barcode || '').replace(/\D/g, '');
    if (code.length < 8) return;
    setFetchingImageFor(itemIndex);
    try {
      const r = await fetch(`/api/nota/fetch-image?barcode=${encodeURIComponent(code)}`);
      const data = await r.json().catch(() => ({}));
      if (data?.imageUrl) {
        setDecision(itemIndex, { imageUrl: data.imageUrl });
      }
    } finally {
      setFetchingImageFor(null);
    }
  }, [setDecision]);

  const cleanImageToWhiteBg = useCallback(async (itemIndex: number, currentImageUrl: string) => {
    if (!currentImageUrl?.trim()) return;
    setCleaningImageFor(itemIndex);
    try {
      const r = await fetch('/api/nota/clean-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: currentImageUrl }),
      });
      const data = await r.json().catch(() => ({}));
      if (data?.imageUrl) {
        setDecision(itemIndex, { imageUrl: data.imageUrl });
      } else if (!r.ok) {
        alert(data?.error || 'Não foi possível deixar o fundo branco. Verifique se REMOVEBG_API_KEY está configurada.');
      }
    } finally {
      setCleaningImageFor(null);
    }
  }, [setDecision]);

  const canConciliar = previewResults.every((r) => {
    const d = decisions.get(r.item.itemIndex);
    if (d?.action === 'map') {
      if (!d.productId) return false;
      const selProd = products.find((p) => p.id === d.productId);
      const hasCurrentPrice = (selProd?.price_sale ?? r.matchedProduct?.price_sale) != null && Number(selProd?.price_sale ?? r.matchedProduct?.price_sale) > 0;
      if (!d.updatePrice && hasCurrentPrice) return true;
      return (d.priceSale ?? 0) > 0;
    }
    return !!d?.customName?.trim() && (d.priceSale ?? 0) > 0;
  });

  const handleConciliar = async () => {
    if (!nfe || !canConciliar) return;
    setLoading(true);
    setError('');
    const items = nfe.items;
    const decList = items.map((item) => {
      const d = decisions.get(item.itemIndex);
      const res = previewResults.find((r) => r.item.itemIndex === item.itemIndex);
      let priceSale: number | undefined;
      if (d?.action === 'map') {
        const selProd = d.productId ? products.find((p) => p.id === d.productId) : null;
        const hasCurrentPrice = (selProd?.price_sale ?? res?.matchedProduct?.price_sale) != null && Number(selProd?.price_sale ?? res?.matchedProduct?.price_sale) > 0;
        priceSale = d.updatePrice ? (d.priceSale ?? undefined) : (hasCurrentPrice ? undefined : (d.priceSale ?? undefined));
      } else {
        priceSale = d?.priceSale ?? Number(item.vUnCom);
      }
      return {
        itemIndex: item.itemIndex,
        action: d?.action ?? 'create',
        productId: d?.productId ? Number(d.productId) : undefined,
        customName: d?.customName ?? item.xProd,
        priceSale: priceSale != null && priceSale > 0 ? priceSale : undefined,
        imageUrl: d?.imageUrl?.trim() || undefined,
      };
    });
    try {
      const res = await fetch('/api/nota/conciliar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierCnpj: nfe.supplierCnpj,
          supplierName: nfe.supplierName,
          items,
          decisions: decList,
          ...(userId && { userId }),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Erro ao conciliar.');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao conciliar nota.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('upload');
    setNfe(null);
    setPreviewResults([]);
    setDecisions(new Map());
    setError('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText size={24} className="text-primary" />
            Importa Nota
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {step === 'upload' && (
            <div className="space-y-4">
              <p className="text-slate-600">
                Faça o upload do arquivo XML da Nota Fiscal Eletrônica (NF-e). O sistema irá identificar os produtos e, quando possível, vincular automaticamente ao seu cadastro.
              </p>
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-primary/50 hover:bg-slate-50/50 transition-colors">
                <input
                  type="file"
                  accept=".xml"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={loading}
                />
                {loading ? (
                  <Loader2 size={48} className="text-primary animate-spin" />
                ) : (
                  <>
                    <Upload size={48} className="text-slate-400 mb-2" />
                    <span className="text-slate-600 font-medium">Clique ou arraste o XML aqui</span>
                    <span className="text-slate-400 text-sm mt-1">Apenas arquivos .xml</span>
                  </>
                )}
              </label>
            </div>
          )}

          {step === 'preview' && nfe && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-sm font-bold text-slate-700">Fornecedor: {nfe.supplierName}</p>
                <p className="text-xs text-slate-500">CNPJ: {nfe.supplierCnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}</p>
              </div>
              <p className="text-sm text-slate-600">
                Revise cada item. As fotos são buscadas automaticamente pelo código de barras. Use &quot;Fundo branco&quot; para deixar a foto profissional (exige chave remove.bg em .env).
              </p>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {previewResults.map((res, idx) => {
                  const fullItem = nfe.items.find((i) => i.itemIndex === res.item.itemIndex) ?? res.item;
                  const dec = decisions.get(res.item.itemIndex);
                  const isMap = dec?.action === 'map';
                  const qty = fullItem?.qCom ?? res.item?.qCom ?? 0;
                  const unit = fullItem?.uCom ?? res.item?.uCom ?? 'UN';
                  const price = fullItem?.vUnCom ?? res.item?.vUnCom ?? 0;
                  return (
                    <div
                      key={res.item.itemIndex}
                      className="p-4 border border-slate-200 rounded-xl space-y-3 bg-slate-50/50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                          {dec?.imageUrl ? (
                            <img src={dec.imageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <span className="text-slate-300">
                              <ImagePlus size={24} />
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-slate-900 block">{res.item.xProd}</span>
                          <span className="text-xs text-slate-500">
                            Qtd: {qty} {unit} · Custo un: R$ {Number(price).toFixed(2).replace('.', ',')}
                            {res.fromMapping && (
                              <span className="ml-2 text-emerald-600">✓ Mapeamento anterior</span>
                            )}
                          </span>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {res.item.cEAN && (
                              <button
                                type="button"
                                onClick={() => fetchImageByBarcode(res.item.itemIndex, res.item.cEAN)}
                                disabled={fetchingImageFor === res.item.itemIndex}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50"
                              >
                                {fetchingImageFor === res.item.itemIndex ? <Loader2 size={12} className="animate-spin" /> : <ImagePlus size={12} />}
                                Buscar foto
                              </button>
                            )}
                            {dec?.imageUrl && (
                              <button
                                type="button"
                                onClick={() => cleanImageToWhiteBg(res.item.itemIndex, dec.imageUrl!)}
                                disabled={cleaningImageFor === res.item.itemIndex}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
                                title="Remove o fundo e deixa branco (foto profissional)"
                              >
                                {cleaningImageFor === res.item.itemIndex ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                Fundo branco
                              </button>
                            )}
                            <input
                              type="text"
                              value={dec?.imageUrl ?? ''}
                              onChange={(e) => setDecision(res.item.itemIndex, { imageUrl: e.target.value || undefined })}
                              placeholder="Ou cole URL da imagem"
                              className="flex-1 min-w-[140px] rounded-lg border border-slate-200 px-2 py-1 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap gap-2 items-center">
                          <button
                            type="button"
                            onClick={() => setDecision(res.item.itemIndex, {
                              action: 'map',
                              productId: res.matchedProduct?.id,
                              priceSale: res.matchedProduct?.price_sale ?? Number(price),
                              updatePrice: false,
                            })}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                              isMap ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            Vincular existente
                          </button>
                          <button
                            type="button"
                            onClick={() => setDecision(res.item.itemIndex, { action: 'create', customName: res.item.xProd, priceSale: Number(price), updatePrice: undefined })}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                              !isMap ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            Criar novo
                          </button>
                          {isMap && (
                            <select
                              value={dec?.productId ?? ''}
                              onChange={(e) => {
                                const pid = e.target.value || undefined;
                                const prod = products.find((p) => p.id === pid);
                                setDecision(res.item.itemIndex, {
                                  action: 'map',
                                  productId: pid,
                                  priceSale: prod?.price_sale ?? Number(price),
                                  updatePrice: false,
                                });
                              }}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm min-w-[200px]"
                            >
                              <option value="">Selecione o produto</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          )}
                          {!isMap && (
                            <input
                              type="text"
                              value={dec?.customName ?? res.item.xProd}
                              onChange={(e) => setDecision(res.item.itemIndex, { action: 'create', customName: e.target.value })}
                              placeholder="Nome do produto"
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm min-w-[200px]"
                            />
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                          {isMap && dec?.productId && (() => {
                            const selProd = products.find((p) => p.id === dec.productId);
                            const currentPrice = selProd?.price_sale ?? res.matchedProduct?.price_sale;
                            return currentPrice != null ? (
                              <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={dec?.updatePrice ?? false}
                                    onChange={(e) => setDecision(res.item.itemIndex, { updatePrice: e.target.checked })}
                                    className="rounded border-slate-300"
                                  />
                                  <span className="text-xs text-slate-600">Atualizar preço da nota</span>
                                </label>
                                {!dec?.updatePrice && (
                                  <span className="text-xs text-slate-500">(mantendo R$ {Number(currentPrice).toFixed(2).replace('.', ',')})</span>
                                )}
                              </div>
                            ) : null;
                          })()}
                          <div className={isMap && dec?.productId && products.find((p) => p.id === dec.productId)?.price_sale != null && !dec?.updatePrice ? 'opacity-60' : ''}>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Preço de Venda (R$)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={dec?.priceSale ?? ''}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value);
                                setDecision(res.item.itemIndex, { priceSale: isNaN(v) ? undefined : v });
                              }}
                              placeholder={
                                (() => {
                                  const selProd = dec?.productId ? products.find((p) => p.id === dec.productId) : null;
                                  const currentPrice = selProd?.price_sale ?? res.matchedProduct?.price_sale;
                                  return isMap && !dec?.updatePrice && currentPrice != null
                                    ? `Atual: R$ ${Number(currentPrice).toFixed(2).replace('.', ',')}`
                                    : `Custo: R$ ${Number(price).toFixed(2).replace('.', ',')}`;
                                })()
                              }
                              disabled={isMap && !dec?.updatePrice && (products.find((p) => p.id === dec?.productId)?.price_sale ?? res.matchedProduct?.price_sale) != null}
                              className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-full disabled:bg-slate-50"
                            />
                          </div>
                        </div>
                        {(() => {
                          const custo = Number(price);
                          const currentPrice = dec?.productId ? products.find((p) => p.id === dec.productId)?.price_sale : res.matchedProduct?.price_sale;
                          const precoVenda = isMap && !dec?.updatePrice && currentPrice != null
                            ? Number(currentPrice)
                            : (dec?.priceSale ?? 0);
                          if (precoVenda <= 0) return null;
                          const lucro = precoVenda - custo;
                          const margem = custo > 0 ? (lucro / custo) * 100 : 0;
                          return (
                            <div className="flex gap-4 text-sm">
                              <span className={lucro >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
                                Lucro: R$ {lucro.toFixed(2).replace('.', ',')}
                              </span>
                              <span className={margem >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
                                Margem: {margem.toFixed(1)}%
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 flex gap-3">
          {step === 'preview' ? (
            <>
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl font-bold border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConciliar}
                disabled={loading || !canConciliar}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                Conciliar Nota
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl font-bold border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Fechar
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
