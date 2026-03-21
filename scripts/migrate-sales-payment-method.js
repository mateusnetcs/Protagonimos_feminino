/**
 * Adiciona payment_method em sales (PDV) se não existir.
 * node scripts/migrate-sales-payment-method.js
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

  const [cols] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales' AND COLUMN_NAME = 'payment_method'`
  );
  if (!Array.isArray(cols) || cols.length === 0) {
    await conn.query(
      `ALTER TABLE sales ADD COLUMN payment_method VARCHAR(32) DEFAULT 'cartao_pix' AFTER total`
    );
    console.log('Coluna sales.payment_method adicionada.');
  } else {
    console.log('sales.payment_method já existe.');
  }

  await conn.end();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
