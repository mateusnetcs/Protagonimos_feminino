/**
 * Adiciona status 'entregue' em catalog_orders
 * Execute: node scripts/migrate-orders-entregue.js
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
  await conn.query(
    "ALTER TABLE catalog_orders MODIFY COLUMN status ENUM('pendente','pago','cancelado','entregue') DEFAULT 'pendente'"
  );
  console.log("Status 'entregue' adicionado.");
  await conn.end();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
