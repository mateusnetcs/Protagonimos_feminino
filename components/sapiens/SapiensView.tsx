'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Download, ExternalLink, Loader2, Maximize2, RefreshCw, X } from 'lucide-react';
import type { BannerContent, BannerVersion } from '@/lib/sapiens-content';
import type { SapiensStats } from '@/lib/sapiens-stats';
import BannerPreview from './BannerPreview';

type ApiData = { stats: SapiensStats; banner: BannerContent };

const VERSIONS: { id: BannerVersion; label: string; hint: string }[] = [
  { id: 'v1', label: 'Versão 1', hint: 'Duas colunas, como o template original' },
  { id: 'v2', label: 'Versão 2', hint: 'Resultados em faixa horizontal com dois gráficos' },
];

/**
 * Banner IX SAPIENS: prévia das duas versões + downloads.
 * Usado na aba "Sapiens" do painel e na página pública /sapiens/banner (publicMode).
 */
export default function SapiensView({ publicMode = false }: { publicMode?: boolean }) {
  const [data, setData] = useState<ApiData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [version, setVersion] = useState<BannerVersion>('v2');

  const fetchData = useCallback(
    () =>
      fetch('/api/sapiens', { cache: 'no-store' })
        .then((res) => {
          if (!res.ok) throw new Error('Falha ao carregar');
          return res.json() as Promise<ApiData>;
        })
        .then((json) => {
          setData(json);
          setError(null);
        })
        .catch(() => setError('Não foi possível carregar os dados do banner.'))
        .finally(() => setLoading(false)),
    []
  );

  /** Recarregar manualmente (botões). */
  const load = useCallback(() => {
    setLoading(true);
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/sapiens', { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('Falha ao carregar');
        return res.json() as Promise<ApiData>;
      })
      .then((json) => !cancelled && setData(json))
      .catch(() => !cancelled && setError('Não foi possível carregar os dados do banner.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const copyLink = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.banner.qr.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard indisponível */
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <Loader2 className="animate-spin mr-2" /> Carregando banner…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center">
        <p className="text-red-600 font-semibold">{error}</p>
        <button onClick={load} className="mt-4 rounded-xl bg-[#f48c25] px-4 py-2 font-bold text-white">
          Tentar novamente
        </button>
      </div>
    );
  }

  const { banner, stats } = data;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        <div className="mx-auto max-w-[900px]">
          <div
            role="tablist"
            aria-label="Versão do banner"
            className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-white p-1.5 shadow-sm border border-slate-100"
          >
            {VERSIONS.map((v) => (
              <button
                key={v.id}
                role="tab"
                aria-selected={version === v.id}
                onClick={() => setVersion(v.id)}
                className={`rounded-xl px-3 py-2 text-left transition-colors ${
                  version === v.id ? 'bg-[#0435da] text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="block font-bold">{v.label}</span>
                <span className={`block text-xs ${version === v.id ? 'text-white/80' : 'text-slate-400'}`}>
                  {v.hint}
                </span>
              </button>
            ))}
          </div>
          <BannerPreview banner={banner} version={version} />
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-4 self-start">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Banner IX SAPIENS</h2>
          <p className="mt-1 text-sm text-slate-500">
            Template oficial 90 × 120 cm, com a fonte original, preenchido com os dados reais do projeto.
          </p>
          <div className="mt-4 grid gap-2">
            {VERSIONS.map((v) => (
              <a
                key={v.id}
                href={banner.downloads[v.id]}
                download
                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-bold ${
                  v.id === version
                    ? 'bg-[#f48c25] text-white hover:brightness-105'
                    : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Download size={18} /> Baixar {v.label} (.pptx)
              </a>
            ))}
            <button
              onClick={() => setFullscreen(true)}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 font-bold text-slate-700 hover:bg-slate-50"
            >
              <Maximize2 size={18} /> Ver em tela cheia
            </button>
            {!publicMode && (
              <button
                onClick={load}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 font-bold text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Atualizar números
              </button>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-900">Relatório do QR Code</h3>
          <p className="mt-1 text-sm text-slate-500">Página pública, sem login, aberta por quem escanear o banner.</p>
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs font-mono text-slate-700 break-all">
            {banner.qr.url}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a
              href="/sapiens"
              target={publicMode ? undefined : '_blank'}
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[#0435da] px-3 py-2 text-sm font-bold text-white"
            >
              <ExternalLink size={16} /> Abrir
            </a>
            <button
              onClick={copyLink}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copiado' : 'Copiar link'}
            </button>
          </div>
        </div>

        {!publicMode && (
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900">Indicadores usados</h3>
            <dl className="mt-3 space-y-1.5 text-sm">
              {[
                ['Mulheres participantes', stats.participantes],
                ['Produtos cadastrados', stats.produtos],
                ['Artes geradas por IA', stats.imagensIa],
                ['Vendas no PDV', stats.vendasPdv],
                ['Pedidos on-line pagos', stats.pedidosOnlinePagos],
                ['Diagnósticos respondidos', stats.diagnosticos],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="font-bold tabular-nums text-slate-900">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-slate-400">
              Só contas de participantes; contas de administração, de teste e a conta restrita não entram. Página
              pública do banner: <code>/sapiens/banner</code>.
            </p>
          </div>
        )}
      </aside>

      {fullscreen && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/90 p-4" onClick={() => setFullscreen(false)}>
          <button
            aria-label="Fechar"
            className="fixed right-4 top-4 z-10 rounded-full bg-white p-2 shadow"
            onClick={() => setFullscreen(false)}
          >
            <X size={20} />
          </button>
          <div className="mx-auto max-w-[1100px]" onClick={(e) => e.stopPropagation()}>
            <BannerPreview banner={banner} version={version} />
          </div>
        </div>
      )}
    </div>
  );
}
