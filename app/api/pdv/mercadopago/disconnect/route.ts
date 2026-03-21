import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ ok: true });
    }

    await query('DELETE FROM user_mercadopago WHERE user_id = ?', [userId]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('MP Disconnect error:', err);
    return NextResponse.json({ error: 'Erro ao desconectar' }, { status: 500 });
  }
}
