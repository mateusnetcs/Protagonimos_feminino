import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ connected: false, error: 'Não autorizado' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ connected: false }, { status: 200 });
    }

    const rows = await query<{ id: number }[]>(
      'SELECT id FROM user_mercadopago WHERE user_id = ? LIMIT 1',
      [userId]
    );

    const connected = Array.isArray(rows) && rows.length > 0;
    return NextResponse.json({ connected });
  } catch (err) {
    console.error('MP Status error:', err);
    return NextResponse.json({ connected: false }, { status: 200 });
  }
}
