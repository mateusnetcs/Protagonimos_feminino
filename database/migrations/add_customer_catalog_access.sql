-- Cliente associado ao catálogo do produtor (user_id)
-- Quando o cliente se cadastra no catálogo do usuário 13, ele só pode acessar o catálogo 13
-- Execute: mysql -u usuario -p jornada_produtor < add_customer_catalog_access.sql

CREATE TABLE IF NOT EXISTS customer_catalog_access (
  customer_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (customer_id, user_id),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);
