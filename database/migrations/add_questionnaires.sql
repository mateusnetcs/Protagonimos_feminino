-- Tabela de questionários (admin pode criar e editar)
-- Execute: mysql -u usuario -p jornada_produtor < add_questionnaires.sql

CREATE TABLE IF NOT EXISTS questionnaires (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL DEFAULT 'Questionário',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE survey_responses ADD COLUMN questionnaire_id INT DEFAULT NULL;

INSERT IGNORE INTO questionnaires (id, title, is_active) VALUES (1, 'Questionário Inicial', 1);
