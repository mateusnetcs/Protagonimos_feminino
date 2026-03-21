import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customer-auth';
import { query } from '@/lib/db';

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const orders = await query<
      { id: number; total: number; status: string; created_at: string; items_summary: string }[]
    >(
      `SELECT o.id, o.total, o.status, o.created_at,
        GROUP_CONCAT(CONCAT(COALESCE(p.name, 'Produto'), ' x', i.quantity) SEPARATOR ', ') as items_summary
       FROM catalog_orders o
       LEFT JOIN catalog_order_items i ON i.order_id = o.id
       LEFT JOIN products p ON p.id = i.product_id
       WHERE o.customer_id = ?
       GROUP BY o.id, o.total, o.status, o.created_at
       ORDER BY o.created_at DESC
       LIMIT 50`,
      [session.id]
    );
    const list = Array.isArray(orders) ? orders : [orders];
    return NextResponse.json(list.map((o) => ({ ...o, items_summary: o.items_summary || '' })));
  } catch (err) {
    console.error('My orders error:', err);
    return NextResponse.json({ error: 'Erro ao carregar pedidos' }, { status: 500 });
  }
}
