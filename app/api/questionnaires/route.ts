import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdminSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (!isAdminSession(session)) return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });

    const rows = await query<any[]>(
      'SELECT id, title, is_active, created_at, updated_at FROM questionnaires ORDER BY created_at DESC'
    );
    const data = Array.isArray(rows) ? rows : [rows];
    return NextResponse.json(data.map((q) => ({ ...q, id: String(q.id) })));
  } catch (err) {
    console.error('Questionnaires list error:', err);
    return NextResponse.json({ error: 'Erro ao carregar.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (!isAdminSession(session)) return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });

    const body = await request.json();
    const title = (body.title || 'Novo questionário').trim();

    const result = await query<{ insertId: number }>(
      'INSERT INTO questionnaires (title, is_active) VALUES (?, 1)',
      [title]
    );
    const id = (result as { insertId?: number })?.insertId;
    return NextResponse.json({ ok: true, id: id ? String(id) : null });
  } catch (err) {
    console.error('Questionnaire create error:', err);
    return NextResponse.json({ error: 'Erro ao criar.' }, { status: 500 });
  }
}
