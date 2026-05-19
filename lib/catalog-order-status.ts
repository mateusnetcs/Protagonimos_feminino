export const FULFILLMENT_STATUSES = [
  'pendente',
  'confirmado',
  'em_preparacao',
  'saiu_entrega',
  'entregue',
] as const;

export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

export const FULFILLMENT_LABELS: Record<FulfillmentStatus, string> = {
  pendente: 'Pendentes',
  confirmado: 'Confirmado',
  em_preparacao: 'Em preparação',
  saiu_entrega: 'Saiu para entrega',
  entregue: 'Entregue',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pendente: 'Aguardando pagamento',
  pago: 'Pago',
  cancelado: 'Cancelado',
  entregue: 'Entregue',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'Pix',
  cartao: 'Cartão',
};

export const DELIVERY_TYPE_LABELS: Record<string, string> = {
  entrega: 'Entrega',
  retirada: 'Retirada',
};

/** Ao confirmar pagamento, pedido vai direto para Confirmado no Kanban */
export const PAID_FULFILLMENT: FulfillmentStatus = 'confirmado';

export function nextFulfillmentStatus(current: FulfillmentStatus): FulfillmentStatus | null {
  const idx = FULFILLMENT_STATUSES.indexOf(current);
  if (idx < 0 || idx >= FULFILLMENT_STATUSES.length - 1) return null;
  return FULFILLMENT_STATUSES[idx + 1];
}
