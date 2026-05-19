'use client';

import React, { useEffect, useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';

type Product = {
  id: string;
  name: string;
  category?: string;
  description?: string;
  price_sale?: number;
  image_url?: string;
};

const formatPrice = (v: number) =>
  `R$ ${Number(v ?? 0).toFixed(2).replace('.', ',')}`;

type Props = {
  products: Product[];
  productsLoading: boolean;
  onRefreshProducts: () => void;
};

export default function PostGeneratorView({
  products,
  productsLoading,
  onRefreshProducts,
}: Props) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    caption: string;
    imageUrl?: string;
    imageUrls?: string[];
    variantNames?: string[];
    imageError?: string;
    jobid?: string;
    jobids?: string[];
  } | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [pollingSeconds, setPollingSeconds] = useState(0);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [includeFrase, setIncludeFrase] = useState(true);
  const [includePreco, setIncludePreco] = useState(true);
  const [includeNome, setIncludeNome] = useState(true);
  const [lastVariantIds, setLastVariantIds] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedProduct) {
      setResult(null);
      setSelectedImageIndex(0);
      setSaveStatus('idle');
      setLastVariantIds([]);
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (!result?.jobid || result.imageUrl) return;
    const t = setInterval(() => setPollingSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [result?.jobid, result?.imageUrl]);

  const displayImageUrl = result?.imageUrls?.length
    ? result.imageUrls[selectedImageIndex] ?? result.imageUrls[0]
    : result?.imageUrl;

  const saveAllToGallery = async (payload: {
    caption: string;
    imageUrls: string[];
    product_id?: string;
    product_name?: string;
  }) => {
    const urls = payload.imageUrls?.filter(Boolean) ?? [];
    if (urls.length === 0) return;
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/post/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          product_id: payload.product_id,
          product_name: payload.product_name,
          caption: payload.caption,
          image_url: urls[0],
          image_urls: urls,
        }),
      });
      if (res.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    }
  };

  const pollImageStatus = async (ids: string[]) => {
    const intervalMs = 10000; // 10 segundos entre cada verificação (Dreamina demora 15-120s)
    const maxAttempts = 24; // ~4 minutos máximo
    const query =
      ids.length > 1
        ? `jobids=${ids.map((id) => encodeURIComponent(id)).join(',')}`
        : `jobid=${encodeURIComponent(ids[0])}`;
    for (let i = 0; i < maxAttempts; i++) {
      const res = await fetch(`/api/post/image-status?${query}`);
      const data = await res.json();
      if (String(data.status).toLowerCase() === 'completed' && (data.imageUrl || data.imageUrls?.length)) {
        const urls = data.imageUrls || (data.imageUrl ? [data.imageUrl] : []);
        const product = selectedProduct;
        setResult((r) => {
          if (r && product && urls.length > 0) {
            saveAllToGallery({
              caption: r.caption,
              imageUrls: urls,
              product_id: product.id,
              product_name: product.name,
            });
            return { ...r, imageUrl: urls[0], imageUrls: urls };
          }
          return r ? { ...r, imageUrl: urls[0], imageUrls: urls } : null;
        });
        setSelectedImageIndex(0);
        setPollingSeconds(0);
        return;
      }
      if (String(data.status).toLowerCase() === 'failed') {
        setResult((r) => (r ? { ...r, imageError: data.error || 'Falha ao gerar imagem' } : null));
        setPollingSeconds(0);
        return;
      }
      setPollingSeconds((s) => s + intervalMs / 1000);
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    setResult((r) => (r ? { ...r, imageError: 'Timeout após 4 min. Tente novamente.' } : null));
    setPollingSeconds(0);
  };

  const handleGenerate = async () => {
    if (!selectedProduct) return;
    if (!selectedProduct.image_url?.trim()) {
      setError('Este produto não tem foto. Cadastre uma imagem na aba Produtos antes de gerar o post.');
      return;
    }
    setError('');
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch('/api/post/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          include_frase: includeFrase,
          include_preco: includePreco,
          include_nome: includeNome,
          exclude_variant_ids: lastVariantIds.length > 0 ? lastVariantIds : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar');
      const imageUrls = data.imageUrls?.length
        ? data.imageUrls
        : data.imageUrl
          ? [data.imageUrl]
          : [];
      if (imageUrls.length > 0) {
        saveAllToGallery({
          caption: data.caption,
          imageUrls,
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
        });
      }
      const urlsFromApi = data.imageUrls?.length
        ? data.imageUrls
        : data.imageUrl
          ? [data.imageUrl]
          : [];
      if (Array.isArray(data.variantIds) && data.variantIds.length > 0) {
        setLastVariantIds(data.variantIds);
      }
      setResult({
        caption: data.caption,
        imageUrl: urlsFromApi[0] ?? data.imageUrl ?? undefined,
        imageUrls: urlsFromApi.length > 0 ? urlsFromApi : undefined,
        variantNames: Array.isArray(data.variantNames) ? data.variantNames : undefined,
        imageError: data.imageError,
        jobid: data.jobid,
        jobids: data.jobids,
      });
      const pollIds = data.jobids?.length ? data.jobids : data.jobid ? [data.jobid] : [];
      if (pollIds.length > 0 && urlsFromApi.length === 0) pollImageStatus(pollIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar post');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ImagePlus size={22} className="text-primary" />
            Gerar post com IA
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Usa a foto do produto e gera 2 artes com estilos diferentes a cada clique. Gerar de novo traz layouts novos — salvas automaticamente na galeria.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Selecione o produto
            </label>
            {productsLoading ? (
              <div className="flex items-center gap-2 text-slate-500 py-4">
                <Loader2 size={20} className="animate-spin" />
                Carregando produtos...
              </div>
            ) : products.length === 0 ? (
              <p className="text-slate-500 py-4">Nenhum produto cadastrado. Cadastre na aba Produtos.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 max-w-5xl">
                {products.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProduct(p)}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                      selectedProduct?.id === p.id
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="h-28 sm:h-32 bg-slate-100 rounded-lg overflow-hidden mb-2 flex items-center justify-center p-1.5">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt=""
                          className="max-w-full max-h-full w-auto h-auto object-contain"
                        />
                      ) : (
                        <div className="flex items-center justify-center text-slate-400">
                          <ImagePlus size={24} />
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">{p.name}</p>
                    <p className="text-xs text-primary font-semibold mt-0.5">
                      {formatPrice(Number(p.price_sale ?? 0))}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedProduct && (
            <>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                <p className="text-sm font-semibold text-slate-700">
                  O que incluir na imagem do post
                </p>
                <p className="text-xs text-slate-500 -mt-1">
                  A arte é criada em cima da foto do produto (à direita). Marque o que deve aparecer no layout.
                </p>
                {selectedProduct.image_url ? (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                    <img
                      src={selectedProduct.image_url}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover shrink-0"
                    />
                    <p className="text-xs text-slate-600">
                      Esta é a foto que será preservada na geração — a IA só adiciona o design de anúncio ao redor.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    Este produto não tem foto. Cadastre uma na aba Produtos para gerar o post.
                  </p>
                )}
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeFrase}
                      onChange={(e) => setIncludeFrase(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-slate-700">Frase sobre o produto</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includePreco}
                      onChange={(e) => setIncludePreco(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-slate-700">Preço do produto</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeNome}
                      onChange={(e) => setIncludeNome(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-slate-700">Nome do produto</span>
                  </label>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating || !selectedProduct.image_url?.trim()}
                className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 disabled:opacity-70"
              >
                {generating ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Gerando 2 artes...
                  </>
                ) : (
                  <>
                    <ImagePlus size={20} />
                    Gerar post com IA
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => { setSelectedProduct(null); setResult(null); }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
              >
                Limpar
              </button>
            </div>
            </>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
              <h3 className="font-bold text-slate-900">Post gerado</h3>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600 mb-2">Legenda (IA)</p>
                  <div className="p-4 bg-white rounded-xl border border-slate-200">
                    <p className="text-slate-800 whitespace-pre-wrap">{result.caption}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(result.caption)}
                    className="mt-2 text-sm text-primary font-semibold hover:underline"
                  >
                    Copiar legenda
                  </button>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600 mb-2">Imagem</p>
                  {displayImageUrl ? (
                    <div className="space-y-3">
                      {result.imageUrls && result.imageUrls.length > 1 && (
                        <p className="text-xs text-slate-500">
                          {result.imageUrls.length} designs gerados — clique na miniatura para escolher
                          {result.variantNames?.length ? (
                            <span className="block mt-0.5">
                              Estilos: {result.variantNames.join(' · ')}
                            </span>
                          ) : null}
                        </p>
                      )}
                      <div className="flex flex-col gap-3">
                        <img
                          src={displayImageUrl}
                          alt="Post gerado"
                          className="max-w-full max-h-64 object-contain rounded-xl border-2 border-primary/30 bg-white cursor-pointer hover:border-primary/60 transition-colors"
                        />
                        {result.imageUrls && result.imageUrls.length > 1 && (
                          <div className="flex flex-wrap gap-2">
                            {result.imageUrls.map((url, i) => (
                              <button
                                key={i}
                                type="button"
                                title={result.variantNames?.[i] ?? `Opção ${i + 1}`}
                                onClick={() => setSelectedImageIndex(i)}
                                className={`w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                                  selectedImageIndex === i
                                    ? 'border-primary ring-2 ring-primary/30'
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <img src={url} alt={`Opção ${i + 1}`} className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-3">
                          <a
                            href={displayImageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary font-semibold hover:underline"
                          >
                            Abrir imagem
                          </a>
                          {saveStatus === 'saved' ? (
                            <span className="text-sm text-green-600 font-medium">✓ Salvo na galeria!</span>
                          ) : saveStatus === 'saving' ? (
                            <span className="text-sm text-slate-500">Salvando automaticamente...</span>
                          ) : saveStatus === 'error' ? (
                            <span className="text-sm text-amber-600">Erro ao salvar na galeria</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : result.jobid ? (
                    <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-slate-500">
                      <Loader2 size={32} className="mx-auto mb-2 animate-spin" />
                      <p>Gerando 2 designs diferentes com a foto do produto (pode levar 1–2 min)...</p>
                      <p className="text-sm mt-1 text-slate-400">
                        Aguardando há {pollingSeconds}s (pode levar 1–3 min, verificando a cada 10s)
                      </p>
                    </div>
                  ) : result.imageError ? (
                    <div className="p-6 bg-red-50 rounded-xl border border-red-100 text-center">
                      <p className="text-sm font-semibold text-red-800 mb-1">Não foi possível gerar a imagem</p>
                      <p className="text-sm text-red-700">{result.imageError}</p>
                      <p className="text-xs text-red-600 mt-2">
                        Verifique OPENAI_API_KEY e créditos em platform.openai.com
                      </p>
                    </div>
                  ) : (
                    <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-slate-500 text-sm">
                      Imagem não gerada. Tente novamente.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
