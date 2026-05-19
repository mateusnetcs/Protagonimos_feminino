import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { getCustomerSession } from '@/lib/customer-auth';
import { whatsappDigits } from '@/lib/phone';

type DeliveryType = 'entrega' | 'retirada';
type PaymentMethod = 'dinheiro' | 'pix' | 'cartao';

function pickAddress(
  deliveryType: DeliveryType,
  address: {
    cidade?: string;
    bairro?: string;
    rua?: string;
    numero?: string;
    cep?: string;
    complemento?: string;
  }
) {
  if (deliveryType === 'retirada') {
    return {
      enderecoFull: 'Retirada no local',
      cidade: 'Retirada',
      bairro: 'Retirada',
      rua: 'Retirada no local',
      numero: '-',
      cep: '',
      complemento: '',
    };
  }
  const { cidade, bairro, rua, numero, cep, complemento } = address;
  if (!cidade || !bairro || !rua || !numero) {
    return null;
  }
  const enderecoFull = `${rua}, ${numero}${complemento ? ', ' + complemento : ''} - ${bairro}, ${cidade}${cep ? ' - CEP ' + cep : ''}`;
  return {
    enderecoFull,
    cidade: cidade.trim(),
    bairro: bairro.trim(),
    rua: rua.trim(),
    numero: String(numero).trim(),
    cep: (cep || '').trim(),
    complemento: (complemento || '').trim(),
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customer: cust,
      address = {},
      items,
      payment_method,
      seller_user_id: sellerUserId,
      delivery_type: deliveryTypeRaw,
      cash_paid_amount: cashPaidRaw,
      customer_whatsapp: whatsappRaw,
    } = body;

    if (!cust || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
    }

    const deliveryType: DeliveryType = deliveryTypeRaw === 'retirada' ? 'retirada' : 'entrega';
    const method: PaymentMethod =
      payment_method === 'dinheiro' ? 'dinheiro' : payment_method === 'cartao' ? 'cartao' : 'pix';

    if (!['dinheiro', 'pix', 'cartao'].includes(method)) {
      return NextResponse.json({ error: 'Forma de pagamento inválida.' }, { status: 400 });
    }

    const addr = pickAddress(deliveryType, address);
    if (!addr) {
      return NextResponse.json({ error: 'Preencha Cidade, Bairro, Rua e Número.' }, { status: 400 });
    }

    if (deliveryType === 'entrega') {
      const wa = whatsappDigits(String(whatsappRaw || ''));
      if (wa.length !== 11) {
        return NextResponse.json({ error: 'Informe o WhatsApp no formato (99) 99999-9999.' }, { status: 400 });
      }
    }

    let cashPaid: number | null = null;
    let cashChange: number | null = null;
    if (method === 'dinheiro') {
      cashPaid = Number(cashPaidRaw);
      if (!Number.isFinite(cashPaid) || cashPaid <= 0) {
        return NextResponse.json({ error: 'Informe o valor da nota/cédula.' }, { status: 400 });
      }
    }

    const { name, last_name, email, customer_id: bodyCustomerId } = cust;
    let customerId: number;

    const session = await getCustomerSession();
    if (session && bodyCustomerId && Number(bodyCustomerId) === session.id) {
      customerId = session.id;
      if (deliveryType === 'entrega') {
        try {
          await query(
            'UPDATE customers SET cidade = ?, bairro = ?, rua = ?, numero = ?, cep = ?, complemento = ? WHERE id = ?',
            [addr.cidade, addr.bairro, addr.rua, addr.numero, addr.cep, addr.complemento, customerId]
          );
        } catch {
          /* colunas opcionais */
        }
      }
    } else {
      if (!name || !last_name || !email) {
        return NextResponse.json({ error: 'Preencha nome, sobrenome e email.' }, { status: 400 });
      }
      const emailNorm = email.trim().toLowerCase();
      const existing = await query<{ id: number }[]>('SELECT id FROM customers WHERE email = ?', [emailNorm]);
      if (Array.isArray(existing) && existing.length > 0) {
        return NextResponse.json(
          { error: 'Este email já está cadastrado. Faça login no cabeçalho para usar seu endereço salvo.' },
          { status: 400 }
        );
      }
      const guestHash = await bcrypt.hash(randomUUID() + Date.now(), 10);
      const insert = await query<{ insertId: number }>(
        `INSERT INTO customers (name, last_name, email, password_hash, birth_date, cidade, bairro, rua, numero, cep, complemento)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name.trim(),
          last_name?.trim() || '',
          emailNorm,
          guestHash,
          null,
          addr.cidade,
          addr.bairro,
          addr.rua,
          addr.numero,
          addr.cep,
          addr.complemento,
        ]
      );
      customerId = (insert as { insertId: number }).insertId;
      if (!customerId) {
        return NextResponse.json({ error: 'Erro ao registrar dados.' }, { status: 500 });
      }
    }

    let total = 0;
    for (const it of items) {
      total += Number(it.quantity || 0) * Number(it.unit_price || 0);
    }

    if (method === 'dinheiro' && cashPaid != null && cashPaid < total) {
      return NextResponse.json(
        { error: `O valor informado (${cashPaid.toFixed(2)}) é menor que o total (${total.toFixed(2)}).` },
        { status: 400 }
      );
    }
    if (method === 'dinheiro' && cashPaid != null) {
      cashChange = Math.round((cashPaid - total) * 100) / 100;
    }

    const desc = items.map((i: { title: string; quantity: number }) => `${i.title} x${i.quantity}`).join(', ');
    const sellerId =
      sellerUserId != null && Number.isFinite(Number(sellerUserId)) ? Number(sellerUserId) : null;
    const whatsapp =
      deliveryType === 'entrega' && whatsappRaw
        ? whatsappDigits(String(whatsappRaw))
        : null;

    const isCashConfirmed = method === 'dinheiro';
    const orderStatus = isCashConfirmed ? 'pago' : 'pendente';
    const fulfillmentStatus = isCashConfirmed ? 'confirmado' : 'pendente';

    const orderResult = await query<{ insertId: number }>(
      `INSERT INTO catalog_orders (
        customer_id, seller_user_id, delivery_type, payment_method_type,
        cash_paid_amount, cash_change, customer_whatsapp,
        endereco, bairro, rua, cidade, numero, cep, complemento,
        total, status, fulfillment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customerId,
        sellerId,
        deliveryType,
        method,
        cashPaid,
        cashChange,
        whatsapp,
        addr.enderecoFull,
        addr.bairro,
        addr.rua,
        addr.cidade,
        addr.numero,
        addr.cep,
        addr.complemento,
        total,
        orderStatus,
        fulfillmentStatus,
      ]
    );
    const orderId = (orderResult as { insertId: number }).insertId;
    if (!orderId) throw new Error('Erro ao criar pedido');

    for (const it of items) {
      await query(
        `INSERT INTO catalog_order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)`,
        [orderId, it.product_id, Number(it.quantity), Number(it.unit_price)]
      );
    }

    if (method === 'dinheiro') {
      return NextResponse.json({
        type: 'dinheiro',
        order_id: orderId,
        cash_change: cashChange,
        fulfillment_status: 'confirmado',
      });
    }

    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: 'Mercado Pago não configurado. Adicione MERCADOPAGO_ACCESS_TOKEN no .env.local' },
        { status: 500 }
      );
    }

    const payerEmail = cust.email?.trim().toLowerCase();
    const originHeader = request.headers.get('origin');
    let appUrl = (process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(
      /\/$/,
      ''
    );
    if (originHeader) {
      try {
        const o = new URL(originHeader);
        appUrl = `${o.protocol}//${o.host}`;
      } catch {
        /* mantém env */
      }
    }
    const catalogPath = sellerId ? `/catalogo/${sellerId}` : '/catalogo';
    const isLocalHost = /localhost|127\.0\.0\.1/i.test(appUrl);

    if (method === 'pix') {
      const idempotencyKey = randomUUID();
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
          external_reference: String(orderId),
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
      const successUrl = `${appUrl}${catalogPath}?payment=success&order_id=${orderId}`;
      const failureUrl = `${appUrl}${catalogPath}?payment=failure&order_id=${orderId}`;
      const pendingUrl = `${appUrl}${catalogPath}?payment=pending&order_id=${orderId}`;

      const preferencePayload: Record<string, unknown> = {
        items: items.map((it: { title: string; quantity: number; unit_price: number }) => ({
          title: String(it.title || 'Produto').substring(0, 256),
          quantity: Number(it.quantity) || 1,
          unit_price: Number(it.unit_price) || 0,
          currency_id: 'BRL',
        })),
        payer: { email: payerEmail, name: cust.name, surname: cust.last_name || '' },
        back_urls: {
          success: successUrl,
          failure: failureUrl,
          pending: pendingUrl,
        },
        external_reference: String(orderId),
      };

      // auto_return exige URL pública HTTPS — em localhost o MP rejeita
      if (!isLocalHost && appUrl.startsWith('https://')) {
        preferencePayload.auto_return = 'approved';
        preferencePayload.notification_url = `${appUrl}/api/catalog/webhook/mercadopago`;
      }

      const prefRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferencePayload),
      });
      const preference = await prefRes.json();
      if (!prefRes.ok) {
        console.error('MP Preference error:', preference);
        const mpErr =
          preference.message ||
          preference.error ||
          preference.cause?.[0]?.description ||
          'Erro ao abrir pagamento com cartão.';
        return NextResponse.json({ error: mpErr }, { status: 500 });
      }
      const initPoint =
        preference.init_point ||
        preference.sandbox_init_point ||
        preference.point_of_interaction?.transaction_data?.ticket_url;
      if (!initPoint) {
        return NextResponse.json({ error: 'Link de pagamento indisponível.' }, { status: 500 });
      }
      await query('UPDATE catalog_orders SET payment_id = ? WHERE id = ?', [
        preference.id?.toString() || `pref-${orderId}`,
        orderId,
      ]);
      return NextResponse.json({
        type: 'redirect',
        order_id: orderId,
        init_point: initPoint,
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
