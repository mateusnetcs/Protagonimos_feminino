import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getCustomerSession, createSessionCookie, getSessionCookieHeader } from '@/lib/customer-auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB para foto de perfil

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  return NextResponse.json(session);
}

export async function PATCH(request: Request) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const contentType = request.headers.get('content-type') || '';
  let body: { old_password?: string; new_password?: string; cidade?: string; bairro?: string; rua?: string; numero?: string; cep?: string; complemento?: string } = {};

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    body = {
      old_password: formData.get('old_password') as string | undefined,
      new_password: formData.get('new_password') as string | undefined,
      cidade: formData.get('cidade') as string | undefined,
      bairro: formData.get('bairro') as string | undefined,
      rua: formData.get('rua') as string | undefined,
      numero: formData.get('numero') as string | undefined,
      cep: formData.get('cep') as string | undefined,
      complemento: formData.get('complemento') as string | undefined,
    };
    const file = formData.get('photo') as File | null;
    if (file && file instanceof File && file.size > 0) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: 'Formato não permitido. Use JPG, PNG, WebP ou GIF.' }, { status: 400 });
      }
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: 'Imagem muito grande. Máximo 2MB.' }, { status: 400 });
      }
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = path.extname(file.name) || '.jpg';
      const filename = `customer-${session.id}-${Date.now()}${ext}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'customers');
      await mkdir(uploadDir, { recursive: true });
      const filepath = path.join(uploadDir, filename);
      await writeFile(filepath, buffer);
      const url = `/uploads/customers/${filename}`;
      try {
        await query('UPDATE customers SET photo_url = ? WHERE id = ?', [url, session.id]);
      } catch {
        return NextResponse.json({ error: 'Migração de perfil não executada. Rode: npm run db:migrate-customer-profile' }, { status: 500 });
      }
    }
  } else {
    body = await request.json().catch(() => ({}));
  }

  const addrKeys = ['cidade', 'bairro', 'rua', 'numero', 'cep', 'complemento'] as const;
  const hasAddr = addrKeys.some((k) => body[k] !== undefined);
  if (hasAddr) {
    try {
      const updates = addrKeys.map((k) => `${k} = ?`).join(', ');
      const vals = addrKeys.map((k) => (body[k] !== undefined ? body[k] : (session as Record<string, unknown>)[k]) ?? null);
      await query(`UPDATE customers SET ${updates} WHERE id = ?`, [...vals, session.id]);
    } catch {
      // Colunas de endereço podem não existir
    }
  }

  if (body.old_password && body.new_password) {
    const rows = await query<{ password_hash: string }[]>(
      'SELECT password_hash FROM customers WHERE id = ?',
      [session.id]
    );
    const c = Array.isArray(rows) ? rows[0] : rows;
    if (!c) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    const valid = await bcrypt.compare(body.old_password, c.password_hash);
    if (!valid) return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 400 });
    const hash = await bcrypt.hash(body.new_password, 10);
    await query('UPDATE customers SET password_hash = ? WHERE id = ?', [hash, session.id]);
  }

  let newSession = { ...session };
  try {
    const rows = await query<{ name: string; last_name: string; email: string; photo_url?: string | null; cidade?: string | null; bairro?: string | null; rua?: string | null; numero?: string | null; cep?: string | null; complemento?: string | null }[]>(
      'SELECT name, last_name, email, photo_url, cidade, bairro, rua, numero, cep, complemento FROM customers WHERE id = ?',
      [session.id]
    );
    const u = Array.isArray(rows) ? rows[0] : rows;
    if (u) {
      newSession = {
        ...session,
        name: u.name,
        last_name: u.last_name,
        email: u.email,
        photo_url: u.photo_url ?? null,
        cidade: u.cidade ?? null,
        bairro: u.bairro ?? null,
        rua: u.rua ?? null,
        numero: u.numero ?? null,
        cep: u.cep ?? null,
        complemento: u.complemento ?? null,
      };
    } else {
      const base = await query<{ name: string; last_name: string; email: string }[]>(
        'SELECT name, last_name, email FROM customers WHERE id = ?',
        [session.id]
      );
      const b = Array.isArray(base) ? base[0] : base;
      if (b) newSession = { ...session, ...b };
    }
  } catch {
    // Usa sessão atual
  }
  const payload = createSessionCookie(newSession);
  const res = NextResponse.json({ ok: true, customer: newSession });
  res.headers.set('Set-Cookie', getSessionCookieHeader(payload));
  return res;
}
