/**
 * Cria o banco jornada_produtor e todas as tabelas.
 * Execute: npm run db:setup
 * Requer: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD no .env.local
 */

require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function main() {
  const host = process.env.MYSQL_HOST || 'localhost';
  const port = Number(process.env.MYSQL_PORT) || 3306;
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || '';

  if (!password) {
    console.error('Erro: MYSQL_PASSWORD não definido em .env.local');
    process.exit(1);
  }

  console.log('Conectando ao MySQL...');
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true,
  });

  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  await conn.query(sql);
  await conn.end();
  console.log('\nBanco jornada_produtor criado com sucesso!');
  console.log('Execute "npm run db:seed" para criar o usuário admin.');
}

main().catch((err) => {
  console.error('Erro:', err.message);
  process.exit(1);
});
