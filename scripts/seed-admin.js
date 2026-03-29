/**
 * Cria ou atualiza o usuário admin no MySQL (inclui redefinir senha).
 *
 * Uso:
 *   npm run db:seed
 *   → admin@adm / 123123 (padrão)
 *
 * Senha personalizada (PowerShell):
 *   $env:ADMIN_PASSWORD="suaSenhaSegura"; $env:ADMIN_EMAIL="seu@email.com"; npm run db:seed
 *
 * CMD:
 *   set ADMIN_PASSWORD=suaSenhaSegura && set ADMIN_EMAIL=seu@email.com && npm run db:seed
 */

if (!process.env.MYSQL_PASSWORD) {
  try { require('dotenv').config({ path: '.env.local' }); } catch (_) {}
}
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const EMAIL = process.env.ADMIN_EMAIL || 'admin@adm';
const PASSWORD = process.env.ADMIN_PASSWORD || '123123';
const NAME = process.env.ADMIN_NAME || 'Admin Inovação';

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
    `INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, 'admin')
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), name = VALUES(name), role = 'admin'`,
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
