/**
 * Cria usuário Administrador Geral no MySQL.
 * Execute: node scripts/create-admin-geral.js
 * Credenciais: admin.geral@adm / Admin@2024
 */

require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const EMAIL = 'admin.geral@adm';
const PASSWORD = 'Admin@2024';
const NAME = 'Administrador Geral';

async function main() {
  const host = process.env.MYSQL_HOST || 'localhost';
  const port = Number(process.env.MYSQL_PORT) || 3306;
  const dbUser = process.env.MYSQL_USER || 'root';
  const dbPassword = process.env.MYSQL_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || 'jornada_produtor';

  if (!dbPassword) {
    console.error('Erro: MYSQL_PASSWORD não definido em .env.local');
    process.exit(1);
  }

  const conn = await mysql.createConnection({
    host,
    port,
    user: dbUser,
    password: dbPassword,
    database,
  });

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  await conn.execute(
    `INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, 'admin')
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), name = VALUES(name), role = 'admin'`,
    [EMAIL, passwordHash, NAME]
  );

  console.log('Usuário Administrador Geral criado/atualizado:');
  console.log('  E-mail:', EMAIL);
  console.log('  Senha:', PASSWORD);
  console.log('  Nível: admin (acesso total)');
  await conn.end();
}

main().catch((err) => {
  console.error('Erro:', err.message);
  process.exit(1);
});
