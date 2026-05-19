import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdminSession } from '@/lib/auth';
import { canAdminAccessUser } from '@/lib/restricted-access';
import { query } from '@/lib/db';
import { FULFILLMENT_STATUSES, type FulfillmentStatus } from '@/lib/catalog-order-status';

async function canAccessOrder(sessionUserId: string | undefined, orderId: number, asAdmin: boolean): Promise<boolean> {
  const rows = await query<{ seller_user_id: number | null; product_user_id: number | null }[]>(
    `SELECT o.seller_user_id,
      (SELECT p.user_id FROM catalog_order_items coi
       INNER JOIN products p ON p.id = coi.product_id
       WHERE coi.order_id = o.id LIMIT 1) AS product_user_id
     FROM catalog_orders o WHERE o.id = ?`,
    [orderId]
  );
  const row = Array.isArray(rows) ? rows[0] : rows;
  if (!row) return false;

  const uid = sessionUserId ? Number(sessionUserId) : NaN;
  if (!Number.isFinite(uid)) return asAdmin;

  const sellerId = row.seller_user_id != null ? Number(row.seller_user_id) : null;
  const productUserId = row.product_user_id != null ? Number(row.product_user_id) : null;

  if (asAdmin) {
    const target = sellerId ?? productUserId;
    if (target == null) return true;
    return canAdminAccessUser(sessionUserId, target);
  }

  return sellerId === uid || productUserId === uid;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (!Number.isFinite(orderId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const userId = (session.user as { id?: string }).id;
    const asAdmin = isAdminSession(session);
    const allowed = await canAccessOrder(userId, orderId, asAdmin);
    if (!allowed) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

    const body = await request.json();
    const { fulfillment_status } = body as { fulfillment_status?: string };
    if (!fulfillment_status || !FULFILLMENT_STATUSES.includes(fulfillment_status as FulfillmentStatus)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
    }

    await query('UPDATE catalog_orders SET fulfillment_status = ? WHERE id = ?', [
      fulfillment_status,
      orderId,
    ]);

    if (fulfillment_status === 'entregue') {
      await query(`UPDATE catalog_orders SET status = 'pago' WHERE id = ? AND status NOT IN ('cancelado')`, [
        orderId,
      ]);
    }

    return NextResponse.json({ ok: true, fulfillment_status });
  } catch (err) {
    console.error('Admin catalog orders PATCH:', err);
    return NextResponse.json({ error: 'Erro ao atualizar pedido' }, { status: 500 });
  }
}
