import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const userId = (session.user as { id?: string }).id;
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

    await query('DELETE FROM post_gallery WHERE id = ? AND user_id = ?', [id, userId]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Gallery delete error:', err);
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 });
  }
}
