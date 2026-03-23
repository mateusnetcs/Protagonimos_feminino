import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdminSession } from '@/lib/auth';
import { query, getPool } from '@/lib/db';

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

    const body = await request.json();
    const { supplierCnpj, items, userId: filterUserId } = body as {
      supplierCnpj: string;
      items: { itemIndex: number; cEAN: string; cProd: string; xProd: string }[];
      userId?: string;
    };
    if (!items?.length) return NextResponse.json({ error: 'Nenhum item' }, { status: 400 });

    await ensureNotaImportSchema();

    const cnpj = String(supplierCnpj || '').replace(/\D/g, '');
    const sessionUid = (session.user as { id?: string })?.id;
    const sessionUidNum = sessionUid && !isNaN(Number(sessionUid)) ? Number(sessionUid) : null;
    const uid = isAdminSession(session) && filterUserId && !isNaN(Number(filterUserId))
      ? Number(filterUserId)
      : sessionUidNum;
    const products = uid != null
      ? await query<any[]>('SELECT id, name, barcode, price_sale, cost_cmv FROM products WHERE status = ? AND (user_id IS NULL OR user_id = ?) ORDER BY name', ['ativo', uid])
      : await query<any[]>('SELECT id, name, barcode, price_sale, cost_cmv FROM products WHERE status = \'ativo\' ORDER BY name');
    const prodList = Array.isArray(products) ? products : [products];

    const mappings = cnpj ? await query<any[]>(
      'SELECT supplier_product_key, our_product_id FROM nota_product_mappings WHERE supplier_cnpj = ?',
      [cnpj]
    ) : [];
    const mappingList = Array.isArray(mappings) ? mappings : [mappings];
    const mapByKey = new Map(mappingList.map((m) => [String(m.supplier_product_key).toLowerCase(), m.our_product_id]));

    const results = items.map((item: { itemIndex: number; cEAN: string; cProd: string; xProd: string }) => {
      const key = [item.cProd, item.cEAN, item.xProd].filter(Boolean).join('|').toLowerCase();
      const fromMapping = mapByKey.get(key);
      let matchedProduct = null;

      if (fromMapping) {
        matchedProduct = prodList.find((p) => String(p.id) === String(fromMapping));
      }
      if (!matchedProduct && item.cEAN) {
        matchedProduct = prodList.find((p) => p.barcode && String(p.barcode).replace(/\D/g, '') === String(item.cEAN).replace(/\D/g, ''));
      }
      if (!matchedProduct) {
        matchedProduct = prodList.find((p) =>
          p.name && item.xProd && p.name.toLowerCase().trim() === item.xProd.toLowerCase().trim()
        );
      }

      return {
        item,
        matchedProduct: matchedProduct ? {
          id: String(matchedProduct.id),
          name: matchedProduct.name,
          price_sale: matchedProduct.price_sale != null ? Number(matchedProduct.price_sale) : null,
          cost_cmv: matchedProduct.cost_cmv != null ? Number(matchedProduct.cost_cmv) : null,
        } : null,
        fromMapping: !!fromMapping,
      };
    });

    return NextResponse.json({ results });
  } catch (err) {
    console.error('Nota preview error:', err);
    return NextResponse.json({ error: 'Erro ao analisar.' }, { status: 500 });
  }
}
