'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, FileText, ImagePlus, Sparkles, Upload, Check, Loader2 } from 'lucide-react';
import { parseNfeXml, type NfeParsed, type NfeItem } from '@/lib/parse-nfe-xml';

export type ProductOption = { id: string; name: string; price_sale?: number | null };

type PreviewResult = {
  item: NfeItem;
  matchedProduct: { id: string; name: string; price_sale?: number | null; cost_cmv?: number | null } | null;
  fromMapping: boolean;
  supplierCnpj: string;
  supplierName: string;
};

type NfeGroup = {
  supplierCnpj: string;
  supplierName: string;
  items: NfeItem[];
};

type DecisionState = {
  action: 'map' | 'create';
  productId?: string;
  customName?: string;
  priceSale?: number;
  updatePrice?: boolean;
  imageUrl?: string | null;
};

function itemKey(supplierCnpj: string, itemIndex: number) {
  return `${supplierCnpj}:${itemIndex}`;
}

type Props = {
  onBack: () => void;
  onSuccess: () => void;
  products: ProductOption[];
  userId?: string | null;
};

export default function ImportNotaView({ onBack, onSuccess, products, userId }: Props) {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nfeGroups, setNfeGroups] = useState<NfeGroup[]>([]);
  const [previewResults, setPreviewResults] = useState<PreviewResult[]>([]);
  const [decisions, setDecisions] = useState<Map<string, DecisionState>>(new Map());
  const [fetchingImageFor, setFetchingImageFor] = useState<string | null>(null);
  const [cleaningImageFor, setCleaningImageFor] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length) return;
      setError('');
      setLoading(true);
      const fileList = Array.from(files);
      const parsedList: NfeParsed[] = [];
      let readCount = 0;
      fileList.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          const xml = String(reader.result ?? '');
          const parsed = parseNfeXml(xml);
          if (parsed) parsedList.push(parsed);
          readCount++;
          if (readCount === fileList.length) {
            if (parsedList.length === 0) {
              setError('Nenhum arquivo XML válido ou NF-e encontrada.');
              setLoading(false);
              return;
            }
            const groupByCnpj = new Map<string, { supplierName: string; items: NfeItem[] }>();
            parsedList.forEach((p) => {
              const cnpj = p.supplierCnpj;
              const existing = groupByCnpj.get(cnpj);
              if (existing) {
                const startIdx = existing.items.length;
                const newItems = p.items.map((it, i) => ({ ...it, itemIndex: startIdx + i + 1 }));
                existing.items.push(...newItems);
              } else {
                const newItems = p.items.map((it, i) => ({ ...it, itemIndex: i + 1 }));
                groupByCnpj.set(cnpj, { supplierName: p.supplierName, items: newItems });
              }
            });
            const groups: NfeGroup[] = Array.from(groupByCnpj.entries()).map(([cnpj, v]) => ({
              supplierCnpj: cnpj,
              supplierName: v.supplierName,
              items: v.items,
            }));
            setNfeGroups(groups);
            Promise.all(
              groups.map((g) =>
                fetch('/api/nota/preview', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    supplierCnpj: g.supplierCnpj,
                    items: g.items.map((i) => ({ itemIndex: i.itemIndex, cEAN: i.cEAN, cProd: i.cProd, xProd: i.xProd })),
                    ...(userId && { userId }),
                  }),
                }).then((r) => r.json())
              )
            )
              .then((responses) => {
                const allResults: PreviewResult[] = [];
                const init = new Map<string, DecisionState>();
                responses.forEach((data, idx) => {
                  if (data.error) throw new Error(data.error);
                  const g = groups[idx];
                  const results = data.results ?? [];
                  results.forEach((r: { item: NfeItem; matchedProduct: PreviewResult['matchedProduct']; fromMapping: boolean }) => {
                    const resWithSupplier: PreviewResult = {
                      ...r,
                      supplierCnpj: g.supplierCnpj,
                      supplierName: g.supplierName,
                    };
                    allResults.push(resWithSupplier);
                    const cost = g.items.find((i) => i.itemIndex === r.item.itemIndex)?.vUnCom ?? 0;
                    const key = itemKey(g.supplierCnpj, r.item.itemIndex);
                    if (r.matchedProduct) {
                      init.set(key, {
                        action: 'map',
                        productId: r.matchedProduct.id,
                        priceSale: r.matchedProduct.price_sale ?? cost,
                        updatePrice: false,
                      });
                    } else {
                      init.set(key, {
                        action: 'create',
                        customName: r.item.xProd,
                        priceSale: cost,
                      });
                    }
                  });
                });
                setPreviewResults(allResults);
                setDecisions(init);
                setStep('preview');
                allResults.forEach((r) => {
                  const code = String(r.item.cEAN || '').replace(/\D/g, '');
                  const hasBarcode = code.length >= 8;
                  const searchTerm = r.item.xProd?.trim().slice(0, 80);
                  if (hasBarcode || searchTerm) {
                    const key = itemKey(r.supplierCnpj, r.item.itemIndex);
                    const params = new URLSearchParams();
                    if (hasBarcode) params.set('barcode', code);
                    if (searchTerm) params.set('search', searchTerm);
                    fetch(`/api/nota/fetch-image?${params.toString()}`)
                      .then((res) => res.json().catch(() => ({})))
                      .then((d) => {
                        if (d?.imageUrl) {
                          setDecisions((prev) => {
                            const next = new Map(prev);
                            const cur = next.get(key) ?? { action: 'create' as const };
                            next.set(key, { ...cur, imageUrl: d.imageUrl });
                            return next;
                          });
                        }
                      });
                  }
                });
              })
              .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao analisar nota.'))
              .finally(() => setLoading(false));
          }
        };
        reader.readAsText(file, 'UTF-8');
      });
    },
    [userId]
  );

  const setDecision = useCallback((key: string, patch: Partial<DecisionState>) => {
    setDecisions((prev) => {
      const next = new Map(prev);
      const cur = next.get(key) ?? { action: 'create' as const };
      next.set(key, { ...cur, ...patch });
      return next;
    });
  }, []);

  const fetchImage = useCallback(async (key: string, barcode: string | undefined, productName: string) => {
    const code = barcode ? String(barcode).replace(/\D/g, '') : '';
    const hasBarcode = code.length >= 8;
    const searchTerm = productName?.trim().slice(0, 80);
    if (!hasBarcode && !searchTerm) return;
    setFetchingImageFor(key);
    try {
      const params = new URLSearchParams();
      if (hasBarcode) params.set('barcode', code);
      if (searchTerm) params.set('search', searchTerm);
      const r = await fetch(`/api/nota/fetch-image?${params.toString()}`);
      const data = await r.json().catch(() => ({}));
      if (data?.imageUrl) {
        setDecision(key, { imageUrl: data.imageUrl });
      }
    } finally {
      setFetchingImageFor(null);
    }
  }, [setDecision]);

  const cleanImageToWhiteBg = useCallback(async (key: string, currentImageUrl: string) => {
    if (!currentImageUrl?.trim()) return;
    setCleaningImageFor(key);
    try {
      const r = await fetch('/api/nota/clean-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: currentImageUrl }),
      });
      const data = await r.json().catch(() => ({}));
      if (data?.imageUrl) {
        setDecision(key, { imageUrl: data.imageUrl });
      } else if (!r.ok) {
        alert(data?.error || 'Não foi possível deixar o fundo branco. Verifique se REMOVEBG_API_KEY está configurada.');
      }
    } finally {
      setCleaningImageFor(null);
    }
  }, [setDecision]);

  const canConciliar = previewResults.every((r) => {
    const key = itemKey(r.supplierCnpj, r.item.itemIndex);
    const d = decisions.get(key);
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
    if (!nfeGroups.length || !canConciliar) return;
    setLoading(true);
    setError('');
    try {
      for (const nfe of nfeGroups) {
        const items = nfe.items;
        const decList = items.map((item) => {
          const key = itemKey(nfe.supplierCnpj, item.itemIndex);
          const d = decisions.get(key);
          const res = previewResults.find((r) => r.supplierCnpj === nfe.supplierCnpj && r.item.itemIndex === item.itemIndex);
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
      }
      onSuccess();
      onBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao conciliar nota.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToUpload = () => {
    setStep('upload');
    setNfeGroups([]);
    setPreviewResults([]);
    setDecisions(new Map());
    setError('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
    >
      <div className="p-6 md:p-8 border-b border-slate-100">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
            title="Voltar aos produtos"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText size={24} className="text-primary" />
            Importa Nota
          </h2>
          <div className="w-10" />
        </div>
        <p className="text-slate-500 text-sm mt-2">
          Importe o XML da NF-e para cadastrar ou atualizar produtos com estoque, preço e fotos.
        </p>
      </div>

      <div className="p-6 md:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {step === 'upload' && (
          <div className="max-w-2xl space-y-6">
            <p className="text-slate-600">
              Faça o upload do arquivo XML da Nota Fiscal Eletrônica (NF-e). O sistema irá identificar os produtos e, quando possível, vincular automaticamente ao seu cadastro.
            </p>
            <label className="flex flex-col items-center justify-center w-full min-h-[280px] border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-primary/50 hover:bg-slate-50/50 transition-colors">
              <input
                type="file"
                accept=".xml,.nfe,application/xml,text/xml,*/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                disabled={loading}
              />
              {loading ? (
                <Loader2 size={56} className="text-primary animate-spin" />
              ) : (
                <>
                  <Upload size={56} className="text-slate-400 mb-3" />
                  <span className="text-slate-600 font-medium text-lg">Clique ou arraste os XMLs aqui</span>
                  <span className="text-slate-400 text-sm mt-1">Selecione um ou mais arquivos .xml</span>
                </>
              )}
            </label>
          </div>
        )}

        {step === 'preview' && nfeGroups.length > 0 && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-xl space-y-2">
              {nfeGroups.map((g) => (
                <div key={g.supplierCnpj}>
                  <p className="text-sm font-bold text-slate-700">Fornecedor: {g.supplierName}</p>
                  <p className="text-xs text-slate-500">CNPJ: {g.supplierCnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-600">
              Revise cada item. As fotos são buscadas automaticamente pelo código de barras. Use &quot;Fundo branco&quot; para deixar a foto profissional (exige chave remove.bg em .env).
            </p>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {previewResults.map((res, idx) => {
                const group = nfeGroups.find((g) => g.supplierCnpj === res.supplierCnpj);
                const fullItem = group?.items.find((i) => i.itemIndex === res.item.itemIndex) ?? res.item;
                const key = itemKey(res.supplierCnpj, res.item.itemIndex);
                const dec = decisions.get(key);
                const isMap = dec?.action === 'map';
                const qty = fullItem?.qCom ?? res.item?.qCom ?? 0;
                const unit = fullItem?.uCom ?? res.item?.uCom ?? 'UN';
                const price = fullItem?.vUnCom ?? res.item?.vUnCom ?? 0;
                return (
                  <div
                    key={key}
                    className="p-4 border border-slate-200 rounded-xl space-y-3 bg-slate-50/50"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                        {dec?.imageUrl ? (
                          <img src={dec.imageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <span className="text-slate-300"><ImagePlus size={32} /></span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Nome do produto</label>
                        <input
                          type="text"
                          value={isMap && dec?.productId ? (products.find((p) => p.id === dec.productId)?.name ?? res.item.xProd) : (dec?.customName ?? res.item.xProd)}
                          onChange={(e) => !isMap && setDecision(key, { action: 'create', customName: e.target.value })}
                          readOnly={isMap}
                          placeholder="Nome do produto"
                          className={`block w-full text-base font-medium rounded-lg border px-3 py-2 ${isMap ? 'bg-slate-50 border-slate-200 text-slate-700 cursor-default' : 'border-slate-200 text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary'}`}
                        />
                        <span className="text-xs text-slate-500 block mt-1">
                          Qtd: {qty} {unit} · Custo un: R$ {Number(price).toFixed(2).replace('.', ',')}
                          {res.fromMapping && (
                            <span className="ml-2 text-emerald-600 font-medium">✓ Mapeamento anterior</span>
                          )}
                        </span>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <button
                            type="button"
                            onClick={() => fetchImage(key, res.item.cEAN, res.item.xProd ?? '')}
                            disabled={fetchingImageFor === key || (!res.item.cEAN && !res.item.xProd?.trim())}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50"
                            title={res.item.cEAN ? 'Busca por código de barras ou nome' : 'Busca por nome do produto'}
                          >
                            {fetchingImageFor === key ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                            Buscar foto
                          </button>
                          {dec?.imageUrl && (
                            <button
                              type="button"
                              onClick={() => cleanImageToWhiteBg(key, dec.imageUrl!)}
                              disabled={cleaningImageFor === key}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
                              title="Remove o fundo e deixa branco (foto profissional)"
                            >
                              {cleaningImageFor === key ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                              Fundo branco
                            </button>
                          )}
                          <input
                            type="text"
                            value={dec?.imageUrl ?? ''}
                            onChange={(e) => setDecision(key, { imageUrl: e.target.value || undefined })}
                            placeholder="Ou cole URL da imagem"
                            className="flex-1 min-w-[160px] rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 pt-3 border-t border-slate-100">
                      <div className="flex flex-wrap gap-2 items-center">
                        <button
                          type="button"
                          onClick={() => setDecision(key, {
                            action: 'map',
                            productId: res.matchedProduct?.id,
                            priceSale: res.matchedProduct?.price_sale ?? Number(price),
                            updatePrice: false,
                          })}
                          className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            isMap ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          Vincular existente
                        </button>
                        <button
                          type="button"
                          onClick={() => setDecision(key, { action: 'create', customName: res.item.xProd, priceSale: Number(price), updatePrice: undefined })}
                          className={`px-4 py-2 rounded-lg text-sm font-medium ${
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
                              setDecision(key, {
                                action: 'map',
                                productId: pid,
                                priceSale: prod?.price_sale ?? Number(price),
                                updatePrice: false,
                              });
                            }}
                            className="rounded-lg border border-slate-200 px-4 py-2 text-sm min-w-[220px]"
                          >
                            <option value="">Selecione o produto</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        {isMap && dec?.productId && (() => {
                          const selProd = products.find((p) => p.id === dec.productId);
                          const currentPrice = selProd?.price_sale ?? res.matchedProduct?.price_sale;
                          return currentPrice != null ? (
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={dec?.updatePrice ?? false}
                                  onChange={(e) => setDecision(key, { updatePrice: e.target.checked })}
                                  className="rounded border-slate-300"
                                />
                                <span className="text-sm text-slate-600">Atualizar preço da nota</span>
                              </label>
                              {!dec?.updatePrice && (
                                <span className="text-xs text-slate-500">(mantendo R$ {Number(currentPrice).toFixed(2).replace('.', ',')})</span>
                              )}
                            </div>
                          ) : null;
                        })()}
                        <div className={isMap && dec?.productId && products.find((p) => p.id === dec.productId)?.price_sale != null && !dec?.updatePrice ? 'opacity-60' : ''}>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Preço de Venda (R$)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={dec?.priceSale ?? ''}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              setDecision(key, { priceSale: isNaN(v) ? undefined : v });
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
                            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm w-full disabled:bg-slate-50"
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
                          <div className="flex gap-6 text-sm">
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

            <div className="flex gap-4 pt-6 border-t border-slate-100 mt-6">
              <button
                type="button"
                onClick={handleBackToUpload}
                disabled={loading}
                className="px-6 py-3 rounded-xl font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConciliar}
                disabled={loading || !canConciliar}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? <Loader2 size={22} className="animate-spin" /> : <Check size={22} />}
                Conciliar Nota
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
