import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdminSession } from '@/lib/auth';
import { canAdminAccessUser } from '@/lib/restricted-access';
import { query, getPool } from '@/lib/db';

type NfeItem = {
  itemIndex: number;
  cProd: string;
  cEAN: string;
  xProd: string;
  NCM: string;
  uCom: string;
  qCom: number;
  vUnCom: number;
  vProd: number;
};

type Decision = {
  itemIndex: number;
  action: 'map' | 'create';
  productId?: number;
  customName?: string;
  priceSale?: number;
  updatePrice?: boolean;
  imageUrl?: string;
};

async function ensureNotaImportSchema() {
  const pool = getPool();
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS nota_product_mappings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      supplier_cnpj VARCHAR(20) NOT NULL,
      supplier_product_key VARCHAR(120) NOT NULL,
      our_product_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_supplier_product (supplier_cnpj, supplier_product_key)
    )
  `);
  try {
    await pool.execute('ALTER TABLE products ADD COLUMN barcode VARCHAR(30) DEFAULT NULL');
  } catch (e: unknown) {
    if ((e as { code?: string })?.code !== 'ER_DUP_FIELDNAME') throw e;
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const sessionUserId = (session.user as { id?: string }).id;
    const sessionUid = sessionUserId && sessionUserId !== '' && !isNaN(Number(sessionUserId)) ? Number(sessionUserId) : null;

    const body = await request.json();
    const { supplierCnpj, supplierName, items, decisions, userId: targetUserId } = body as {
      supplierCnpj: string;
      supplierName: string;
      items: NfeItem[];
      decisions: Decision[];
      userId?: string;
    };
    const targetUid = targetUserId && !isNaN(Number(targetUserId)) ? Number(targetUserId) : null;
    if (targetUid != null && !canAdminAccessUser((session.user as { id?: string })?.id, targetUid)) {
      return NextResponse.json({ error: 'Acesso negado a este usuário.' }, { status: 403 });
    }
    const uid = isAdminSession(session) && targetUid != null ? targetUid : sessionUid;

    if (!items?.length || !decisions?.length) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    await ensureNotaImportSchema();

    const cnpj = String(supplierCnpj || '').replace(/\D/g, '');
    const itemByIndex = new Map(items.map((i) => [i.itemIndex, i]));
    const decByIndex = new Map(decisions.map((d) => [d.itemIndex, d]));

    for (const dec of decisions) {
      const item = itemByIndex.get(dec.itemIndex);
      if (!item) continue;

      const key = [item.cProd, item.cEAN, item.xProd].filter(Boolean).join('|').toLowerCase();
      const name = dec.customName?.trim() || item.xProd;
      const qty = Math.max(0, item.qCom);
      const cost = Math.max(0, item.vUnCom);

      if (dec.action === 'map' && dec.productId) {
        const pid = Number(dec.productId);
        if (!isNaN(pid)) {
          const priceSale = dec.priceSale != null && dec.priceSale > 0 ? dec.priceSale : null;
          const imageUrl = dec.imageUrl?.trim() || null;
          const updates = ['stock_current = COALESCE(stock_current, 0) + ?', 'cost_cmv = ?'];
          const params: (string | number)[] = [qty, cost];
          if (priceSale != null) {
            updates.push('price_sale = ?');
            params.push(priceSale);
          }
          if (imageUrl != null) {
            updates.push('image_url = ?');
            params.push(imageUrl);
          }
          params.push(pid);
          await query(
            `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
            params
          );
          if (cnpj && key) {
            await query(
              'INSERT IGNORE INTO nota_product_mappings (supplier_cnpj, supplier_product_key, our_product_id) VALUES (?, ?, ?)',
              [cnpj, key.slice(0, 120), pid]
            ).catch(() => {});
          }
        }
      } else if (dec.action === 'create') {
        const pool = getPool();
        const priceSale = dec.priceSale != null && dec.priceSale > 0 ? dec.priceSale : cost;
        const imageUrl = dec.imageUrl?.trim() || null;
        const [res] = await pool.execute(
          'INSERT INTO products (name, category, description, stock_current, stock_min, cost_cmv, price_sale, image_url, barcode, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [name.slice(0, 255), null, null, qty, 0, cost, priceSale, imageUrl, item.cEAN || null, uid]
        );
        const insertId = (res as { insertId?: number })?.insertId;
        if (insertId && cnpj && key) {
          await query(
            'INSERT IGNORE INTO nota_product_mappings (supplier_cnpj, supplier_product_key, our_product_id) VALUES (?, ?, ?)',
            [cnpj, key.slice(0, 120), insertId]
          ).catch(() => {});
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Nota conciliar error:', err);
    return NextResponse.json({ error: 'Erro ao conciliar.' }, { status: 500 });
  }
}
