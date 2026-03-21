import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdminSession } from '@/lib/auth';
import { query } from '@/lib/db';

const WEEKDAY_LABELS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

function parseDate(s: string | null, fallback: Date): string {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return fallback.toISOString().slice(0, 10);
  }
  return s;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function monthBounds(ym: string): { from: string; to: string } | null {
  const m = ym.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) return null;
  const from = `${y}-${String(mo).padStart(2, '0')}-01`;
  const last = new Date(y, mo, 0);
  const to = `${y}-${String(mo).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
  return { from, to };
}

type Row = Record<string, unknown>;

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const userId = (session.user as { id?: string }).id;
    const uidNum = userId != null && userId !== '' ? Number(userId) : NaN;
    let uid = Number.isFinite(uidNum) ? uidNum : null;
    const asAdmin = isAdminSession(session);
    if (uid == null && !asAdmin) return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });

    // Admin pode filtrar por user_id específico
    const { searchParams } = new URL(request.url);
    const filterUserIdParam = searchParams.get('user_id');
    const adminFilteringUser = asAdmin && filterUserIdParam != null && filterUserIdParam !== '';
    if (adminFilteringUser) {
      const paramUid = parseInt(filterUserIdParam!, 10);
      if (Number.isFinite(paramUid)) uid = paramUid;
    }
    const useFilteredQuery = !asAdmin || adminFilteringUser;

    const _searchParams = searchParams;
    const monthParam = _searchParams.get('month');
    const today = new Date();
    const defaultTo = today;
    const defaultFrom = addDays(today, -30);

    let fromStr: string;
    let toStr: string;
    if (monthParam) {
      const b = monthBounds(monthParam);
      if (!b) return NextResponse.json({ error: 'month inválido (use YYYY-MM)' }, { status: 400 });
      fromStr = b.from;
      toStr = b.to;
    } else {
      fromStr = parseDate(_searchParams.get('from'), defaultFrom);
      toStr = parseDate(_searchParams.get('to'), defaultTo);
    }

    const fromDt = `${fromStr} 00:00:00`;
    const toDt = `${toStr} 23:59:59`;

    const catalogPaid = `co.status IN ('pago','entregue')`;
    const salesWhere = !useFilteredQuery ? 'created_at >= ? AND created_at <= ?' : 'user_id = ? AND created_at >= ? AND created_at <= ?';
    const pdvParams = !useFilteredQuery ? [fromDt, toDt] : [uid, fromDt, toDt];
    const pdvJoinWhere = !useFilteredQuery ? 's.created_at >= ? AND s.created_at <= ?' : 's.user_id = ? AND s.created_at >= ? AND s.created_at <= ?';
    const catProdWhere = !useFilteredQuery ? `${catalogPaid} AND co.created_at >= ? AND co.created_at <= ?` : `${catalogPaid} AND p.user_id = ? AND co.created_at >= ? AND co.created_at <= ?`;
    const catParams = !useFilteredQuery ? [fromDt, toDt] : [uid, fromDt, toDt];
    const pdvProdWhere = !useFilteredQuery ? 's.created_at >= ? AND s.created_at <= ?' : 's.user_id = ? AND s.created_at >= ? AND s.created_at <= ? AND p.user_id = ?';
    const pdvProdParams = !useFilteredQuery ? [fromDt, toDt] : [uid, fromDt, toDt, uid];

    const topRows = await query<Row[]>(
      `SELECT product_id, SUM(qty) AS quantity_sold, SUM(rev) AS revenue
       FROM (
         SELECT si.product_id, si.quantity AS qty, si.quantity * si.unit_price AS rev
         FROM sale_items si
         INNER JOIN sales s ON s.id = si.sale_id
         INNER JOIN products p ON p.id = si.product_id
         WHERE ${pdvProdWhere}
         UNION ALL
         SELECT coi.product_id, coi.quantity, coi.quantity * coi.unit_price
         FROM catalog_order_items coi
         INNER JOIN catalog_orders co ON co.id = coi.order_id
         INNER JOIN products p ON p.id = coi.product_id
         WHERE ${catProdWhere}
       ) t
       GROUP BY product_id
       ORDER BY quantity_sold DESC
       LIMIT 20`,
      [...pdvProdParams, ...catParams]
    );

    const productIds = (Array.isArray(topRows) ? topRows : [])
      .map((r) => r.product_id)
      .filter(Boolean);
    let names: Record<number, string> = {};
    if (productIds.length) {
      const placeholders = productIds.map(() => '?').join(',');
      const nameRows = await query<Row[]>(
        `SELECT id, name FROM products WHERE id IN (${placeholders})`,
        productIds as number[]
      );
      for (const r of Array.isArray(nameRows) ? nameRows : []) {
        names[Number(r.id)] = String(r.name);
      }
    }

    const topProducts = (Array.isArray(topRows) ? topRows : []).map((r) => ({
      product_id: Number(r.product_id),
      name: names[Number(r.product_id)] || `Produto #${r.product_id}`,
      quantity_sold: Number(r.quantity_sold),
      revenue: Number(r.revenue),
    }));

    const pdvRev = await query<Row[]>(
      `SELECT COALESCE(SUM(total), 0) AS v FROM sales WHERE ${salesWhere}`,
      pdvParams
    );
    const catRev = await query<Row[]>(
      `SELECT COALESCE(SUM(coi.quantity * coi.unit_price), 0) AS v
       FROM catalog_order_items coi
       INNER JOIN catalog_orders co ON co.id = coi.order_id
       INNER JOIN products p ON p.id = coi.product_id
       WHERE ${catProdWhere}`,
      catParams
    );
    const receitaPdv = Number((pdvRev as Row[])[0]?.v ?? 0);
    const receitaCatalog = Number((catRev as Row[])[0]?.v ?? 0);
    const receitaBruta = receitaPdv + receitaCatalog;

    const cmvPdvWhere = !useFilteredQuery ? 's.created_at >= ? AND s.created_at <= ?' : 's.user_id = ? AND p.user_id = ? AND s.created_at >= ? AND s.created_at <= ?';
    const cmvPdvParams = !useFilteredQuery ? [fromDt, toDt] : [uid, uid, fromDt, toDt];
    const cmvPdv = await query<Row[]>(
      `SELECT COALESCE(SUM(si.quantity * COALESCE(p.cost_cmv, 0)), 0) AS v
       FROM sale_items si
       INNER JOIN sales s ON s.id = si.sale_id
       INNER JOIN products p ON p.id = si.product_id
       WHERE ${cmvPdvWhere}`,
      cmvPdvParams
    );
    const cmvCat = await query<Row[]>(
      `SELECT COALESCE(SUM(coi.quantity * COALESCE(p.cost_cmv, 0)), 0) AS v
       FROM catalog_order_items coi
       INNER JOIN catalog_orders co ON co.id = coi.order_id
       INNER JOIN products p ON p.id = coi.product_id
       WHERE ${catProdWhere}`,
      catParams
    );
    const cmv = Number((cmvPdv as Row[])[0]?.v ?? 0) + Number((cmvCat as Row[])[0]?.v ?? 0);
    const lucroBruto = receitaBruta - cmv;
    const despesasOperacionais = 0;
    const resultadoLiquido = lucroBruto - despesasOperacionais;

    const pdvByWd = await query<Row[]>(
      `SELECT WEEKDAY(s.created_at) AS wd, SUM(s.total) AS total, COUNT(*) AS cnt
       FROM sales s
       WHERE ${pdvJoinWhere}
       GROUP BY WEEKDAY(s.created_at)`,
      pdvParams
    );
    const catByWd = await query<Row[]>(
      `SELECT WEEKDAY(co.created_at) AS wd, SUM(coi.quantity * coi.unit_price) AS total, COUNT(DISTINCT co.id) AS cnt
       FROM catalog_order_items coi
       INNER JOIN catalog_orders co ON co.id = coi.order_id
       INNER JOIN products p ON p.id = coi.product_id
       WHERE ${catProdWhere}
       GROUP BY WEEKDAY(co.created_at)`,
      catParams
    );

    const wdMap = new Map<number, { total: number; count: number }>();
    for (const r of [...(Array.isArray(pdvByWd) ? pdvByWd : []), ...(Array.isArray(catByWd) ? catByWd : [])]) {
      const wd = Number(r.wd);
      const prev = wdMap.get(wd) || { total: 0, count: 0 };
      wdMap.set(wd, {
        total: prev.total + Number(r.total),
        count: prev.count + Number(r.cnt),
      });
    }
    const salesByWeekday = [0, 1, 2, 3, 4, 5, 6].map((wd) => ({
      weekday: wd,
      label: WEEKDAY_LABELS[wd],
      total: wdMap.get(wd)?.total ?? 0,
      count: wdMap.get(wd)?.count ?? 0,
    }));
    const bestWeekday = [...salesByWeekday].sort((a, b) => b.total - a.total)[0];

    const pdvByDay = await query<Row[]>(
      `SELECT DATE(s.created_at) AS d, SUM(s.total) AS total FROM sales s
       WHERE ${pdvJoinWhere} GROUP BY DATE(s.created_at)`,
      pdvParams
    );
    const catByDay = await query<Row[]>(
      `SELECT DATE(co.created_at) AS d, SUM(coi.quantity * coi.unit_price) AS total
       FROM catalog_order_items coi
       INNER JOIN catalog_orders co ON co.id = coi.order_id
       INNER JOIN products p ON p.id = coi.product_id
       WHERE ${catProdWhere}
       GROUP BY DATE(co.created_at)`,
      catParams
    );
    const dayMap = new Map<string, number>();
    for (const r of [...(Array.isArray(pdvByDay) ? pdvByDay : []), ...(Array.isArray(catByDay) ? catByDay : [])]) {
      const key = String(r.d).slice(0, 10);
      dayMap.set(key, (dayMap.get(key) ?? 0) + Number(r.total));
    }
    const dailyTotals = [...dayMap.entries()]
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const bestDay = dailyTotals.length ? [...dailyTotals].sort((a, b) => b.total - a.total)[0] : null;

    const pdvByWeekOfMonth = await query<Row[]>(
      `SELECT FLOOR((DAY(s.created_at)-1)/7)+1 AS wk, SUM(s.total) AS total, COUNT(*) AS cnt
       FROM sales s
       WHERE ${pdvJoinWhere}
       GROUP BY wk ORDER BY wk`,
      pdvParams
    );
    const catByWeekOfMonth = await query<Row[]>(
      `SELECT FLOOR((DAY(co.created_at)-1)/7)+1 AS wk, SUM(coi.quantity * coi.unit_price) AS total, COUNT(DISTINCT co.id) AS cnt
       FROM catalog_order_items coi
       INNER JOIN catalog_orders co ON co.id = coi.order_id
       INNER JOIN products p ON p.id = coi.product_id
       WHERE ${catProdWhere}
       GROUP BY wk ORDER BY wk`,
      catParams
    );
    const wkMap = new Map<number, { total: number; count: number }>();
    for (const r of [
      ...(Array.isArray(pdvByWeekOfMonth) ? pdvByWeekOfMonth : []),
      ...(Array.isArray(catByWeekOfMonth) ? catByWeekOfMonth : []),
    ]) {
      const wk = Number(r.wk);
      const prev = wkMap.get(wk) || { total: 0, count: 0 };
      wkMap.set(wk, { total: prev.total + Number(r.total), count: prev.count + Number(r.cnt) });
    }
    const byWeekOfPeriod = [1, 2, 3, 4, 5, 6]
      .map((wk) => ({
        week: wk,
        label: `${wk}ª semana`,
        total: wkMap.get(wk)?.total ?? 0,
        count: wkMap.get(wk)?.count ?? 0,
      }))
      .filter((x) => x.total > 0 || x.count > 0);
    const bestWeekOfPeriod =
      byWeekOfPeriod.length > 0 ? [...byWeekOfPeriod].sort((a, b) => b.total - a.total)[0] : null;

    return NextResponse.json({
      period: { from: fromStr, to: toStr },
      topProducts,
      dre: {
        receita_pdv: receitaPdv,
        receita_catalogo: receitaCatalog,
        receita_bruta: receitaBruta,
        cmv,
        lucro_bruto: lucroBruto,
        despesas_operacionais: despesasOperacionais,
        resultado_liquido: resultadoLiquido,
      },
      salesByWeekday,
      highlights: {
        best_weekday: bestWeekday,
        best_day: bestDay,
        best_week_of_period: bestWeekOfPeriod,
      },
      dailyTotals,
      byWeekOfPeriod,
    });
  } catch (err) {
    console.error('Reports GET error:', err);
    return NextResponse.json({ error: 'Erro ao gerar relatórios' }, { status: 500 });
  }
}
