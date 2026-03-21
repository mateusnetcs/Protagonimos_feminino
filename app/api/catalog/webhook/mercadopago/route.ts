import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * Webhook do Mercado Pago - notificações de pagamento.
 * Configure em: https://www.mercadopago.com.br/developers/panel/app > Webhooks
 * URL: https://seu-dominio.com/api/catalog/webhook/mercadopago
 * Evento: Payments (payment)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data } = body;
    if (type !== 'payment' || !data?.id) {
      return NextResponse.json({ ok: true });
    }
    const paymentId = String(data.id);

    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) return NextResponse.json({ ok: true });

    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payment = await res.json();
    if (!res.ok || payment.status !== 'approved') {
      return NextResponse.json({ ok: true });
    }

    await query(
      'UPDATE catalog_orders SET status = ? WHERE payment_id = ?',
      ['pago', paymentId]
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
