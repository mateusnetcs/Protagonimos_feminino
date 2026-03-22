/**
 * Migração: adiciona coluna show_in_catalog em products
 * Execute: node scripts/add-show-in-catalog.js
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
    await conn.query('ALTER TABLE products ADD COLUMN show_in_catalog TINYINT(1) DEFAULT 1');
    console.log('Coluna show_in_catalog adicionada.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Coluna show_in_catalog já existe.');
    } else {
      throw err;
    }
  }

  await conn.query('UPDATE products SET show_in_catalog = 1 WHERE show_in_catalog IS NULL');
  console.log('Produtos sem valor definido atualizados para show_in_catalog=1.');

  await conn.end();
  console.log('Migração concluída.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
