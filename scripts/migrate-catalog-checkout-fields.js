/**
 * Campos do novo checkout: entrega/retirada, dinheiro, whatsapp
 * Execute: npm run db:migrate-catalog-checkout
 */
if (!process.env.MYSQL_PASSWORD) {
  try { require('dotenv').config({ path: '.env.local' }); } catch (_) {}
}
const mysql = require('mysql2/promise');

async function addColumn(conn, sql, name) {
  try {
    await conn.query(sql);
    console.log(name, 'OK');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log(name, 'já existe');
    else throw e;
  }
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'jornada_produtor',
  });

  await addColumn(
    conn,
    `ALTER TABLE catalog_orders ADD COLUMN delivery_type ENUM('entrega','retirada') DEFAULT 'entrega' AFTER seller_user_id`,
    'delivery_type'
  );
  await addColumn(
    conn,
    `ALTER TABLE catalog_orders ADD COLUMN payment_method_type ENUM('dinheiro','pix','cartao') DEFAULT 'pix' AFTER delivery_type`,
    'payment_method_type'
  );
  await addColumn(
    conn,
    `ALTER TABLE catalog_orders ADD COLUMN cash_paid_amount DECIMAL(10,2) DEFAULT NULL AFTER payment_method_type`,
    'cash_paid_amount'
  );
  await addColumn(
    conn,
    `ALTER TABLE catalog_orders ADD COLUMN cash_change DECIMAL(10,2) DEFAULT NULL AFTER cash_paid_amount`,
    'cash_change'
  );
  await addColumn(
    conn,
    `ALTER TABLE catalog_orders ADD COLUMN customer_whatsapp VARCHAR(20) DEFAULT NULL AFTER cash_change`,
    'customer_whatsapp'
  );

  // Cancela PIX antigos não pagos (mais de 7 dias em pendente)
  const [r] = await conn.query(
    `UPDATE catalog_orders SET status = 'cancelado', fulfillment_status = 'pendente'
     WHERE status = 'pendente' AND payment_method_type = 'pix'
       AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)`
  );
  console.log('Pedidos PIX antigos cancelados:', r.affectedRows ?? 0);

  await conn.end();
  console.log('Migração checkout concluída.');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
