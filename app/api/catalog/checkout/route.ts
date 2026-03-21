import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { getCustomerSession } from '@/lib/customer-auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer: cust, address, items, payment_method } = body;

    if (!cust || !address || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
    }

    const { name, last_name, email, customer_id: bodyCustomerId } = cust;
    const { cidade, bairro, rua, numero, cep, complemento } = address;

    if (!cidade || !bairro || !rua || !numero) {
      return NextResponse.json({ error: 'Preencha Cidade, Bairro, Rua e Número.' }, { status: 400 });
    }

    const method = payment_method === 'cartao' ? 'cartao' : 'pix';
    if (!['pix', 'cartao'].includes(method)) {
      return NextResponse.json({ error: 'Selecione Pix ou Cartão.' }, { status: 400 });
    }

    let customerId: number;

    const session = await getCustomerSession();
    if (session && bodyCustomerId && Number(bodyCustomerId) === session.id) {
      customerId = session.id;
      try {
        await query(
          'UPDATE customers SET cidade = ?, bairro = ?, rua = ?, numero = ?, cep = ?, complemento = ? WHERE id = ?',
          [cidade.trim(), bairro.trim(), rua.trim(), String(numero).trim(), (cep || '').trim(), (complemento || '').trim(), customerId]
        );
      } catch {
        // Colunas de endereço podem não existir ainda; continua normalmente
      }
    } else {
      if (!name || !last_name || !email) {
        return NextResponse.json({ error: 'Preencha nome, sobrenome e email.' }, { status: 400 });
      }
      const emailNorm = email.trim().toLowerCase();
      const existing = await query<{ id: number }[]>(
        'SELECT id FROM customers WHERE email = ?',
        [emailNorm]
      );
      if (Array.isArray(existing) && existing.length > 0) {
        return NextResponse.json(
          { error: 'Este email já está cadastrado. Faça login no cabeçalho para usar seu endereço salvo.' },
          { status: 400 }
        );
      }
      const guestHash = await bcrypt.hash(randomUUID() + Date.now(), 10);
      const insert = await query<{ insertId: number }>(
        `INSERT INTO customers (name, last_name, email, password_hash, birth_date, cidade, bairro, rua, numero, cep, complemento) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name.trim(), last_name?.trim() || '', emailNorm, guestHash, null, cidade.trim(), bairro.trim(), rua.trim(), String(numero).trim(), (cep || '').trim(), (complemento || '').trim()]
      );
      customerId = (insert as { insertId: number }).insertId;
      if (!customerId) {
        return NextResponse.json({ error: 'Erro ao registrar dados. Tente novamente.' }, { status: 500 });
      }
    }

    let total = 0;
    for (const it of items) {
      total += Number(it.quantity || 0) * Number(it.unit_price || 0);
    }

    const desc = items.map((i: { title: string; quantity: number }) => `${i.title} x${i.quantity}`).join(', ');
    const enderecoFull = `${rua}, ${numero}${complemento ? ', ' + complemento : ''} - ${bairro}, ${cidade}${cep ? ' - CEP ' + cep : ''}`;

    const orderResult = await query<{ insertId: number }>(
      `INSERT INTO catalog_orders (customer_id, endereco, bairro, rua, cidade, numero, cep, complemento, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente')`,
      [customerId, enderecoFull, bairro.trim(), rua.trim(), cidade.trim(), String(numero).trim(), (cep || '').trim(), (complemento || '').trim(), total]
    );
    const orderId = (orderResult as { insertId: number }).insertId;
    if (!orderId) throw new Error('Erro ao criar pedido');

    for (const it of items) {
      await query(
        `INSERT INTO catalog_order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)`,
        [orderId, it.product_id, Number(it.quantity), Number(it.unit_price)]
      );
    }

    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: 'Mercado Pago não configurado. Adicione MERCADOPAGO_ACCESS_TOKEN no .env.local' },
        { status: 500 }
      );
    }

    const payerEmail = cust.email?.trim().toLowerCase();
    const idempotencyKey = randomUUID();

    if (method === 'pix') {
      const res = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          transaction_amount: total,
          description: desc.substring(0, 255),
          payment_method_id: 'pix',
          payer: { email: payerEmail },
        }),
      });
      const payment = await res.json();
      if (!res.ok) {
        console.error('MP Pix error:', payment);
        return NextResponse.json(
          { error: payment.message || payment.error || 'Erro ao gerar Pix.' },
          { status: 500 }
        );
      }
      const qr = payment.point_of_interaction?.transaction_data;
      if (!qr) {
        return NextResponse.json({ error: 'Resposta inválida do Pix.' }, { status: 500 });
      }
      await query('UPDATE catalog_orders SET payment_id = ? WHERE id = ?', [payment.id?.toString(), orderId]);
      return NextResponse.json({
        type: 'pix',
        order_id: orderId,
        qr_code_base64: qr.qr_code_base64,
        qr_code: qr.qr_code,
        payment_id: payment.id,
      });
    }

    if (method === 'cartao') {
      const cardToken = body.card_token;
      if (!cardToken) {
        return NextResponse.json({ error: 'Token do cartão não enviado.' }, { status: 400 });
      }
      const res = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          transaction_amount: total,
          token: cardToken,
          description: desc.substring(0, 255),
          installments: 1,
          payment_method_id: body.payment_method_id || 'visa',
          payer: {
            email: payerEmail,
            identification: body.payer_identification ? { type: 'CPF', number: body.payer_identification } : undefined,
          },
        }),
      });
      const payment = await res.json();
      if (!res.ok) {
        console.error('MP Card error:', payment);
        return NextResponse.json(
          { error: payment.message || payment.cause?.[0]?.description || 'Erro no pagamento.' },
          { status: 500 }
        );
      }
      await query('UPDATE catalog_orders SET payment_id = ?, status = ? WHERE id = ?', [
        payment.id?.toString(),
        payment.status === 'approved' ? 'pago' : 'pendente',
        orderId,
      ]);
      return NextResponse.json({
        type: 'cartao',
        order_id: orderId,
        status: payment.status,
        payment_id: payment.id,
      });
    }

    return NextResponse.json({ error: 'Método inválido.' }, { status: 400 });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao processar.' },
      { status: 500 }
    );
  }
}
