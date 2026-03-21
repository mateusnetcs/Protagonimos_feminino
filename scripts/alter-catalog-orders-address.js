/**
 * Altera catalog_orders: add numero, cep, complemento
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

  try {
    await conn.query(`ALTER TABLE catalog_orders ADD COLUMN numero VARCHAR(50) DEFAULT NULL`);
  } catch (e) {
    if (!e.message?.includes('Duplicate column')) console.log('numero:', e.message);
  }
  try {
    await conn.query(`ALTER TABLE catalog_orders ADD COLUMN cep VARCHAR(20) DEFAULT NULL`);
  } catch (e) {
    if (!e.message?.includes('Duplicate column')) console.log('cep:', e.message);
  }
  try {
    await conn.query(`ALTER TABLE catalog_orders ADD COLUMN complemento VARCHAR(500) DEFAULT NULL`);
  } catch (e) {
    if (!e.message?.includes('Duplicate column')) console.log('complemento:', e.message);
  }
  await conn.query(`ALTER TABLE catalog_orders MODIFY endereco VARCHAR(500) DEFAULT NULL`);
  await conn.end();
  console.log('Migração concluída.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
