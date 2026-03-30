'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { BarChart3, Calendar, Loader2, RefreshCw, Store, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

const fmtMoney = (n: number) =>
  `R$ ${Number(n ?? 0).toFixed(2).replace('.', ',')}`;

const fmtPct = (n: number) =>
  `${Number(n ?? 0).toFixed(1).replace('.', ',')}%`;

type TopProduct = { product_id: number; name: string; quantity_sold: number; revenue: number };
type WeekdayRow = { weekday: number; label: string; total: number; count: number };
type Dre = {
  receita_pdv: number;
  receita_catalogo: number;
  receita_bruta: number;
  cmv_pdv?: number;
  cmv_catalogo?: number;
  cmv: number;
  lucro_bruto: number;
  despesas_operacionais: number;
  resultado_liquido: number;
};

type CatalogReport = {
  period: { from: string; to: string };
  pedidos_pagos: number;
  receita: number;
  cmv: number;
  lucro_bruto: number;
  participacao_receita_total_pct: number;
  topProducts: TopProduct[];
  salesByWeekday: WeekdayRow[];
  dailyTotals: { date: string; total: number }[];
  byWeekOfPeriod: { week: number; label: string; total: number; count: number }[];
  highlights: {
    best_weekday: WeekdayRow;
    best_day: { date: string; total: number } | null;
    best_week_of_period: { week: number; label: string; total: number; count: number } | null;
  };
};

