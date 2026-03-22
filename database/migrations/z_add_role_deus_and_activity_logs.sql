-- Adiciona role 'deus' (usuário com visão de rastreio total)
ALTER TABLE users MODIFY COLUMN role ENUM('admin','geral','deus') DEFAULT 'geral';

-- Tabela de log de atividades (Olho de Deus)
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) DEFAULT NULL,
  action VARCHAR(100) NOT NULL,
  screen VARCHAR(100) DEFAULT NULL,
  details JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_activity_created (created_at),
  INDEX idx_activity_user (user_id),
  INDEX idx_activity_screen (screen)
);
