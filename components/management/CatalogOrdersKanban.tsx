'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  RefreshCw,
  User,
} from 'lucide-react';
import {
  DELIVERY_TYPE_LABELS,
  FULFILLMENT_LABELS,
  FULFILLMENT_STATUSES,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  nextFulfillmentStatus,
  type FulfillmentStatus,
} from '@/lib/catalog-order-status';
import { whatsappLink } from '@/lib/phone';

export type CatalogOrderCard = {
  id: number;
  total: number;
  status: string;
  fulfillment_status: FulfillmentStatus;
  payment_id: string | null;
  created_at: string;
  customer: { name: string; email: string };
  address: {
    full: string | null;
    rua: string;
    numero: string | null;
    bairro: string;
    cidade: string;
    cep: string | null;
    complemento: string | null;
  };
  items_summary: string;
  delivery_type: string;
  payment_method_type: string;
  cash_paid_amount: number | null;
  cash_change: number | null;
  customer_whatsapp: string | null;
};

const COLUMN_STYLES: Record<FulfillmentStatus, { header: string; border: string }> = {
  pendente: { header: 'bg-amber-100 text-amber-900', border: 'border-amber-200' },
  confirmado: { header: 'bg-sky-100 text-sky-900', border: 'border-sky-200' },
  em_preparacao: { header: 'bg-violet-100 text-violet-900', border: 'border-violet-200' },
  saiu_entrega: { header: 'bg-orange-100 text-orange-900', border: 'border-orange-200' },
  entregue: { header: 'bg-emerald-100 text-emerald-900', border: 'border-emerald-200' },
};

const PENDING_PAYMENT_TTL_MS = 24 * 60 * 60 * 1000;

const fmtMoney = (v: number) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;

const fmtDate = (s: string) => {
  try {
    return new Date(s).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return s;
  }
};

const fmtDateFull = (s: string) => {
  try {
    return new Date(s).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return s;
  }
};

function parseItems(summary: string): string[] {
  if (!summary.trim()) return [];
  return summary.split(',').map((s) => s.trim()).filter(Boolean);
}

function pendingPaymentRemaining(createdAt: string): { expired: boolean; label: string } {
  const expiresAt = new Date(createdAt).getTime() + PENDING_PAYMENT_TTL_MS;
  const diff = expiresAt - Date.now();
  if (diff <= 0) return { expired: true, label: 'Expira em breve (será removido)' };
  const h = Math.floor(diff / (60 * 60 * 1000));
  const m = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  if (h > 0) return { expired: false, label: `Remove em ${h}h ${m}min` };
  return { expired: false, label: `Remove em ${m} min` };
}

