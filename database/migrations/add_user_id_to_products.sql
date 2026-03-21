-- Cada usuário vê apenas seus produtos e vendas
-- Produtos passam a ter user_id (quem cadastrou)
-- Execute: mysql -u usuario -p jornada_produtor < add_user_id_to_products.sql

ALTER TABLE products ADD COLUMN user_id INT DEFAULT NULL AFTER status;
ALTER TABLE products ADD CONSTRAINT fk_products_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Produtos existentes: atribuir ao primeiro usuário (evitar perder visibilidade)
UPDATE products p
JOIN (SELECT id FROM users ORDER BY id LIMIT 1) u ON 1=1
SET p.user_id = u.id
WHERE p.user_id IS NULL;
