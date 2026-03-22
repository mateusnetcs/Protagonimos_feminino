import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdminSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const body = await _request.json();

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (body.name !== undefined) {
      updates.push('name = ?');
      values.push(body.name);
    }
    if (body.category !== undefined) {
      updates.push('category = ?');
      values.push(body.category ?? null);
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      values.push(body.description ?? null);
    }
    if (body.stock_current !== undefined) {
      updates.push('stock_current = ?');
      values.push(Number(body.stock_current) ?? 0);
    }
    if (body.stock_min !== undefined) {
      updates.push('stock_min = ?');
      values.push(Number(body.stock_min) ?? 0);
    }
    if (body.cost_cmv !== undefined) {
      updates.push('cost_cmv = ?');
      values.push(Number(body.cost_cmv) ?? 0);
    }
    if (body.price_sale !== undefined) {
      updates.push('price_sale = ?');
      values.push(Number(body.price_sale) ?? 0);
    }
    if (body.image_url !== undefined) {
      updates.push('image_url = ?');
      values.push(body.image_url ?? null);
    }
    if (body.show_in_catalog !== undefined) {
      updates.push('show_in_catalog = ?');
      values.push(body.show_in_catalog ? 1 : 0);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
    }

    const uid = Number((session.user as { id?: string }).id) || null;
    if (uid != null && !isAdminSession(session)) {
      const owner = await query<{ id: number }[]>(
        'SELECT id FROM products WHERE id = ? AND user_id = ?',
        [id, uid]
      );
      if (!Array.isArray(owner) || owner.length === 0) {
        return NextResponse.json({ error: 'Produto não encontrado ou sem permissão' }, { status: 404 });
      }
    }
    values.push(id);
    await query(
      `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Product update error:', err);
    return NextResponse.json({ error: 'Erro ao atualizar.' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const uid = Number((session.user as { id?: string }).id) || null;
    if (uid != null && !isAdminSession(session)) {
      const owner = await query<{ id: number }[]>(
        'SELECT id FROM products WHERE id = ? AND user_id = ?',
        [id, uid]
      );
      if (!Array.isArray(owner) || owner.length === 0) {
        return NextResponse.json({ error: 'Produto não encontrado ou sem permissão' }, { status: 404 });
      }
    }
    await query(`UPDATE products SET status = 'inativo' WHERE id = ?`, [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Product delete error:', err);
    return NextResponse.json({ error: 'Erro ao excluir.' }, { status: 500 });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const uid = Number((session.user as { id?: string }).id) || null;
    const isAdmin = isAdminSession(session);
    const whereClause = uid != null && !isAdmin ? 'id = ? AND user_id = ?' : 'id = ?';
    const whereParams = uid != null && !isAdmin ? [id, uid] : [id];

    const rows = await query<any[]>(
      `SELECT id, name, category, description, stock_current, stock_min, cost_cmv, price_sale, image_url, show_in_catalog FROM products WHERE ${whereClause}`,
      whereParams
    );
    const data = Array.isArray(rows) ? rows : [rows];
    const p = data[0];
    if (!p) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    return NextResponse.json({ ...p, id: String(p.id) });
  } catch (err) {
    console.error('Product get error:', err);
    return NextResponse.json({ error: 'Erro ao carregar.' }, { status: 500 });
  }
}
