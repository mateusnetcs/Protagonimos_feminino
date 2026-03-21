require('dotenv').config({ path: '.env.local' });
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function main() {
  const email = 'brenda@geral.com';
  const password = '123123';
  const name = 'Brenda';
  const hash = await bcrypt.hash(password, 10);

  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'jornada_produtor',
  });

  await conn.execute(
    'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
    [email, hash, name]
  );
  console.log('Usuário criado:', email);
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
