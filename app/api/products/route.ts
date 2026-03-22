import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdminSession } from '@/lib/auth';
import { getCustomerSession, getCustomerSessionFromRequest } from '@/lib/customer-auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const scopePublic = url.searchParams.get('scope') === 'public';
    const filterUserIdParam = url.searchParams.get('user_id');

    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as { id?: string }).id : null;
    const uidNum = userId != null && userId !== '' ? Number(userId) : NaN;
    const uid = Number.isFinite(uidNum) ? uidNum : null;

    // Catálogo público: filtrar por user_id quando informado (link personalizado)
    // SEMPRE verificar acesso do customer quando scope=public (admin não bypassa)
    const publicUserFilter =
      scopePublic &&
      filterUserIdParam != null &&
      filterUserIdParam !== '';
    const publicUid = publicUserFilter ? parseInt(filterUserIdParam, 10) : NaN;
    const publicUidToFilter = Number.isFinite(publicUid) ? publicUid : null;

    // Admin/produtor (painel): filtrar por user_id (só quando NÃO é catálogo público)
    const filterByUser =
      !scopePublic &&
      uid != null &&
      !isAdminSession(session);
    const filterByParam =
      !scopePublic &&
      isAdminSession(session) &&
      filterUserIdParam != null &&
      filterUserIdParam !== '';
    const paramUid = filterByParam ? parseInt(filterUserIdParam, 10) : NaN;
    const uidToFilter = Number.isFinite(paramUid) ? paramUid : null;

    const showInCatalogFilter = scopePublic ? ' AND COALESCE(show_in_catalog, 1) = 1' : '';
    let whereClause = 'status = \'ativo\'' + showInCatalogFilter;
    let params: (string | number)[] = [];
    if (publicUserFilter && publicUidToFilter != null) {
      // Catálogo de um produtor: verificar se customer logado tem acesso
      // Usar cookies() do Next.js como fonte principal (mais confiável em Route Handlers)
      const customerSession = await getCustomerSession() ?? getCustomerSessionFromRequest(request);
      if (customerSession) {
        const accessRows = await query<{ n: number }[]>(
          'SELECT 1 as n FROM customer_catalog_access WHERE customer_id = ? AND user_id = ? LIMIT 1',
          [customerSession.id, publicUidToFilter]
        );
        const hasAccess = Array.isArray(accessRows) && accessRows.length > 0;
        if (!hasAccess) {
          return NextResponse.json(
            { error: 'access_denied', message: 'Você não tem acesso a este catálogo. Seu cadastro é válido apenas para o catálogo em que você se registrou.' },
            { status: 403 }
          );
        }
      }
      whereClause = 'status = \'ativo\' AND user_id = ?' + showInCatalogFilter;
      params = [publicUidToFilter];
    } else if (filterByUser) {
      whereClause = 'status = \'ativo\' AND user_id = ?';
      params = [uid];
    } else if (filterByParam && uidToFilter != null) {
      whereClause = 'status = \'ativo\' AND user_id = ?';
      params = [uidToFilter];
    }

    const rows = await query<any[]>(
      `SELECT id, name, category, description, stock_current, stock_min, cost_cmv, price_sale, image_url, show_in_catalog FROM products WHERE ${whereClause} ORDER BY name`,
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

    const showInCatalog = body.show_in_catalog !== false ? 1 : 0;
    await query(
      `INSERT INTO products (name, category, description, stock_current, stock_min, cost_cmv, price_sale, image_url, user_id, show_in_catalog) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [body.name ?? '', body.category || null, body.description || null, body.stock_current ?? 0, body.stock_min ?? 0, body.cost_cmv ?? 0, body.price_sale ?? 0, body.image_url || null, uid, showInCatalog]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Product create error:', err);
    return NextResponse.json({ error: 'Erro ao cadastrar.' }, { status: 500 });
  }
}
