import { NextResponse } from 'next/server';
import type { PoolConnection, ResultSetHeader } from 'mysql2/promise';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPool } from '@/lib/db';

type ItemBody = { product_id: string | number; quantity: number; unit_price: number };

function isUnknownColumnError(e: unknown): boolean {
  const err = e as { errno?: number; code?: string; message?: string };
  return err.errno === 1054 || err.code === 'ER_BAD_FIELD_ERROR';
}

async function insertSaleRow(
  conn: PoolConnection,
  userId: number | null,
  total: number,
  paymentMethod: string
): Promise<number> {
  try {
    const [saleRes] = await conn.execute<ResultSetHeader>(
      `INSERT INTO sales (user_id, total, payment_method) VALUES (?, ?, ?)`,
      [userId, total, paymentMethod]
    );
    return saleRes.insertId;
  } catch (e) {
    const msg = String((e as Error).message ?? '');
    if (isUnknownColumnError(e) && msg.includes('payment_method')) {
      const [saleRes] = await conn.execute<ResultSetHeader>(
        `INSERT INTO sales (user_id, total) VALUES (?, ?)`,
        [userId, total]
      );
      return saleRes.insertId;
    }
    const errno = (e as { errno?: number }).errno;
    if (errno === 1452 && userId != null) {
      try {
        const [saleRes] = await conn.execute<ResultSetHeader>(
          `INSERT INTO sales (user_id, total, payment_method) VALUES (?, ?, ?)`,
          [null, total, paymentMethod]
        );
        return saleRes.insertId;
      } catch (e2) {
        if (isUnknownColumnError(e2) && String((e2 as Error).message).includes('payment_method')) {
          const [saleRes] = await conn.execute<ResultSetHeader>(
            `INSERT INTO sales (user_id, total) VALUES (?, ?)`,
            [null, total]
          );
          return saleRes.insertId;
        }
        throw e2;
      }
    }
    throw e;
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const userIdRaw = (session.user as { id?: string }).id;
    const uidNum = userIdRaw != null && userIdRaw !== '' ? Number(userIdRaw) : NaN;
    const userId = Number.isFinite(uidNum) ? uidNum : null;

    const body = await request.json();
    const items: ItemBody[] = Array.isArray(body.items) ? body.items : [];
    const raw = body.payment_method;
    const allowed = ['pix', 'dinheiro', 'cartao_credito', 'cartao_debito', 'misto'] as const;
    const paymentMethod = typeof raw === 'string' && allowed.includes(raw as (typeof allowed)[number])
      ? (raw as (typeof allowed)[number])
      : 'dinheiro';

    if (!items.length) {
      return NextResponse.json({ error: 'Adicione itens à venda' }, { status: 400 });
    }

    let computedTotal = 0;
    for (const it of items) {
      const qty = Math.max(1, Math.floor(Number(it.quantity)));
      const price = Number(it.unit_price);
      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json({ error: 'Preço inválido' }, { status: 400 });
      }
      computedTotal += qty * price;
    }
    computedTotal = Math.round(computedTotal * 100) / 100;

    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const insertId = await insertSaleRow(conn, userId, computedTotal, paymentMethod);

      for (const it of items) {
        const pid = Number(it.product_id);
        const qty = Math.max(1, Math.floor(Number(it.quantity)));
        const price = Number(it.unit_price);
        if (!pid || !Number.isFinite(price)) throw new Error('Item inválido');
        await conn.execute(
          `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)`,
          [insertId, pid, qty, price]
        );
        await conn.execute(
          `UPDATE products SET stock_current = GREATEST(0, COALESCE(stock_current, 0) - ?) WHERE id = ?`,
          [qty, pid]
        );
      }

      await conn.commit();
      return NextResponse.json({ ok: true, sale_id: insertId });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Sales POST error:', err);
    const detail =
      err instanceof Error ? err.message : typeof err === 'object' && err !== null && 'sqlMessage' in err
        ? String((err as { sqlMessage?: string }).sqlMessage)
        : String(err);
    return NextResponse.json(
      {
        error: 'Erro ao registrar venda',
        ...(process.env.NODE_ENV === 'development' ? { detail } : {}),
      },
      { status: 500 }
    );
  }
}
