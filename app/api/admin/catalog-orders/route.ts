import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdminSession } from '@/lib/auth';
import { canAdminAccessUser, RESTRICTED_USER_ID } from '@/lib/restricted-access';
import { query } from '@/lib/db';
import { FULFILLMENT_STATUSES, type FulfillmentStatus } from '@/lib/catalog-order-status';

type OrderRow = {
  id: number;
  total: number;
  status: string;
  fulfillment_status: string;
  payment_id: string | null;
  created_at: string;
  endereco: string | null;
  bairro: string;
  rua: string;
  cidade: string;
  numero: string | null;
  cep: string | null;
  complemento: string | null;
  seller_user_id: number | null;
  customer_name: string;
  customer_last_name: string;
  customer_email: string;
  items_summary: string;
  delivery_type: string | null;
  payment_method_type: string | null;
  cash_paid_amount: number | null;
  cash_change: number | null;
  customer_whatsapp: string | null;
};

function sellerFilterClause(useFiltered: boolean, uid: number | null, excludeRestricted: boolean): {
  sql: string;
  params: (number | string)[];
} {
  const parts: string[] = [];
  const params: (number | string)[] = [];

  if (useFiltered && uid != null) {
    parts.push(`(
      o.seller_user_id = ?
      OR EXISTS (
        SELECT 1 FROM catalog_order_items coi
        INNER JOIN products p ON p.id = coi.product_id
        WHERE coi.order_id = o.id AND p.user_id = ?
      )
    )`);
    params.push(uid, uid);
  }

  if (excludeRestricted) {
    parts.push(`NOT EXISTS (
      SELECT 1 FROM catalog_order_items coi2
      INNER JOIN products p2 ON p2.id = coi2.product_id
      WHERE coi2.order_id = o.id AND p2.user_id = ?
    )`);
    params.push(RESTRICTED_USER_ID);
  }

  if (parts.length === 0) return { sql: '', params: [] };
  return { sql: ` AND ${parts.join(' AND ')}`, params };
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const userId = (session.user as { id?: string }).id;
    const uidNum = userId != null && userId !== '' ? Number(userId) : NaN;
    let uid = Number.isFinite(uidNum) ? uidNum : null;
    const asAdmin = isAdminSession(session);
    if (uid == null && !asAdmin) return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const filterUserIdParam = searchParams.get('user_id');
    const adminFilteringUser = asAdmin && filterUserIdParam != null && filterUserIdParam !== '';
    if (adminFilteringUser) {
      const paramUid = parseInt(filterUserIdParam!, 10);
      if (Number.isFinite(paramUid)) {
        if (!canAdminAccessUser(userId, paramUid)) {
          return NextResponse.json({ error: 'Acesso negado a este usuário.' }, { status: 403 });
        }
        uid = paramUid;
      }
    }

    const useFilteredQuery = !asAdmin || adminFilteringUser;
    const excludeRestricted = asAdmin && !adminFilteringUser && !canAdminAccessUser(userId, RESTRICTED_USER_ID);
    const { sql: filterSql, params: filterParams } = sellerFilterClause(useFilteredQuery, uid, excludeRestricted);

    // Cancela pedidos com pagamento pendente há mais de 24 horas (somem do Kanban)
    await query(
      `UPDATE catalog_orders o
       SET status = 'cancelado'
       WHERE o.status = 'pendente'
         AND o.created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)${filterSql}`,
      filterParams
    );

    const rows = await query<OrderRow[]>(
      `SELECT o.id, o.total, o.status,
        COALESCE(o.fulfillment_status, 'pendente') AS fulfillment_status,
        o.payment_id, o.created_at, o.endereco, o.bairro, o.rua, o.cidade,
        o.numero, o.cep, o.complemento, o.seller_user_id,
        c.name AS customer_name, c.last_name AS customer_last_name, c.email AS customer_email,
        o.delivery_type, o.payment_method_type, o.cash_paid_amount, o.cash_change, o.customer_whatsapp,
        GROUP_CONCAT(CONCAT(COALESCE(p.name, 'Produto'), ' x', i.quantity) SEPARATOR ', ') AS items_summary
       FROM catalog_orders o
       INNER JOIN customers c ON c.id = o.customer_id
       LEFT JOIN catalog_order_items i ON i.order_id = o.id
       LEFT JOIN products p ON p.id = i.product_id
       WHERE o.status <> 'cancelado'${filterSql}
       GROUP BY o.id, o.total, o.status, o.fulfillment_status, o.payment_id, o.created_at,
         o.endereco, o.bairro, o.rua, o.cidade, o.numero, o.cep, o.complemento, o.seller_user_id,
         o.delivery_type, o.payment_method_type, o.cash_paid_amount, o.cash_change, o.customer_whatsapp,
         c.name, c.last_name, c.email
       ORDER BY o.created_at DESC
       LIMIT 200`,
      filterParams
    );

    const list = Array.isArray(rows) ? rows : [rows];
    const orders = list.map((o) => ({
      id: o.id,
      total: Number(o.total),
      status: o.status,
      fulfillment_status: (FULFILLMENT_STATUSES.includes(o.fulfillment_status as FulfillmentStatus)
        ? o.fulfillment_status
        : 'pendente') as FulfillmentStatus,
      payment_id: o.payment_id ?? null,
      created_at: o.created_at,
      address: {
        full: o.endereco,
        rua: o.rua,
        numero: o.numero,
        bairro: o.bairro,
        cidade: o.cidade,
        cep: o.cep,
        complemento: o.complemento,
      },
      customer: {
        name: `${o.customer_name} ${o.customer_last_name || ''}`.trim(),
        email: o.customer_email,
      },
      items_summary: o.items_summary || '',
      delivery_type: o.delivery_type || 'entrega',
      payment_method_type: o.payment_method_type || 'pix',
      cash_paid_amount: o.cash_paid_amount != null ? Number(o.cash_paid_amount) : null,
      cash_change: o.cash_change != null ? Number(o.cash_change) : null,
      customer_whatsapp: o.customer_whatsapp,
    }));

    const byStatus = Object.fromEntries(FULFILLMENT_STATUSES.map((s) => [s, [] as typeof orders]));
    for (const order of orders) {
      const key = order.fulfillment_status in byStatus ? order.fulfillment_status : 'pendente';
      byStatus[key].push(order);
    }

    return NextResponse.json({ orders, byStatus });
  } catch (err) {
    console.error('Admin catalog orders GET:', err);
    return NextResponse.json({ error: 'Erro ao carregar pedidos' }, { status: 500 });
  }
}
