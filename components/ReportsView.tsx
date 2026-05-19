'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { BarChart3, Loader2, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

const fmtMoney = (n: number) => `R$ ${Number(n ?? 0).toFixed(2).replace('.', ',')}`;

type TopProduct = { product_id: number; name: string; quantity_sold: number; revenue: number };
type WeekdayRow = { weekday: number; label: string; total: number; count: number };
type Dre = {
  receita_pdv: number;
  receita_catalogo: number;
  receita_bruta: number;
  cmv: number;
  lucro_bruto: number;
};

type CatalogReport = {
  pedidos_pagos: number;
  receita: number;
  cmv: number;
  lucro_bruto: number;
  topProducts: TopProduct[];
  salesByWeekday: WeekdayRow[];
  highlights: {
    best_weekday: WeekdayRow;
    best_day: { date: string; total: number } | null;
  };
};

type ReportData = {
  period: { from: string; to: string };
  topProducts: TopProduct[];
  dre: Dre;
  catalog_report?: CatalogReport;
  salesByWeekday: WeekdayRow[];
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function formatDateBR(value: unknown): string {
  if (value == null || value === '') return '—';
  const raw = typeof value === 'string' ? value : String(value);
  const iso = raw.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR');
}

function formatPeriodBR(from: string, to: string) {
  return `${formatDateBR(from)} a ${formatDateBR(to)}`;
}

type ReportsViewProps = {
  selectedUserId?: string;
};

type TabId = 'overview' | 'catalog' | 'products';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'catalog', label: 'Catálogo online' },
  { id: 'products', label: 'Produtos' },
];

function StatCard({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'neutral' | 'green' | 'amber' | 'primary';
}) {
  const tones = {
    neutral: 'bg-white border-slate-100',
    green: 'bg-emerald-50 border-emerald-100',
    amber: 'bg-amber-50 border-amber-100',
    primary: 'bg-primary/5 border-primary/20',
  };
  return (
    <motion.div
      layout
      className={`p-5 rounded-2xl border ${tones[tone]}`}
    >
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </motion.div>
  );
}

