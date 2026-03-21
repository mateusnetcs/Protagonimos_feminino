'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { BarChart3, Calendar, Loader2, RefreshCw, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

const fmtMoney = (n: number) =>
  `R$ ${Number(n ?? 0).toFixed(2).replace('.', ',')}`;

type TopProduct = { product_id: number; name: string; quantity_sold: number; revenue: number };
type WeekdayRow = { weekday: number; label: string; total: number; count: number };
type Dre = {
  receita_pdv: number;
  receita_catalogo: number;
  receita_bruta: number;
  cmv: number;
  lucro_bruto: number;
  despesas_operacionais: number;
  resultado_liquido: number;
};

type ReportData = {
  period: { from: string; to: string };
  topProducts: TopProduct[];
  dre: Dre;
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
          <div className="p-6 space-y-10">
            {/* DRE */}
            <section>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                <TrendingUp size={20} className="text-primary" />
                DRE simplificada (período)
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase">Receita PDV</p>
                  <p className="text-2xl font-black text-slate-900">{fmtMoney(data.dre.receita_pdv)}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase">Receita catálogo (pago)</p>
                  <p className="text-2xl font-black text-slate-900">
                    {fmtMoney(data.dre.receita_catalogo)}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                  <p className="text-xs font-bold text-primary uppercase">Receita bruta</p>
                  <p className="text-2xl font-black text-primary">{fmtMoney(data.dre.receita_bruta)}</p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                  <p className="text-xs font-bold text-amber-800 uppercase">(-) CMV</p>
                  <p className="text-xl font-black text-amber-900">{fmtMoney(data.dre.cmv)}</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-800 uppercase">Lucro bruto</p>
                  <p className="text-xl font-black text-emerald-900">{fmtMoney(data.dre.lucro_bruto)}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200">
                  <p className="text-xs font-bold text-slate-600 uppercase">(-) Despesas operacionais</p>
                  <p className="text-lg font-bold text-slate-700">
                    {fmtMoney(data.dre.despesas_operacionais)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">Em breve: cadastro de despesas</p>
                </div>
                <div className="sm:col-span-2 lg:col-span-3 p-4 rounded-2xl bg-slate-900 text-white">
                  <p className="text-xs font-bold text-slate-400 uppercase">Resultado líquido</p>
                  <p className="text-3xl font-black">{fmtMoney(data.dre.resultado_liquido)}</p>
                </div>
              </div>
            </section>

            {/* Produtos mais vendidos */}
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

            {/* Dia da semana no período */}
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Vendas por dia da semana (período selecionado)
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Soma de PDV + catálogo pago. Destaque:{' '}
                <strong className="text-primary">{data.highlights.best_weekday?.label}</strong> com{' '}
                {fmtMoney(data.highlights.best_weekday?.total ?? 0)}
              </p>
              <div className="space-y-3">
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
          </div>
        ) : null}
      </div>

      {/* Relatório mensal */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden p-6 space-y-6">
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
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        ) : monthData ? (
          <div className="space-y-8">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/15">
                <p className="text-xs font-bold text-slate-500 uppercase">Semana do mês com mais vendas</p>
                <p className="text-xl font-black text-slate-900 mt-1">
                  {monthData.highlights.best_week_of_period
                    ? `${monthData.highlights.best_week_of_period.label} — ${fmtMoney(monthData.highlights.best_week_of_period.total)}`
                    : 'Sem dados no mês'}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                <p className="text-xs font-bold text-slate-500 uppercase">Dia do mês com mais vendas</p>
                <p className="text-xl font-black text-slate-900 mt-1">
                  {monthData.highlights.best_day
                    ? `${new Date(monthData.highlights.best_day.date + 'T12:00:00').toLocaleDateString('pt-BR')} — ${fmtMoney(monthData.highlights.best_day.total)}`
                    : 'Sem dados no mês'}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 sm:col-span-2">
                <p className="text-xs font-bold text-slate-500 uppercase">Dia da semana que mais vendeu no mês</p>
                <p className="text-xl font-black text-primary mt-1">
                  {monthData.highlights.best_weekday?.label} —{' '}
                  {fmtMoney(monthData.highlights.best_weekday?.total ?? 0)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-700 mb-3">Por semana dentro do mês (1ª a 5ª)</p>
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
              <div className="space-y-3">
                {monthData.salesByWeekday.map((w) => (
                  <div key={w.weekday} className="flex items-center gap-3">
                    <span className="w-24 text-sm font-medium text-slate-600 shrink-0">{w.label}</span>
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
        ) : null}
      </div>
    </motion.div>
  );
}
