import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/** Confirma pedido após retorno do Checkout Pro (útil em localhost sem webhook). */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');
    const status = searchParams.get('payment');

    if (!orderId || !/^\d+$/.test(orderId)) {
      return NextResponse.json({ error: 'order_id inválido' }, { status: 400 });
    }

    if (status === 'success' || status === 'approved') {
      await query(
        `UPDATE catalog_orders SET status = 'pago', fulfillment_status = 'confirmado' WHERE id = ? AND status = 'pendente'`,
        [Number(orderId)]
      );
      return NextResponse.json({ ok: true, fulfillment_status: 'confirmado' });
    }

    return NextResponse.json({ ok: true, skipped: true });
  } catch (err) {
    console.error('confirm-return:', err);
    return NextResponse.json({ error: 'Erro ao confirmar pedido' }, { status: 500 });
  }
}