function OrderKanbanCard({
  order,
  isUpdating,
  isExpanded,
  onToggleExpand,
  onMove,
}: {
  order: CatalogOrderCard;
  isUpdating: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onMove: (status: FulfillmentStatus) => void;
}) {
  const next = nextFulfillmentStatus(order.fulfillment_status);
  const addr =
    order.address.full ||
    `${order.address.rua}, ${order.address.numero || 's/n'} — ${order.address.bairro}, ${order.address.cidade}`;
  const items = parseItems(order.items_summary);
  const isPaymentPending = order.status === 'pendente';
  const pendingTtl = isPaymentPending ? pendingPaymentRemaining(order.created_at) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-colors cursor-pointer ${
        isExpanded ? 'border-primary/40 ring-1 ring-primary/20' : 'border-slate-100 hover:border-slate-200'
      }`}
      onClick={onToggleExpand}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggleExpand();
        }
      }}
      aria-expanded={isExpanded}
    >
      <motion.div layout className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400">Pedido #{order.id}</p>
            <p className="text-lg font-black text-primary">{fmtMoney(order.total)}</p>
          </div>
          <motion.div layout className="flex flex-col items-end gap-1 shrink-0">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                order.status === 'pago'
                  ? 'bg-emerald-100 text-emerald-800'
                  : order.status === 'cancelado'
                    ? 'bg-slate-100 text-slate-600'
                    : 'bg-amber-100 text-amber-800'
              }`}
            >
              {PAYMENT_STATUS_LABELS[order.status] || order.status}
            </span>
            <span className="text-[10px] font-medium text-slate-500 text-right">
              {DELIVERY_TYPE_LABELS[order.delivery_type] || order.delivery_type} ·{' '}
              {PAYMENT_METHOD_LABELS[order.payment_method_type] || order.payment_method_type}
            </span>
            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </motion.div>
        </div>

        {isPaymentPending && pendingTtl && (
          <p
            className={`text-[10px] font-semibold rounded-lg px-2 py-1 flex items-center gap-1 ${
              pendingTtl.expired ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'
            }`}
          >
            <Clock size={12} />
            {pendingTtl.label}
          </p>
        )}

        {order.payment_method_type === 'dinheiro' && order.cash_change != null && (
          <p className="text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg px-2 py-1">
            Troco: {fmtMoney(order.cash_change)}
            {order.cash_paid_amount != null && (
              <span className="font-normal text-emerald-600">
                {' '}
                (pago com {fmtMoney(order.cash_paid_amount)})
              </span>
            )}
          </p>
        )}

        <motion.div layout className="flex items-center gap-1.5 text-sm text-slate-800">
          <User size={14} className="text-slate-400 shrink-0" />
          <span className="font-semibold truncate">{order.customer.name}</span>
        </motion.div>

        {!isExpanded && (
          <>
            <p className="text-xs text-slate-500 truncate pl-5">{order.customer.email}</p>
            {order.delivery_type === 'entrega' && (
              <div className="flex items-start gap-1.5 text-xs text-slate-600">
                <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <span className="line-clamp-1">{addr}</span>
              </div>
            )}
            {order.items_summary && (
              <motion.div className="flex items-start gap-1.5 text-xs text-slate-500">
                <Package size={14} className="shrink-0 mt-0.5" />
                <span className="line-clamp-1">{order.items_summary}</span>
              </motion.div>
            )}
          </>
        )}

        <p className="text-[10px] text-slate-400">{fmtDate(order.created_at)}</p>
      </motion.div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-100 bg-slate-50/60"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 space-y-3 text-xs">
              <section>
                <p className="font-bold text-slate-500 uppercase tracking-wide mb-1">Cliente</p>
                <p className="font-semibold text-slate-800">{order.customer.name}</p>
                <p className="text-slate-600">{order.customer.email}</p>
                {order.customer_whatsapp && (
                  <p className="text-slate-600 mt-0.5">WhatsApp: {order.customer_whatsapp}</p>
                )}
              </section>

              <section>
                <p className="font-bold text-slate-500 uppercase tracking-wide mb-1">Entrega</p>
                <p className="text-slate-700">
                  {DELIVERY_TYPE_LABELS[order.delivery_type] || order.delivery_type}
                </p>
                {order.delivery_type === 'entrega' && (
                  <div className="mt-1 text-slate-600 space-y-0.5">
                    <p>{addr}</p>
                    {order.address.cep && <p>CEP: {order.address.cep}</p>}
                    {order.address.complemento && <p>Compl.: {order.address.complemento}</p>}
                  </div>
                )}
              </section>

              <section>
                <p className="font-bold text-slate-500 uppercase tracking-wide mb-1">Pagamento</p>
                <p className="text-slate-700">
                  {PAYMENT_METHOD_LABELS[order.payment_method_type] || order.payment_method_type} —{' '}
                  {PAYMENT_STATUS_LABELS[order.status] || order.status}
                </p>
                {order.payment_id && (
                  <p className="text-slate-500 mt-0.5 break-all">ID: {order.payment_id}</p>
                )}
                {isPaymentPending && (
                  <p className="text-amber-700 mt-1">
                    Pedidos sem pagamento são removidos automaticamente após 24 horas.
                  </p>
                )}
              </section>

              {items.length > 0 && (
                <section>
                  <p className="font-bold text-slate-500 uppercase tracking-wide mb-1">Itens</p>
                  <ul className="space-y-1">
                    {items.map((item) => (
                      <li key={item} className="flex items-center gap-1.5 text-slate-700">
                        <Package size={12} className="text-slate-400 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <p className="text-[10px] text-slate-400">Criado em {fmtDateFull(order.created_at)}</p>

              {order.customer_whatsapp && (
                <a
                  href={whatsappLink(order.customer_whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366] hover:text-white font-bold transition-colors"
                >
                  <MessageCircle size={16} />
                  Abrir WhatsApp
                </a>
              )}

              {next && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => onMove(next)}
                  className="w-full flex items-center justify-center gap-1 font-bold py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
                >
                  {isUpdating ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      Avançar para {FULFILLMENT_LABELS[next]}
                      <ChevronRight size={14} />
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isExpanded && (
        <motion.div layout className="px-3 pb-3 space-y-2" onClick={(e) => e.stopPropagation()}>
          {order.customer_whatsapp && (
            <a
              href={whatsappLink(order.customer_whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366] hover:text-white text-xs font-bold transition-colors"
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
          )}
          {next && (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onMove(next)}
              className="w-full flex items-center justify-center gap-1 text-xs font-bold py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
            >
              {isUpdating ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  Avançar para {FULFILLMENT_LABELS[next]}
                  <ChevronRight size={14} />
                </>
              )}
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

type Props = {
  selectedUserId?: string;
};

export default function CatalogOrdersKanban({ selectedUserId }: Props) {
  const [byStatus, setByStatus] = useState<Record<FulfillmentStatus, CatalogOrderCard[]>>(() =>
    Object.fromEntries(FULFILLMENT_STATUSES.map((s) => [s, []])) as Record<
      FulfillmentStatus,
      CatalogOrderCard[]
    >
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedUserId) params.set('user_id', selectedUserId);
      const res = await fetch(`/api/admin/catalog-orders?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao carregar pedidos');
      setByStatus(data.byStatus);
      setExpandedId((prev) => {
        if (prev == null) return null;
        const stillExists = FULFILLMENT_STATUSES.some((s) =>
          (data.byStatus[s] as CatalogOrderCard[]).some((o: CatalogOrderCard) => o.id === prev)
        );
        return stillExists ? prev : null;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, [selectedUserId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const moveOrder = async (orderId: number, newStatus: FulfillmentStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/admin/catalog-orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fulfillment_status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar');
      await fetchOrders();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao atualizar');
    } finally {
      setUpdatingId(null);
    }
  };

  const totalOrders = FULFILLMENT_STATUSES.reduce((n, s) => n + byStatus[s].length, 0);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex-1"
        >
          <h2 className="text-2xl font-black text-slate-900">Vendas Catálogo</h2>
          <p className="text-slate-500 mt-1">
            Acompanhe pedidos do catálogo online. Clique no card para ver detalhes.
            Pedidos aguardando pagamento são removidos após 24 horas.
            {totalOrders > 0 && (
              <span className="ml-1 font-semibold text-slate-700">({totalOrders} pedidos)</span>
            )}
          </p>
        </motion.div>
        <button
          type="button"
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-white px-4 py-3 rounded-xl border border-slate-200 hover:border-primary transition-all shadow-sm font-bold text-slate-700 shrink-0"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-100 text-sm font-medium"
        >
          {error}
        </motion.div>
      )}

      {loading && totalOrders === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center py-20"
        >
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </motion.div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
          {FULFILLMENT_STATUSES.map((status) => {
            const cards = byStatus[status] || [];
            const style = COLUMN_STYLES[status];
            return (
              <div
                key={status}
                className={`flex-shrink-0 w-[min(100%,280px)] sm:w-[260px] rounded-2xl border ${style.border} bg-slate-50/80 flex flex-col max-h-[calc(100vh-280px)]`}
              >
                <motion.div
                  layout
                  className={`px-4 py-3 rounded-t-2xl font-bold text-sm flex items-center justify-between ${style.header}`}
                >
                  <span>{FULFILLMENT_LABELS[status]}</span>
                  <span className="bg-white/60 px-2 py-0.5 rounded-full text-xs font-black">
                    {cards.length}
                  </span>
                </motion.div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[120px]">
                  {cards.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">Nenhum pedido</p>
                  ) : (
                    cards.map((order) => (
                      <OrderKanbanCard
                        key={order.id}
                        order={order}
                        isUpdating={updatingId === order.id}
                        isExpanded={expandedId === order.id}
                        onToggleExpand={() =>
                          setExpandedId((id) => (id === order.id ? null : order.id))
                        }
                        onMove={(next) => moveOrder(order.id, next)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
