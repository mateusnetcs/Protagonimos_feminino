import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createSessionCookie, getSessionCookieHeader } from '@/lib/customer-auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios.' }, { status: 400 });
    }
    const rows = await query<{ id: number; email: string; name: string; last_name: string; password_hash: string }[]>(
      'SELECT id, email, name, last_name, password_hash FROM customers WHERE email = ?',
      [String(email).trim().toLowerCase()]
    );
    const c = Array.isArray(rows) ? rows[0] : rows;
    if (!c) {
      return NextResponse.json({ error: 'Email não cadastrado.' }, { status: 401 });
    }
    const valid = await bcrypt.compare(String(password), c.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
    }
    let extra: Record<string, unknown> = {};
    try {
      const ext = await query<{ photo_url?: string | null; cidade?: string | null; bairro?: string | null; rua?: string | null; numero?: string | null; cep?: string | null; complemento?: string | null }[]>(
        'SELECT photo_url, cidade, bairro, rua, numero, cep, complemento FROM customers WHERE id = ?',
        [c.id]
      );
      const e = Array.isArray(ext) ? ext[0] : ext;
      if (e) extra = e as Record<string, unknown>;
    } catch {
      // Colunas de perfil podem não existir ainda
    }
    const payload = createSessionCookie({
      id: c.id,
      email: c.email,
      name: c.name,
      last_name: c.last_name,
      photo_url: (extra.photo_url as string | null) ?? null,
      cidade: (extra.cidade as string | null) ?? null,
      bairro: (extra.bairro as string | null) ?? null,
      rua: (extra.rua as string | null) ?? null,
      numero: (extra.numero as string | null) ?? null,
      cep: (extra.cep as string | null) ?? null,
      complemento: (extra.complemento as string | null) ?? null,
    });
    const res = NextResponse.json({ ok: true });
    res.headers.set('Set-Cookie', getSessionCookieHeader(payload));
    return res;
  } catch (err) {
    console.error('Catalog login:', err);
    return NextResponse.json({ error: 'Erro ao entrar.' }, { status: 500 });
  }
}
