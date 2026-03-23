import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdminSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rows = await query<any[]>(
      'SELECT id, title, is_active, config_json, created_at, updated_at FROM questionnaires WHERE id = ?',
      [id]
    );
    const q = Array.isArray(rows) ? rows[0] : rows;
    if (!q) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    const config = typeof q.config_json === 'string' ? JSON.parse(q.config_json || 'null') : q.config_json;
    return NextResponse.json({ ...q, id: String(q.id), config_json: config });
  } catch (err) {
    console.error('Questionnaire get error:', err);
    return NextResponse.json({ error: 'Erro ao carregar.' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (!isAdminSession(session)) return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();

    if (body.title !== undefined) {
      await query('UPDATE questionnaires SET title = ? WHERE id = ?', [
        String(body.title).trim() || 'Questionário',
        id,
      ]);
    }
    if (body.is_active !== undefined) {
      await query('UPDATE questionnaires SET is_active = ? WHERE id = ?', [
        body.is_active ? 1 : 0,
        id,
      ]);
    }
    if (body.config_json !== undefined) {
      const cfg = typeof body.config_json === 'string' ? body.config_json : JSON.stringify(body.config_json);
      await query('UPDATE questionnaires SET config_json = ? WHERE id = ?', [cfg, id]);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Questionnaire update error:', err);
    return NextResponse.json({ error: 'Erro ao salvar.' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (!isAdminSession(session)) return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });

    const { id } = await params;
    await query('DELETE FROM questionnaires WHERE id = ?', [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Questionnaire delete error:', err);
    return NextResponse.json({ error: 'Erro ao excluir.' }, { status: 500 });
  }
}
