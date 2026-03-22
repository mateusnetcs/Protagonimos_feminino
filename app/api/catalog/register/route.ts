import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, last_name, email, password, birth_date, user_id: catalogUserId } = body;
    if (!name || !last_name || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, sobrenome, email e senha são obrigatórios.' },
        { status: 400 }
      );
    }
    const hash = await bcrypt.hash(password, 10);
    const insert = await query<{ insertId: number }>(
      `INSERT INTO customers (name, last_name, email, password_hash, birth_date) VALUES (?, ?, ?, ?, ?)`,
      [name.trim(), last_name?.trim() || '', email.trim().toLowerCase(), hash, birth_date || null]
    );
    const customerId = (insert as { insertId?: number })?.insertId;
    if (customerId && catalogUserId) {
      const uid = parseInt(String(catalogUserId), 10);
      if (Number.isFinite(uid)) {
        try {
          await query(
            'INSERT INTO customer_catalog_access (customer_id, user_id) VALUES (?, ?)',
            [customerId, uid]
          );
        } catch (err) {
          console.error('Erro ao registrar acesso ao catálogo:', err);
          return NextResponse.json(
            { error: 'Erro ao vincular ao catálogo. Verifique se a tabela customer_catalog_access existe.' },
            { status: 500 }
          );
        }
      }
    }
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'ER_DUP_ENTRY'
      ? 'Email já cadastrado.'
      : 'Erro ao cadastrar.';
    console.error('Register error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
