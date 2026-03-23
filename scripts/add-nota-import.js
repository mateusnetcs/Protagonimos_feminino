/**
 * Migração: tabela nota_product_mappings e coluna barcode em products
 * Execute: node scripts/add-nota-import.js
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
    CREATE TABLE IF NOT EXISTS nota_product_mappings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      supplier_cnpj VARCHAR(20) NOT NULL,
      supplier_product_key VARCHAR(120) NOT NULL,
      our_product_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_supplier_product (supplier_cnpj, supplier_product_key),
      FOREIGN KEY (our_product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);
  console.log('Tabela nota_product_mappings OK');

  try {
    await conn.query('ALTER TABLE products ADD COLUMN barcode VARCHAR(30) DEFAULT NULL');
    console.log('Coluna barcode adicionada em products.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') console.log('Coluna barcode já existe.');
    else throw err;
  }

  await conn.end();
  console.log('Migração concluída.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
