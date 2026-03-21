/**
 * Migração: cria tabelas para catálogo (customers, catalog_orders, catalog_order_items)
 * Execute: node scripts/migrate-catalog-tables.js
 */
require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'jornada_produtor',
  });

  await conn.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      birth_date DATE DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Tabela customers OK');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS catalog_orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      endereco VARCHAR(500) NOT NULL,
      bairro VARCHAR(255) NOT NULL,
      rua VARCHAR(255) NOT NULL,
      cidade VARCHAR(255) NOT NULL,
      total DECIMAL(10,2) NOT NULL,
      status ENUM('pendente','pago','cancelado') DEFAULT 'pendente',
      payment_id VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
    )
  `);
  console.log('Tabela catalog_orders OK');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS catalog_order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES catalog_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    )
  `);
  console.log('Tabela catalog_order_items OK');

  await conn.end();
  console.log('Migração concluída.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
