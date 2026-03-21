import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdminSession } from '@/lib/auth';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (!isAdminSession(session)) return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 });

    const rows = await query<{ id: number; email: string; name: string | null; role: string }[]>(
      'SELECT id, email, name, role FROM users ORDER BY name, email'
    );
    const data = Array.isArray(rows) ? rows : [rows];
    return NextResponse.json(data.map((u) => ({ ...u, id: String(u.id) })));
  } catch (err) {
    console.error('Users list error:', err);
    return NextResponse.json({ error: 'Erro ao listar usuários' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (!isAdminSession(session)) return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 });

    const body = await request.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const name = String(body.name ?? '').trim();
    const password = String(body.password ?? '');
    const role = body.role === 'admin' ? 'admin' : 'geral';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Senha deve ter no mínimo 6 caracteres' }, { status: 400 });
    }

    const existing = await query<{ id: number }[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json({ error: 'Este e-mail já está cadastrado' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await query(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
      [email, passwordHash, name || email.split('@')[0], role]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('User create error:', err);
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 });
  }
}
