/**
 * Adiciona fulfillment_status e seller_user_id em catalog_orders
 * Execute: node scripts/migrate-catalog-orders-fulfillment.js
 */
if (!process.env.MYSQL_PASSWORD) {
  try { require('dotenv').config({ path: '.env.local' }); } catch (_) {}
}
const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'jornada_produtor',
  });

  try {
    await conn.query(`
      ALTER TABLE catalog_orders
        ADD COLUMN fulfillment_status ENUM(
          'pendente','confirmado','em_preparacao','saiu_entrega','entregue'
        ) DEFAULT 'pendente' AFTER status
    `);
    console.log('Coluna fulfillment_status OK');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log('fulfillment_status já existe');
    else throw e;
  }

  try {
    await conn.query(`ALTER TABLE catalog_orders ADD COLUMN seller_user_id INT DEFAULT NULL AFTER customer_id`);
    console.log('Coluna seller_user_id OK');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log('seller_user_id já existe');
    else throw e;
  }

  await conn.query(`UPDATE catalog_orders SET fulfillment_status = 'confirmado' WHERE status = 'pago' AND fulfillment_status = 'pendente'`);
  console.log('Pedidos pagos migrados para confirmado.');

  await conn.end();
  console.log('Migração concluída.');
}

main().catch((err) => {
  console.error('Erro:', err.message);
  process.exit(1);
});