type ReportData = {
  period: { from: string; to: string };
  topProducts: TopProduct[];
  dre: Dre;
  catalog_report?: CatalogReport;
  salesByWeekday: WeekdayRow[];
  highlights: {
    best_weekday: WeekdayRow;
    best_day: { date: string; total: number } | null;
    best_week_of_period: { week: number; label: string; total: number; count: number } | null;
  };
  dailyTotals: { date: string; total: number }[];
  byWeekOfPeriod: { week: number; label: string; total: number; count: number }[];
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

type ReportsViewProps = {
  selectedUserId?: string;
};

type ReportSectionId = 'catalog' | 'dre-detail' | 'by-week' | 'by-weekday' | 'top-products' | 'monthly';

const REPORT_TABS: { id: ReportSectionId; label: string; hint?: string }[] = [
  { id: 'catalog', label: 'Catálogo online', hint: 'Só pedidos pagos/entregues' },
  { id: 'dre-detail', label: 'DRE detalhada', hint: 'Demonstrativo completo' },
  { id: 'by-week', label: 'Vendas por semana', hint: '1ª a 5ª semana no período' },
  { id: 'by-weekday', label: 'Vendas por dia da semana', hint: 'PDV + catálogo' },
  { id: 'top-products', label: 'Produtos mais vendidos', hint: 'PDV + catálogo' },
  { id: 'monthly', label: 'Relatório por mês' },
];

export default function ReportsView({ selectedUserId }: ReportsViewProps) {
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(todayISO());
  const [month, setMonth] = useState(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`;
  });
  const [data, setData] = useState<ReportData | null>(null);
  const [monthData, setMonthData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<ReportSectionId>('catalog');

  const loadPeriod = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ from, to });
      if (selectedUserId) q.set('user_id', selectedUserId);
      const res = await fetch(`/api/reports?${q}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao carregar');
      setData(await res.json());
    } catch {
      setError('Não foi possível carregar os relatórios.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [from, to, selectedUserId]);

  const loadMonth = useCallback(async () => {
    setLoadingMonth(true);
    try {
      const q = new URLSearchParams({ month });
      if (selectedUserId) q.set('user_id', selectedUserId);
      const res = await fetch(`/api/reports?${q}`, {
        credentials: 'include',
      });
      if (res.ok) setMonthData(await res.json());
      else setMonthData(null);
    } catch {
      setMonthData(null);
    } finally {
      setLoadingMonth(false);
    }
  }, [month, selectedUserId]);

  useEffect(() => {
    loadPeriod();
  }, [loadPeriod]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  const maxWd = data
    ? Math.max(1, ...data.salesByWeekday.map((w) => w.total))
    : 1;
  const cr = data?.catalog_report;
  const maxCatWd = cr ? Math.max(1, ...cr.salesByWeekday.map((w) => w.total)) : 1;
  const maxWeekBar =
    data && data.byWeekOfPeriod.length > 0
      ? Math.max(1, ...data.byWeekOfPeriod.map((w) => w.total))
      : 1;
  const maxCatWeekBar =
    cr && cr.byWeekOfPeriod.length > 0
      ? Math.max(1, ...cr.byWeekOfPeriod.map((w) => w.total))
      : 1;
  const maxMonthWd = monthData
    ? Math.max(1, ...monthData.salesByWeekday.map((w) => w.total))
    : 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
              <BarChart3 size={22} className="text-primary" />
              Relatórios
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Vendas do PDV e pedidos pagos do catálogo online. Cadastre <strong>CMV</strong> nos produtos
              para a DRE refletir custo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              loadPeriod();
              loadMonth();
            }}
            className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold hover:bg-primary/15"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>

        <div className="p-6 border-b border-slate-100 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">De</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Até</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm"
            />
          </div>
          <button
            type="button"
            onClick={loadPeriod}
            disabled={loading}
            className="bg-primary text-white px-5 py-2 rounded-xl font-bold text-sm disabled:opacity-60"
          >
            Aplicar período
          </button>
          <button
            type="button"
            onClick={() => {
              setFrom(daysAgo(7));
              setTo(todayISO());
            }}
            className="text-sm text-primary font-semibold hover:underline"
          >
            Últimos 7 dias
          </button>
          <button
            type="button"
            onClick={() => {
              setFrom(daysAgo(30));
              setTo(todayISO());
            }}
            className="text-sm text-primary font-semibold hover:underline"
          >
            Últimos 30 dias
          </button>
        </div>

        {error && (
          <div className="mx-6 mb-4 p-4 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>
        )}

        {loading && !data ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : data ? (
          <>
            <div className="px-6 pt-4 pb-4 border-b border-slate-100 bg-slate-50/50">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                Relatórios do período
              </p>
              <div className="flex flex-wrap gap-2">
                {REPORT_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    title={tab.hint}
                    onClick={() => setActiveReport(tab.id)}
                    className={`px-3 py-2 rounded-xl text-sm font-bold border transition-colors ${
                      activeReport === tab.id
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-primary/40 hover:bg-primary/5'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 min-h-[200px]">
              {activeReport === 'catalog' && (
                <section className="space-y-8">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
                      <Store size={20} className="text-primary" />
                      Relatório do catálogo online
                    </h3>
                    <p className="text-sm text-slate-500">
                      Somente pedidos com status <strong>pago</strong> ou <strong>entregue</strong>, no
                      intervalo <strong>De / Até</strong> acima. Todos os números abaixo são{' '}
                      <strong>só do catálogo</strong> (sem PDV).
                    </p>
                  </div>

                  {!cr ? (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-900 text-sm space-y-2">
                      <p>
                        Relatório detalhado do catálogo não disponível nesta versão da API. Receita de
                        catálogo no período (consolidado):{' '}
                        <strong>{fmtMoney(data.dre.receita_catalogo)}</strong>.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                          <p className="text-xs font-bold text-slate-500 uppercase">Pedidos pagos</p>
                          <p className="text-2xl font-black text-slate-900">{cr.pedidos_pagos}</p>
                          <p className="text-[11px] text-slate-400 mt-1">Pedidos distintos no período</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                          <p className="text-xs font-bold text-slate-500 uppercase">Receita catálogo</p>
                          <p className="text-2xl font-black text-slate-900">{fmtMoney(cr.receita)}</p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {fmtPct(cr.participacao_receita_total_pct)} da receita bruta total (PDV + catálogo)
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-100">
                          <p className="text-xs font-bold text-amber-800 uppercase">CMV catálogo</p>
                          <p className="text-2xl font-black text-amber-900">{fmtMoney(cr.cmv)}</p>
                          <p className="text-[11px] text-amber-700/80 mt-1">
                            Custo dos produtos vendidos pelo canal online
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                          <p className="text-xs font-bold text-emerald-800 uppercase">Lucro bruto catálogo</p>
                          <p className="text-2xl font-black text-emerald-900">{fmtMoney(cr.lucro_bruto)}</p>
                          <p className="text-[11px] text-emerald-700/80 mt-1">Receita catálogo − CMV catálogo</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="rounded-2xl border border-slate-100 p-4 bg-white">
                          <p className="text-xs font-bold text-slate-500 uppercase mb-3">
                            Destaques (somente catálogo)
                          </p>
                          <ul className="text-sm text-slate-700 space-y-2">
                            <li>
                              <span className="text-slate-500">Melhor dia da semana:</span>{' '}
                              <strong>{cr.highlights.best_weekday?.label}</strong> —{' '}
                              {fmtMoney(cr.highlights.best_weekday?.total ?? 0)}
                            </li>
                            <li>
                              <span className="text-slate-500">Melhor dia no período:</span>{' '}
                              {cr.highlights.best_day
                                ? `${new Date(cr.highlights.best_day.date + 'T12:00:00').toLocaleDateString('pt-BR')} — ${fmtMoney(cr.highlights.best_day.total)}`
                                : '—'}
                            </li>
                            <li>
                              <span className="text-slate-500">Melhor semana do mês (1ª–5ª):</span>{' '}
                              {cr.highlights.best_week_of_period
                                ? `${cr.highlights.best_week_of_period.label} — ${fmtMoney(cr.highlights.best_week_of_period.total)}`
                                : '—'}
                            </li>
                          </ul>
                        </div>
                        <div className="rounded-2xl border border-slate-100 p-4 bg-white">
                          <p className="text-xs font-bold text-slate-500 uppercase mb-3">
                            Vendas por semana no período (catálogo)
                          </p>
                          {cr.byWeekOfPeriod.length === 0 ? (
                            <p className="text-slate-400 text-sm">Nenhuma venda no catálogo neste período.</p>
                          ) : (
                            <div className="space-y-2">
                              {cr.byWeekOfPeriod.map((w) => (
                                <div key={w.week} className="flex items-center gap-2">
                                  <span className="w-20 text-sm text-slate-600 shrink-0">{w.label}</span>
                                  <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary/70 rounded-full"
                                      style={{ width: `${(w.total / maxCatWeekBar) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-bold w-24 text-right shrink-0">
                                    {fmtMoney(w.total)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-bold text-slate-800 mb-3">
                          Por dia da semana (catálogo)
                        </p>
                        <div className="space-y-3 max-w-3xl">
                          {cr.salesByWeekday.map((w) => (
                            <div key={w.weekday} className="flex items-center gap-3">
                              <span className="w-24 text-sm font-medium text-slate-600 shrink-0">
                                {w.label}
                              </span>
                              <div className="flex-1 h-8 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary/60 rounded-full transition-all"
                                  style={{ width: `${(w.total / maxCatWd) * 100}%` }}
                                />
                              </div>
                              <span className="w-28 text-right text-sm font-bold text-slate-900 shrink-0">
                                {fmtMoney(w.total)}
                              </span>
                              <span className="w-14 text-right text-xs text-slate-400">{w.count} ped.</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-bold text-slate-800 mb-3">Receita por dia (catálogo)</p>
                        {cr.dailyTotals.length === 0 ? (
                          <p className="text-slate-400 text-sm">Sem lançamentos por dia.</p>
                        ) : (
                          <div className="overflow-x-auto rounded-xl border border-slate-100 max-h-56 overflow-y-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-slate-50 sticky top-0">
                                <tr className="text-left text-xs font-bold text-slate-500 uppercase">
                                  <th className="px-3 py-2">Data</th>
                                  <th className="px-3 py-2 text-right">Receita</th>
                                </tr>
                              </thead>
                              <tbody>
                                {cr.dailyTotals.map((d) => (
                                  <tr key={d.date} className="border-t border-slate-100">
                                    <td className="px-3 py-2 text-slate-700">
                                      {new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-3 py-2 text-right font-semibold text-primary">
                                      {fmtMoney(d.total)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-bold text-slate-800 mb-3">Produtos mais vendidos (catálogo)</p>
                        {cr.topProducts.length === 0 ? (
                          <p className="text-slate-400 text-sm py-6 text-center bg-slate-50 rounded-xl">
                            Nenhuma venda no catálogo neste período.
                          </p>
                        ) : (
                          <div className="overflow-x-auto rounded-xl border border-slate-100">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-slate-50 text-left text-xs font-bold text-slate-500 uppercase">
                                  <th className="px-4 py-3">#</th>
                                  <th className="px-4 py-3">Produto</th>
                                  <th className="px-4 py-3 text-right">Qtd</th>
                                  <th className="px-4 py-3 text-right">Receita</th>
                                </tr>
                              </thead>
                              <tbody>
                                {cr.topProducts.map((p, i) => (
                                  <tr key={p.product_id} className="border-t border-slate-100">
                                    <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                                    <td className="px-4 py-3 font-semibold text-slate-900">{p.name}</td>
                                    <td className="px-4 py-3 text-right">{p.quantity_sold}</td>
                                    <td className="px-4 py-3 text-right font-bold text-primary">
                                      {fmtMoney(p.revenue)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </section>
              )}

              {activeReport === 'dre-detail' && (
                <section className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
                      <TrendingUp size={20} className="text-primary" />
                      DRE simplificada — visão detalhada
                    </h3>
                    <p className="text-sm text-slate-500">
                      Demonstrativo do período <strong>{data.period.from}</strong> a{' '}
                      <strong>{data.period.to}</strong>. Inclui PDV e catálogo (pedidos pagos/entregues). Margens
                      abaixo usam a <strong>receita bruta</strong> como base.
                    </p>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-sm min-w-[640px]">
                      <thead>
                        <tr className="bg-slate-100 text-left text-xs font-bold text-slate-600 uppercase">
                          <th className="px-4 py-3 w-[40%]">Linha</th>
                          <th className="px-4 py-3 text-right">Valor</th>
                          <th className="px-4 py-3 text-right">% da receita bruta</th>
                          <th className="px-4 py-3">Como é calculado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr className="bg-white">
                          <td className="px-4 py-3 font-semibold text-slate-800">(+) Receita PDV</td>
                          <td className="px-4 py-3 text-right font-bold tabular-nums">
                            {fmtMoney(data.dre.receita_pdv)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 tabular-nums">
                            {data.dre.receita_bruta > 0
                              ? fmtPct((data.dre.receita_pdv / data.dre.receita_bruta) * 100)
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            Soma das vendas finalizadas no PDV.
                          </td>
                        </tr>
                        <tr className="bg-slate-50/80">
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            (+) Receita catálogo (pago/entregue)
                          </td>
                          <td className="px-4 py-3 text-right font-bold tabular-nums">
                            {fmtMoney(data.dre.receita_catalogo)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 tabular-nums">
                            {data.dre.receita_bruta > 0
                              ? fmtPct((data.dre.receita_catalogo / data.dre.receita_bruta) * 100)
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            Itens de pedidos pagos ou entregues no catálogo.
                          </td>
                        </tr>
                        <tr className="bg-primary/10 font-bold">
                          <td className="px-4 py-3 text-primary">(=) Receita bruta</td>
                          <td className="px-4 py-3 text-right text-primary tabular-nums">
                            {fmtMoney(data.dre.receita_bruta)}
                          </td>
                          <td className="px-4 py-3 text-right text-primary tabular-nums">100%</td>
                          <td className="px-4 py-3 text-slate-600 text-xs">PDV + catálogo.</td>
                        </tr>
                        {data.dre.cmv_pdv != null && data.dre.cmv_catalogo != null ? (
                          <>
                            <tr className="bg-white">
                              <td className="px-4 py-3 font-medium text-amber-900">(−) CMV PDV</td>
                              <td className="px-4 py-3 text-right font-bold text-amber-900 tabular-nums">
                                {fmtMoney(data.dre.cmv_pdv)}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-600 tabular-nums">
                                {data.dre.receita_bruta > 0
                                  ? fmtPct((data.dre.cmv_pdv / data.dre.receita_bruta) * 100)
                                  : '—'}
                              </td>
                              <td className="px-4 py-3 text-slate-500 text-xs">
                                Custo (CMV cadastrado) × qtd vendida no PDV.
                              </td>
                            </tr>
                            <tr className="bg-amber-50/50">
                              <td className="px-4 py-3 font-medium text-amber-900">(−) CMV catálogo</td>
                              <td className="px-4 py-3 text-right font-bold text-amber-900 tabular-nums">
                                {fmtMoney(data.dre.cmv_catalogo)}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-600 tabular-nums">
                                {data.dre.receita_bruta > 0
                                  ? fmtPct((data.dre.cmv_catalogo / data.dre.receita_bruta) * 100)
                                  : '—'}
                              </td>
                              <td className="px-4 py-3 text-slate-500 text-xs">
                                Custo × qtd nos pedidos pagos do catálogo.
                              </td>
                            </tr>
                            <tr className="bg-amber-100/60 font-semibold">
                              <td className="px-4 py-3 text-amber-950">(=) CMV total</td>
                              <td className="px-4 py-3 text-right tabular-nums">{fmtMoney(data.dre.cmv)}</td>
                              <td className="px-4 py-3 text-right tabular-nums">
                                {data.dre.receita_bruta > 0
                                  ? fmtPct((data.dre.cmv / data.dre.receita_bruta) * 100)
                                  : '—'}
                              </td>
                              <td className="px-4 py-3 text-slate-600 text-xs">Soma CMV PDV + catálogo.</td>
                            </tr>
                          </>
                        ) : (
                          <tr className="bg-amber-50/60">
                            <td className="px-4 py-3 font-medium text-amber-900">(−) CMV total</td>
                            <td className="px-4 py-3 text-right font-bold text-amber-900 tabular-nums">
                              {fmtMoney(data.dre.cmv)}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-600 tabular-nums">
                              {data.dre.receita_bruta > 0
                                ? fmtPct((data.dre.cmv / data.dre.receita_bruta) * 100)
                                : '—'}
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-xs">
                              PDV + catálogo. Atualize o servidor para ver CMV separado por canal.
                            </td>
                          </tr>
                        )}
                        <tr className="bg-emerald-50 font-bold">
                          <td className="px-4 py-3 text-emerald-900">(=) Lucro bruto</td>
                          <td className="px-4 py-3 text-right text-emerald-900 tabular-nums">
                            {fmtMoney(data.dre.lucro_bruto)}
                          </td>
                          <td className="px-4 py-3 text-right text-emerald-800 tabular-nums">
                            {data.dre.receita_bruta > 0
                              ? fmtPct((data.dre.lucro_bruto / data.dre.receita_bruta) * 100)
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-600 text-xs">Receita bruta − CMV total.</td>
                        </tr>
                        <tr className="bg-white">
                          <td className="px-4 py-3 text-slate-700">(−) Despesas operacionais</td>
                          <td className="px-4 py-3 text-right font-bold tabular-nums">
                            {fmtMoney(data.dre.despesas_operacionais)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500 tabular-nums">
                            {data.dre.receita_bruta > 0
                              ? fmtPct((data.dre.despesas_operacionais / data.dre.receita_bruta) * 100)
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">Em breve no sistema.</td>
                        </tr>
                        <tr className="bg-slate-900 text-white">
                          <td className="px-4 py-3 font-bold">(=) Resultado líquido</td>
                          <td className="px-4 py-3 text-right font-black text-lg tabular-nums">
                            {fmtMoney(data.dre.resultado_liquido)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-300 tabular-nums">
                            {data.dre.receita_bruta > 0
                              ? fmtPct((data.dre.resultado_liquido / data.dre.receita_bruta) * 100)
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs">
                            Lucro bruto − despesas operacionais.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p className="text-xs text-slate-400">
                    Percentuais “% da receita bruta” mostram cada linha em relação à receita bruta total do
                    período (não são margens sobre custo).
                  </p>
                </section>
              )}

              {activeReport === 'by-week' && (
                <section className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Vendas por semana (período)</h3>
                    <p className="text-sm text-slate-500">
                      Agrupamento <strong>1ª a 5ª semana do mês civil</strong> (dia 1–7 → 1ª semana, etc.),
                      somando <strong>PDV + catálogo pago</strong>. Ideal para comparar “primeiras semanas”
                      dentro do intervalo selecionado.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/15 max-w-xl">
                    <p className="text-xs font-bold text-slate-500 uppercase">Semana líder no período</p>
                    <p className="text-xl font-black text-slate-900 mt-1">
                      {data.highlights.best_week_of_period
                        ? `${data.highlights.best_week_of_period.label} — ${fmtMoney(data.highlights.best_week_of_period.total)} (${data.highlights.best_week_of_period.count} vendas)`
                        : 'Sem vendas no período'}
                    </p>
                  </div>
                  {data.byWeekOfPeriod.length === 0 ? (
                    <p className="text-slate-400 text-sm py-8 text-center bg-slate-50 rounded-2xl">
                      Nenhuma venda no período.
                    </p>
                  ) : (
                    <div className="space-y-4 max-w-3xl">
                      {data.byWeekOfPeriod.map((w) => (
                        <div key={w.week} className="flex items-center gap-3">
                          <span className="w-24 text-sm font-semibold text-slate-700 shrink-0">{w.label}</span>
                          <div className="flex-1 h-9 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${(w.total / maxWeekBar) * 100}%` }}
                            />
                          </div>
                          <div className="text-right shrink-0 w-36">
                            <p className="font-bold text-slate-900">{fmtMoney(w.total)}</p>
                            <p className="text-[11px] text-slate-400">{w.count} vendas</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {activeReport === 'by-weekday' && (
                <section>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    Vendas por dia da semana (período)
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Soma de <strong>PDV + catálogo pago</strong>. Melhor dia:{' '}
                    <strong className="text-primary">{data.highlights.best_weekday?.label}</strong> —{' '}
                    {fmtMoney(data.highlights.best_weekday?.total ?? 0)}.
                  </p>
                  <div className="space-y-3 max-w-3xl">
                    {data.salesByWeekday.map((w) => (
                      <div key={w.weekday} className="flex items-center gap-3">
                        <span className="w-24 text-sm font-medium text-slate-600 shrink-0">{w.label}</span>
                        <div className="flex-1 h-8 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${(w.total / maxWd) * 100}%` }}
                          />
                        </div>
                        <span className="w-28 text-right text-sm font-bold text-slate-900 shrink-0">
                          {fmtMoney(w.total)}
                        </span>
                        <span className="w-16 text-right text-xs text-slate-400">{w.count} vendas</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {activeReport === 'top-products' && (
                <section>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Produtos mais vendidos</h3>
                  {data.topProducts.length === 0 ? (
                    <p className="text-slate-500 text-sm py-8 text-center bg-slate-50 rounded-2xl">
                      Nenhuma venda no período. Finalize vendas no <strong>PDV</strong> ou aguarde pedidos
                      pagos no catálogo.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 text-left text-xs font-bold text-slate-500 uppercase">
                            <th className="px-4 py-3">#</th>
                            <th className="px-4 py-3">Produto</th>
                            <th className="px-4 py-3 text-right">Qtd</th>
                            <th className="px-4 py-3 text-right">Receita</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.topProducts.map((p, i) => (
                            <tr key={p.product_id} className="border-t border-slate-100">
                              <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                              <td className="px-4 py-3 font-semibold text-slate-900">{p.name}</td>
                              <td className="px-4 py-3 text-right">{p.quantity_sold}</td>
                              <td className="px-4 py-3 text-right font-bold text-primary">
                                {fmtMoney(p.revenue)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )}

              {activeReport === 'weekday-period' && (
                <section>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    Vendas por dia da semana (período selecionado)
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Soma de PDV + catálogo pago. Destaque:{' '}
                    <strong className="text-primary">{data.highlights.best_weekday?.label}</strong> com{' '}
                    {fmtMoney(data.highlights.best_weekday?.total ?? 0)}
                  </p>
                  <div className="space-y-3 max-w-3xl">
                    {data.salesByWeekday.map((w) => (
                      <div key={w.weekday} className="flex items-center gap-3">
                        <span className="w-24 text-sm font-medium text-slate-600 shrink-0">{w.label}</span>
                        <div className="flex-1 h-8 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${(w.total / maxWd) * 100}%` }}
                          />
                        </div>
                        <span className="w-28 text-right text-sm font-bold text-slate-900 shrink-0">
                          {fmtMoney(w.total)}
                        </span>
                        <span className="w-16 text-right text-xs text-slate-400">{w.count} vendas</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {activeReport === 'monthly' && (
                <section className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Calendar size={20} className="text-primary" />
                      Relatório por mês
                    </h3>
                    <input
                      type="month"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium"
                    />
                  </div>
                  {loadingMonth && !monthData ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : monthData ? (
                    <div className="space-y-8">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/15">
                          <p className="text-xs font-bold text-slate-500 uppercase">
                            Semana do mês com mais vendas
                          </p>
                          <p className="text-xl font-black text-slate-900 mt-1">
                            {monthData.highlights.best_week_of_period
                              ? `${monthData.highlights.best_week_of_period.label} — ${fmtMoney(monthData.highlights.best_week_of_period.total)}`
                              : 'Sem dados no mês'}
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                          <p className="text-xs font-bold text-slate-500 uppercase">
                            Dia do mês com mais vendas
                          </p>
                          <p className="text-xl font-black text-slate-900 mt-1">
                            {monthData.highlights.best_day
                              ? `${new Date(monthData.highlights.best_day.date + 'T12:00:00').toLocaleDateString('pt-BR')} — ${fmtMoney(monthData.highlights.best_day.total)}`
                              : 'Sem dados no mês'}
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 sm:col-span-2">
                          <p className="text-xs font-bold text-slate-500 uppercase">
                            Dia da semana que mais vendeu no mês
                          </p>
                          <p className="text-xl font-black text-primary mt-1">
                            {monthData.highlights.best_weekday?.label} —{' '}
                            {fmtMoney(monthData.highlights.best_weekday?.total ?? 0)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-bold text-slate-700 mb-3">
                          Por semana dentro do mês (1ª a 5ª)
                        </p>
                        <div className="space-y-2">
                          {monthData.byWeekOfPeriod.length === 0 ? (
                            <p className="text-slate-400 text-sm">Nenhuma venda neste mês.</p>
                          ) : (
                            monthData.byWeekOfPeriod.map((w) => (
                              <div
                                key={w.week}
                                className="flex justify-between items-center py-2 border-b border-slate-100"
                              >
                                <span className="font-medium text-slate-700">{w.label}</span>
                                <span className="font-bold text-primary">{fmtMoney(w.total)}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-bold text-slate-700 mb-3">Dia da semana no mês</p>
                        <div className="space-y-3 max-w-3xl">
                          {monthData.salesByWeekday.map((w) => (
                            <div key={w.weekday} className="flex items-center gap-3">
                              <span className="w-24 text-sm font-medium text-slate-600 shrink-0">
                                {w.label}
                              </span>
                              <div className="flex-1 h-7 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${(w.total / maxMonthWd) * 100}%` }}
                                />
                              </div>
                              <span className="w-28 text-right text-sm font-bold">{fmtMoney(w.total)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">Não foi possível carregar o mês selecionado.</p>
                  )}
                </section>
              )}
            </div>
          </>
        ) : null}
      </div>
    </motion.div>
  );
}
