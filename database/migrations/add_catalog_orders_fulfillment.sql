-- Status operacional do pedido (Kanban) — separado do status de pagamento
ALTER TABLE catalog_orders
  ADD COLUMN fulfillment_status ENUM(
    'pendente',
    'confirmado',
    'em_preparacao',
    'saiu_entrega',
    'entregue'
  ) DEFAULT 'pendente' AFTER status;

-- Produtora dona da vitrine (/catalogo/[userId])
ALTER TABLE catalog_orders
  ADD COLUMN seller_user_id INT DEFAULT NULL AFTER customer_id;

-- Pedidos já pagos entram como confirmados no Kanban
UPDATE catalog_orders SET fulfillment_status = 'confirmado' WHERE status = 'pago';
