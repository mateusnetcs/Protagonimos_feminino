import { NextResponse } from 'next/server';
import { getCustomerSession, getCustomerSessionFromRequest } from '@/lib/customer-auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Debug: retorna sessão do customer e acessos. Remova em produção. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const catalogUserId = url.searchParams.get('user_id');
  const fromRequest = getCustomerSessionFromRequest(request);
  const fromCookies = await getCustomerSession();

  const session = fromRequest ?? fromCookies;
  let access: { user_id: number }[] = [];

  if (session) {
    const rows = await query<{ user_id: number }[]>(
      'SELECT user_id FROM customer_catalog_access WHERE customer_id = ?',
      [session.id]
    );
    access = Array.isArray(rows) ? rows : [rows];
  }

  const hasAccessToCatalog = catalogUserId
    ? access.some((a) => String(a.user_id) === catalogUserId)
    : null;

  return NextResponse.json({
    session: session ? { id: session.id, email: session.email } : null,
    fromRequest: !!fromRequest,
    fromCookies: !!fromCookies,
    catalog_user_id_param: catalogUserId,
    my_access: access,
    hasAccessToCatalog,
  });
}
