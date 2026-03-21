import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('payment_id');
    if (!paymentId) {
      return NextResponse.json({ error: 'payment_id obrigatório' }, { status: 400 });
    }

    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'Mercado Pago não configurado' }, { status: 500 });
    }

    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payment = await res.json();
    if (!res.ok) {
      return NextResponse.json({ status: 'error', error: payment.message }, { status: 200 });
    }

    const status = payment.status;
    if (status === 'approved') {
      await query(
        'UPDATE catalog_orders SET status = ? WHERE payment_id = ?',
        ['pago', paymentId]
      );
      return NextResponse.json({ status: 'approved' });
    }

    return NextResponse.json({
      status: status === 'pending' || status === 'in_process' ? 'pending' : status,
    });
  } catch (err) {
    console.error('Payment status error:', err);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
