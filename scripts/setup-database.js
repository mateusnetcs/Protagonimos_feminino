/**
 * Cria o banco jornada_produtor e todas as tabelas.
 * Execute: npm run db:setup
 * Requer: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD no .env.local
 */

// Carrega .env.local apenas se as variáveis ainda não estão definidas (ex: desenvolvimento local)
if (!process.env.MYSQL_PASSWORD && !process.env.MYSQL_HOST) {
  try { require('dotenv').config({ path: '.env.local' }); } catch (_) {}
}
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
  console.log('Schema aplicado.');

  const migrationsDir = path.join(__dirname, '..', 'database', 'migrations');
  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
    for (const f of files) {
      try {
        const m = fs.readFileSync(path.join(migrationsDir, f), 'utf8');
        await conn.query(m);
        console.log('Migração aplicada:', f);
      } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME' || e.code === 'ER_DUP_KEYNAME' || e.message?.includes('Duplicate')) {
          console.log('Migração já aplicada:', f);
        } else throw e;
      }
    }
  }

  await conn.end();
  console.log('Banco jornada_produtor configurado com sucesso!');
}

main().catch((err) => {
  console.error('Erro:', err.message);
  process.exit(1);
});
