-- Banco de dados Jornada do Produtor / Inovação Imperatriz
CREATE DATABASE IF NOT EXISTS jornada_produtor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE jornada_produtor;

-- Tabela de usuários (login gestão)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de respostas do questionário
CREATE TABLE IF NOT EXISTS survey_responses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  primeira_vez VARCHAR(50) DEFAULT NULL,
  idade VARCHAR(50) DEFAULT NULL,
  tempo_atuacao VARCHAR(50) DEFAULT NULL,
  renda_agricultura VARCHAR(50) DEFAULT NULL,
  produtos TEXT DEFAULT NULL,
  locais_venda JSON DEFAULT NULL,
  divulga_redes VARCHAR(50) DEFAULT NULL,
  controla_financas VARCHAR(50) DEFAULT NULL,
  dificuldades JSON DEFAULT NULL,
  conciliar_familia VARCHAR(50) DEFAULT NULL,
  temas_aprender JSON DEFAULT NULL,
  sugestao TEXT DEFAULT NULL
);

-- Tabela de produtos (cadastro, PDV, catálogo)
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  stock_current INT DEFAULT 0,
  stock_min INT DEFAULT 0,
  cost_cmv DECIMAL(10,2) DEFAULT 0,
  price_sale DECIMAL(10,2) DEFAULT 0,
  image_url TEXT DEFAULT NULL,
  status ENUM('ativo','inativo') DEFAULT 'ativo',
  visibility VARCHAR(50) DEFAULT 'pdv',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de vendas (PDV)
CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  total DECIMAL(10,2) DEFAULT 0,
  payment_method VARCHAR(32) DEFAULT 'cartao_pix',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Itens da venda
CREATE TABLE IF NOT EXISTS sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- Clientes do catálogo (compradores)
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  birth_date DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pedidos do catálogo (vendas online)
CREATE TABLE IF NOT EXISTS catalog_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  endereco VARCHAR(500) DEFAULT NULL,
  bairro VARCHAR(255) NOT NULL,
  rua VARCHAR(255) NOT NULL,
  cidade VARCHAR(255) NOT NULL,
  numero VARCHAR(50) DEFAULT NULL,
  cep VARCHAR(20) DEFAULT NULL,
  complemento VARCHAR(500) DEFAULT NULL,
  total DECIMAL(10,2) NOT NULL,
  status ENUM('pendente','pago','cancelado') DEFAULT 'pendente',
  payment_id VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
);

-- Configuração PIX por usuário (chave própria para PDV)
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

-- Integração Mercado Pago por usuário (OAuth - PIX PDV)
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

-- Itens do pedido do catálogo
CREATE TABLE IF NOT EXISTS catalog_order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES catalog_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);
