/**
 * Verifica os acessos de clientes aos catálogos
 * Execute: node scripts/check-catalog-access.js
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

  const [rows] = await conn.query(`
    SELECT c.id as customer_id, c.email, cca.user_id as catalog_user_id
    FROM customers c
    LEFT JOIN customer_catalog_access cca ON c.id = cca.customer_id
    ORDER BY c.id
  `);

  console.log('\n=== Clientes e acessos a catálogos ===\n');
  console.table(rows);
  console.log('\nCada cliente deve ter APENAS UM catalog_user_id (o catálogo em que se cadastrou).');
  console.log('Se um cliente tiver acesso a mais de um catálogo, delete os extras com:');
  console.log('  DELETE FROM customer_catalog_access WHERE customer_id = X AND user_id = Y;\n');

  await conn.end();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
