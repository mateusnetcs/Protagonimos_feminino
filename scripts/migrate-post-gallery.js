/**
 * Migração: cria tabela post_gallery (galeria de posts gerados por usuário)
 * Execute: node scripts/migrate-post-gallery.js
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

  await conn.query(`
    CREATE TABLE IF NOT EXISTS post_gallery (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      product_id INT DEFAULT NULL,
      product_name VARCHAR(255) DEFAULT NULL,
      caption TEXT DEFAULT NULL,
      image_url TEXT NOT NULL,
      image_urls JSON DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    )
  `);
  console.log('Tabela post_gallery OK');

  await conn.end();
  console.log('Migração concluída.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
