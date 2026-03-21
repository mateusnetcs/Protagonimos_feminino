import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('payment_id');
    if (!paymentId) {
      return NextResponse.json({ error: 'payment_id obrigatório' }, { status: 400 });
    }

    const rows = await query<{ access_token: string }[]>(
      'SELECT access_token FROM user_mercadopago WHERE user_id = ? LIMIT 1',
      [userId]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Mercado Pago não conectado' }, { status: 400 });
    }

    const accessToken = rows[0].access_token;
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const payment = await res.json();

    if (!res.ok) {
      return NextResponse.json({ status: 'error', error: payment.message }, { status: 200 });
    }

    const status = payment.status;
    if (status === 'approved') {
      return NextResponse.json({ status: 'approved' });
    }

    return NextResponse.json({
      status: status === 'pending' || status === 'in_process' ? 'pending' : status,
    });
  } catch (err) {
    console.error('PDV payment-status error:', err);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
