-- Tabela para armazenar tokens OAuth do Mercado Pago por usuário (conexão individual estilo TudoNet)
CREATE TABLE IF NOT EXISTS user_mercadopago (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  access_token VARCHAR(512) NOT NULL,
  refresh_token VARCHAR(512) DEFAULT NULL,
  expires_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
