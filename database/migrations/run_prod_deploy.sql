-- =============================================================================
-- Migrações de produção — execute no MySQL (Coolify / phpMyAdmin / Adminer)
-- Não use npm no container da aplicação (sem permissão de escrita).
--
-- Se algum ALTER der erro "Duplicate column name", essa coluna já existe: ignore e siga.
-- =============================================================================

-- Selecione o banco correto no painel (ex.: jornada_produtor) antes de executar.
-- USE jornada_produtor;

-- --- 1) Kanban de pedidos (fulfillment) ---
ALTER TABLE catalog_orders
  ADD COLUMN fulfillment_status ENUM(
    'pendente',
    'confirmado',
    'em_preparacao',
    'saiu_entrega',
    'entregue'
  ) DEFAULT 'pendente' AFTER status;

ALTER TABLE catalog_orders
  ADD COLUMN seller_user_id INT DEFAULT NULL AFTER customer_id;

UPDATE catalog_orders
SET fulfillment_status = 'confirmado'
WHERE status = 'pago';

-- --- 2) Checkout (entrega, pagamento, WhatsApp) ---
ALTER TABLE catalog_orders
  ADD COLUMN delivery_type ENUM('entrega', 'retirada') DEFAULT 'entrega' AFTER seller_user_id;

ALTER TABLE catalog_orders
  ADD COLUMN payment_method_type ENUM('dinheiro', 'pix', 'cartao') DEFAULT 'pix' AFTER delivery_type;

ALTER TABLE catalog_orders
  ADD COLUMN cash_paid_amount DECIMAL(10, 2) DEFAULT NULL AFTER payment_method_type;

ALTER TABLE catalog_orders
  ADD COLUMN cash_change DECIMAL(10, 2) DEFAULT NULL AFTER cash_paid_amount;

ALTER TABLE catalog_orders
  ADD COLUMN customer_whatsapp VARCHAR(20) DEFAULT NULL AFTER cash_change;

-- Opcional: cancela PIX pendente há mais de 7 dias
UPDATE catalog_orders
SET status = 'cancelado', fulfillment_status = 'pendente'
WHERE status = 'pendente'
  AND payment_method_type = 'pix'
  AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY);

-- --- 3) Galeria de posts gerados com IA ---
CREATE TABLE IF NOT EXISTS post_gallery (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT DEFAULT NULL,
  product_name VARCHAR(255) DEFAULT NULL,
  caption TEXT DEFAULT NULL,
  image_url TEXT NOT NULL,
  image_urls JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Fim — confira se catalog_orders tem as colunas novas e se post_gallery existe.
