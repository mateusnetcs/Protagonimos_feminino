-- Configuração PIX por usuário (chave própria para PDV - estilo TudoNet)
CREATE TABLE IF NOT EXISTS user_pix_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  tipo_chave VARCHAR(20) DEFAULT 'email',
  chave VARCHAR(255) NOT NULL,
  nome_beneficiario VARCHAR(255) NOT NULL,
  cidade_beneficiario VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
