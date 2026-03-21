/**
 * Cria o usuário admin no MySQL.
 * Execute: npm run db:seed
 * Credenciais: admin@adm / 123123
 */

require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const EMAIL = 'admin@adm';
const PASSWORD = '123123';
const NAME = 'Admin Inovação';

async function main() {
  const host = process.env.MYSQL_HOST || 'localhost';
  const port = Number(process.env.MYSQL_PORT) || 3306;
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || 'jornada_produtor';

  if (!password) {
    console.error('Erro: MYSQL_PASSWORD não definido em .env.local');
    process.exit(1);
  }

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
  });

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  await conn.execute(
    `INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), name = VALUES(name)`,
    [EMAIL, passwordHash, NAME]
  );

  console.log('Usuário admin criado/atualizado:');
  console.log('  E-mail:', EMAIL);
  console.log('  Senha:', PASSWORD);
  await conn.end();
}

main().catch((err) => {
  console.error('Erro:', err.message);
  process.exit(1);
});
