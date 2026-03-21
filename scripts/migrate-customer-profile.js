/**
 * Migração: adiciona photo_url e campos de endereço em customers
 * Execute: node scripts/migrate-customer-profile.js
 */
require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const COLS = [
  ['photo_url', 'TEXT DEFAULT NULL'],
  ['cidade', 'VARCHAR(255) DEFAULT NULL'],
  ['bairro', 'VARCHAR(255) DEFAULT NULL'],
  ['rua', 'VARCHAR(255) DEFAULT NULL'],
  ['numero', 'VARCHAR(50) DEFAULT NULL'],
  ['cep', 'VARCHAR(20) DEFAULT NULL'],
  ['complemento', 'VARCHAR(500) DEFAULT NULL'],
];

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'jornada_produtor',
  });

  const [cols] = await conn.query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'customers'",
    [process.env.MYSQL_DATABASE || 'jornada_produtor']
  );
  const existing = new Set(cols.map((r) => r.COLUMN_NAME));

  for (const [name, def] of COLS) {
    if (existing.has(name)) {
      console.log(`Coluna ${name} já existe`);
    } else {
      await conn.query(`ALTER TABLE customers ADD COLUMN ${name} ${def}`);
      console.log(`Coluna ${name} adicionada`);
    }
  }

  await conn.end();
  console.log('Migração concluída.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
