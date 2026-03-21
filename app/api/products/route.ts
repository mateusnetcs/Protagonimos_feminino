import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdminSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request?: Request) {
  try {
    const url = request?.url ? new URL(request.url) : null;
    const scopePublic = url?.searchParams.get('scope') === 'public';
    const filterUserIdParam = url?.searchParams.get('user_id');

    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as { id?: string }).id : null;
    const uidNum = userId != null && userId !== '' ? Number(userId) : NaN;
    const uid = Number.isFinite(uidNum) ? uidNum : null;

    // Admin pode filtrar por user_id específico
    const filterByUser =
      !scopePublic &&
      uid != null &&
      !isAdminSession(session);
    const filterByParam =
      isAdminSession(session) &&
      filterUserIdParam != null &&
      filterUserIdParam !== '';
    const paramUid = filterByParam ? parseInt(filterUserIdParam, 10) : NaN;
    const uidToFilter = Number.isFinite(paramUid) ? paramUid : null;

    let whereClause = 'status = \'ativo\'';
    let params: (string | number)[] = [];
    if (filterByUser) {
      whereClause = 'status = \'ativo\' AND user_id = ?';
      params = [uid];
    } else if (filterByParam && uidToFilter != null) {
      whereClause = 'status = \'ativo\' AND user_id = ?';
      params = [uidToFilter];
    }

    const rows = await query<any[]>(
      `SELECT id, name, category, description, stock_current, stock_min, cost_cmv, price_sale, image_url FROM products WHERE ${whereClause} ORDER BY name`,
      params
    );
    const data = Array.isArray(rows) ? rows : [rows];
    return NextResponse.json(data.map((p) => ({ ...p, id: String(p.id) })));
  } catch (err) {
    console.error('Products error:', err);
    return NextResponse.json({ error: 'Erro ao carregar.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const userId = (session.user as { id?: string }).id;
    const uidNum = userId != null && userId !== '' ? Number(userId) : NaN;
    const uid = Number.isFinite(uidNum) ? uidNum : null;

    const body = await request.json();

    await query(
      `INSERT INTO products (name, category, description, stock_current, stock_min, cost_cmv, price_sale, image_url, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [body.name ?? '', body.category || null, body.description || null, body.stock_current ?? 0, body.stock_min ?? 0, body.cost_cmv ?? 0, body.price_sale ?? 0, body.image_url || null, uid]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Product create error:', err);
    return NextResponse.json({ error: 'Erro ao cadastrar.' }, { status: 500 });
  }
}
