import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });
    }

    const body = await request.json();
    const amount = Number(body.amount);
    const description = typeof body.description === 'string' ? body.description : 'Venda PDV';

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
    }

    const rows = await query<{ access_token: string }[]>(
      'SELECT access_token FROM user_mercadopago WHERE user_id = ? LIMIT 1',
      [userId]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: 'Mercado Pago não conectado. Conecte sua conta nas configurações do PDV.' },
        { status: 400 }
      );
    }

    const accessToken = rows[0].access_token;
    const rawEmail = (session.user.email as string)?.trim() || '';
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail);
    const payerEmail = isValidEmail ? rawEmail : 'comprador@consumidor.com';
    const idempotencyKey = randomUUID();

    const res = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        transaction_amount: Math.round(amount * 100) / 100,
        description: description.substring(0, 255),
        payment_method_id: 'pix',
        payer: { email: payerEmail },
      }),
    });

    const payment = await res.json();

    if (!res.ok) {
      const msg = payment.message || payment.error || payment.cause?.[0]?.description || 'Erro ao gerar PIX via Mercado Pago.';
      console.error('MP Pix error:', payment);
      return NextResponse.json(
        { error: msg, fallback_to_chave: true },
        { status: 502 }
      );
    }

    const qr = payment.point_of_interaction?.transaction_data;
    if (!qr || (!qr.qr_code_base64 && !qr.qr_code)) {
      return NextResponse.json(
        { error: 'Resposta inválida do PIX do Mercado Pago.', fallback_to_chave: true },
        { status: 502 }
      );
    }

    return NextResponse.json({
      qr_code_base64: qr.qr_code_base64 || null,
      qr_code: qr.qr_code || null,
      payment_id: payment.id,
    });
  } catch (err) {
    console.error('MP Pix error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao gerar PIX', fallback_to_chave: true },
      { status: 502 }
    );
  }
}