function BarList({
  items,
  max,
}: {
  items: { label: string; total: number; sub?: string }[];
  max: number;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400 py-4 text-center">Sem vendas neste período.</p>;
  }
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="w-20 text-sm font-medium text-slate-600 shrink-0">{item.label}</span>
          <motion.div layout className="flex-1 h-7 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              layout
              className="h-full bg-primary rounded-full"
              style={{ width: `${max > 0 ? (item.total / max) * 100 : 0}%` }}
            />
          </motion.div>
          <div className="text-right shrink-0 min-w-[5.5rem]">
            <p className="text-sm font-bold text-slate-900">{fmtMoney(item.total)}</p>
            {item.sub && <p className="text-[10px] text-slate-400">{item.sub}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductTable({ rows }: { rows: TopProduct[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-slate-500 text-center py-8 bg-slate-50 rounded-xl">
        Nenhuma venda no período.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-left text-xs font-bold text-slate-500 uppercase">
            <th className="px-4 py-3">Produto</th>
            <th className="px-4 py-3 text-right">Qtd</th>
            <th className="px-4 py-3 text-right">Receita</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.product_id} className="border-t border-slate-100">
              <td className="px-4 py-3 font-semibold text-slate-900">{p.name}</td>
              <td className="px-4 py-3 text-right text-slate-600">{p.quantity_sold}</td>
              <td className="px-4 py-3 text-right font-bold text-primary">{fmtMoney(p.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ReportsView({ selectedUserId }: ReportsViewProps) {
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(todayISO());
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

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

  useEffect(() => {
    loadPeriod();
  }, [loadPeriod]);

  const cr = data?.catalog_report;
  const maxWd = data ? Math.max(1, ...data.salesByWeekday.map((w) => w.total)) : 1;
  const maxCatWd = cr ? Math.max(1, ...cr.salesByWeekday.map((w) => w.total)) : 1;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Cabeçalho */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 size={22} className="text-primary" />
              Relatórios
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Resumo das vendas no PDV e no catálogo online (pedidos pagos).
            </p>
          </div>
          <button
            type="button"
            onClick={loadPeriod}
            className="flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:opacity-90"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>

        {/* Filtro de período */}
        <motion.div layout className="p-5 border-b border-slate-100 flex flex-wrap items-end gap-3 bg-slate-50/80">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">De</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Até</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setFrom(daysAgo(7));
              setTo(todayISO());
            }}
            className="text-sm text-primary font-semibold px-2 py-2"
          >
            7 dias
          </button>
          <button
            type="button"
            onClick={() => {
              setFrom(daysAgo(30));
              setTo(todayISO());
            }}
            className="text-sm text-primary font-semibold px-2 py-2"
          >
            30 dias
          </button>
          {data && (
            <p className="text-xs text-slate-500 w-full md:w-auto md:ml-auto">
              Período: <strong>{formatPeriodBR(data.period.from, data.period.to)}</strong>
            </p>
          )}
        </motion.div>

        {error && <div className="mx-5 mt-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}

        {loading && !data ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-9 h-9 animate-spin text-primary" />
          </div>
        ) : data ? (
          <>
            {/* Cards principais — sempre visíveis */}
            <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 border-b border-slate-100">
              <StatCard label="Faturamento total" value={fmtMoney(data.dre.receita_bruta)} tone="primary" />
              <StatCard label="Vendas no PDV" value={fmtMoney(data.dre.receita_pdv)} />
              <StatCard
                label="Catálogo online"
                value={fmtMoney(data.dre.receita_catalogo)}
                hint={cr ? `${cr.pedidos_pagos} pedido(s) pago(s)` : undefined}
              />
              <StatCard label="Lucro bruto" value={fmtMoney(data.dre.lucro_bruto)} hint="Receita − CMV" tone="green" />
            </div>

            {/* Abas */}
            <div className="px-5 pt-4 flex flex-wrap gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-5">
              {activeTab === 'overview' && (
                <div className="space-y-6 max-w-2xl">
                  <section className="rounded-xl border border-slate-100 p-5">
                    <h3 className="font-bold text-slate-900 mb-4">Resumo financeiro</h3>
                    <dl className="space-y-3 text-sm">
                      <motion.div layout className="flex justify-between gap-4">
                        <dt className="text-slate-600">Receita PDV</dt>
                        <dd className="font-bold">{fmtMoney(data.dre.receita_pdv)}</dd>
                      </motion.div>
                      <motion.div layout className="flex justify-between gap-4">
                        <dt className="text-slate-600">Receita catálogo</dt>
                        <dd className="font-bold">{fmtMoney(data.dre.receita_catalogo)}</dd>
                      </motion.div>
                      <motion.div layout className="flex justify-between gap-4 border-t border-slate-100 pt-3">
                        <dt className="font-semibold text-slate-800">Receita total</dt>
                        <dd className="font-black text-primary">{fmtMoney(data.dre.receita_bruta)}</dd>
                      </motion.div>
                      <motion.div layout className="flex justify-between gap-4">
                        <dt className="text-slate-600">Custo dos produtos (CMV)</dt>
                        <dd className="font-bold text-amber-800">− {fmtMoney(data.dre.cmv)}</dd>
                      </motion.div>
                      <motion.div layout className="flex justify-between gap-4 border-t border-emerald-100 pt-3 bg-emerald-50/50 -mx-2 px-2 py-2 rounded-lg">
                        <dt className="font-semibold text-emerald-900">Lucro bruto</dt>
                        <dd className="font-black text-emerald-800">{fmtMoney(data.dre.lucro_bruto)}</dd>
                      </motion.div>
                    </dl>
                  </section>

                  <section>
                    <h3 className="font-bold text-slate-900 mb-3">Vendas por dia da semana</h3>
                    <p className="text-xs text-slate-500 mb-3">PDV + catálogo no período</p>
                    <BarList
                      max={maxWd}
                      items={data.salesByWeekday.map((w) => ({
                        label: w.label,
                        total: w.total,
                        sub: `${w.count} venda(s)`,
                      }))}
                    />
                  </section>
                </div>
              )}

              {activeTab === 'catalog' && (
                <motion.div layout className="space-y-6">
                  {!cr ? (
                    <p className="text-sm text-slate-500">
                      Receita do catálogo no período: <strong>{fmtMoney(data.dre.receita_catalogo)}</strong>
                    </p>
                  ) : (
                    <>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard label="Pedidos pagos" value={String(cr.pedidos_pagos)} />
                        <StatCard label="Receita" value={fmtMoney(cr.receita)} tone="primary" />
                        <StatCard label="CMV" value={fmtMoney(cr.cmv)} tone="amber" />
                        <StatCard label="Lucro" value={fmtMoney(cr.lucro_bruto)} tone="green" />
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <section className="rounded-xl border border-slate-100 p-4">
                          <h3 className="font-bold text-slate-900 mb-3 text-sm">Destaques</h3>
                          <ul className="text-sm text-slate-700 space-y-2">
                            <li>
                              Melhor dia da semana:{' '}
                              <strong>{cr.highlights.best_weekday?.label || '—'}</strong> (
                              {fmtMoney(cr.highlights.best_weekday?.total ?? 0)})
                            </li>
                            <li>
                              Melhor dia do período:{' '}
                              <strong>
                                {cr.highlights.best_day
                                  ? formatDateBR(cr.highlights.best_day.date)
                                  : '—'}
                              </strong>
                              {cr.highlights.best_day
                                ? ` — ${fmtMoney(cr.highlights.best_day.total)}`
                                : ''}
                            </li>
                          </ul>
                        </section>
                        <section className="rounded-xl border border-slate-100 p-4">
                          <h3 className="font-bold text-slate-900 mb-3 text-sm">Por dia da semana</h3>
                          <BarList
                            max={maxCatWd}
                            items={cr.salesByWeekday.map((w) => ({
                              label: w.label,
                              total: w.total,
                              sub: `${w.count} ped.`,
                            }))}
                          />
                        </section>
                      </div>

                      <section>
                        <h3 className="font-bold text-slate-900 mb-3">Produtos mais vendidos no catálogo</h3>
                        <ProductTable rows={cr.topProducts} />
                      </section>
                    </>
                  )}
                </motion.div>
              )}

              {activeTab === 'products' && (
                <section>
                  <h3 className="font-bold text-slate-900 mb-1">Ranking de produtos</h3>
                  <p className="text-sm text-slate-500 mb-4">PDV + catálogo no período selecionado</p>
                  <ProductTable rows={data.topProducts} />
                </section>
              )}
            </div>
          </>
        ) : null}
      </div>
    </motion.div>
  );
}
