/**
 * Migração: cria tabela questionnaires e adiciona questionnaire_id em survey_responses
 * Execute: node scripts/add-questionnaires.js
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
    CREATE TABLE IF NOT EXISTS questionnaires (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL DEFAULT 'Questionário',
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('Tabela questionnaires OK');

  try {
    await conn.query('ALTER TABLE survey_responses ADD COLUMN questionnaire_id INT DEFAULT NULL');
    console.log('Coluna questionnaire_id adicionada.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') console.log('Coluna questionnaire_id já existe.');
    else throw err;
  }

  await conn.query(`INSERT IGNORE INTO questionnaires (id, title, is_active) VALUES (1, 'Questionário Inicial', 1)`);
  console.log('Questionário inicial criado.');

  await conn.end();
  console.log('Migração concluída.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
