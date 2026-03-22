import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customer-auth';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

/** Vincula o cliente logado a um novo catálogo (usando os mesmos dados, só confirma a senha). */
export async function POST(request: Request) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ error: 'Faça login primeiro.' }, { status: 401 });
    }
    const body = await request.json();
    const { user_id: catalogUserId, password } = body;
    if (!catalogUserId || !password) {
      return NextResponse.json({ error: 'Catálogo e senha são obrigatórios.' }, { status: 400 });
    }
    const uid = parseInt(String(catalogUserId), 10);
    if (!Number.isFinite(uid)) {
      return NextResponse.json({ error: 'Catálogo inválido.' }, { status: 400 });
    }
    const rows = await query<{ password_hash: string }[]>(
      'SELECT password_hash FROM customers WHERE id = ?',
      [session.id]
    );
    const c = Array.isArray(rows) ? rows[0] : rows;
    if (!c) {
      return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 });
    }
    const valid = await bcrypt.compare(String(password), c.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
    }
    await query(
      'INSERT INTO customer_catalog_access (customer_id, user_id) VALUES (?, ?)',
      [session.id, uid]
    );
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Você já tem acesso a este catálogo.' }, { status: 400 });
    }
    console.error('Add catalog access:', err);
    return NextResponse.json({ error: 'Erro ao vincular catálogo.' }, { status: 500 });
  }
}
