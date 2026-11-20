import { query } from '@/lib/db';
import { resolveUploadUrl } from '@/lib/resolve-upload-url';
import { RESTRICTED_USER_ID } from '@/lib/restricted-access';

/**
 * Indicadores públicos do projeto para o banner IX SAPIENS e a página /sapiens.
 *
 * Só entram contas de participantes (role = 'geral'). Ficam de fora:
 * - contas administrativas;
 * - contas de teste (nome contendo "teste");
 * - a conta restrita (RESTRICTED_USER_ID), que não faz parte do programa;
 * - IDs extras listados em SAPIENS_EXCLUDED_USER_IDS (ex.: "29,46").
 * Nenhum dado pessoal (nome, e-mail, telefone) é exposto.
 */

export type SapiensStats = {
  participantes: number;
  participantesComProdutos: number;
  participantesQueVenderam: number;
  participantesComPosts: number;
  participantesComPedidosOnline: number;
  produtos: number;
  produtosNoCatalogo: number;
  vendasPdv: number;
  receitaPdv: number;
  pedidosOnlinePagos: number;
  receitaOnline: number;
  postsIa: number;
  imagensIa: number;
  diagnosticos: number;
  vendasPorMes: { mes: string; label: string; vendas: number; receita: number }[];
  periodo: { inicio: string | null; fim: string | null };
  atualizadoEm: string;
};

export type SapiensPost = {
  id: number;
  productName: string | null;
  caption: string | null;
  imageUrl: string;
};

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function excludedIds(): number[] {
  const extra = (process.env.SAPIENS_EXCLUDED_USER_IDS || '')
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
  return [RESTRICTED_USER_ID, ...extra];
}

/** Filtro SQL de participantes válidas (alias de users = u). IDs são inteiros validados. */
function participantFilter(): string {
  return `u.role = 'geral'
    AND u.id NOT IN (${excludedIds().join(',')})
    AND LOWER(COALESCE(u.name, '')) NOT LIKE '%teste%'`;
}

type Row = Record<string, unknown>;
const num = (v: unknown) => Number(v ?? 0) || 0;

export async function getSapiensStats(): Promise<SapiensStats> {
  const W = participantFilter();

  const [
    [part],
    [prod],
    [sales],
    monthly,
    [online],
    [posts],
    [diag],
  ] = await Promise.all([
    query<Row[]>(
      `SELECT COUNT(DISTINCT LOWER(TRIM(u.name))) AS total FROM users u WHERE ${W}`
    ),
    query<Row[]>(
      `SELECT COUNT(*) AS total,
              SUM(p.show_in_catalog = 1 AND p.status = 'ativo') AS catalogo,
              COUNT(DISTINCT p.user_id) AS donas
         FROM products p JOIN users u ON u.id = p.user_id WHERE ${W}`
    ),
    query<Row[]>(
      `SELECT COUNT(*) AS total, COALESCE(SUM(s.total), 0) AS receita,
              COUNT(DISTINCT s.user_id) AS vendedoras,
              MIN(s.created_at) AS inicio, MAX(s.created_at) AS fim
         FROM sales s JOIN users u ON u.id = s.user_id WHERE ${W}`
    ),
    query<Row[]>(
      `SELECT DATE_FORMAT(s.created_at, '%Y-%m') AS mes, COUNT(*) AS vendas,
              COALESCE(SUM(s.total), 0) AS receita
         FROM sales s JOIN users u ON u.id = s.user_id WHERE ${W}
        GROUP BY mes ORDER BY mes`
    ),
    query<Row[]>(
      `SELECT COUNT(*) AS total, COALESCE(SUM(o.total), 0) AS receita,
              COUNT(DISTINCT o.seller_user_id) AS vendedoras
         FROM catalog_orders o JOIN users u ON u.id = o.seller_user_id
        WHERE o.status = 'pago' AND ${W}`
    ),
    query<Row[]>(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(JSON_LENGTH(COALESCE(g.image_urls, JSON_ARRAY(g.image_url)))), 0) AS imagens,
              COUNT(DISTINCT g.user_id) AS autoras
         FROM post_gallery g JOIN users u ON u.id = g.user_id WHERE ${W}`
    ),
    query<Row[]>(`SELECT COUNT(*) AS total FROM survey_responses`),
  ]);

  const toIso = (v: unknown) => (v ? new Date(v as string).toISOString() : null);

  return {
    participantes: num(part?.total),
    participantesComProdutos: num(prod?.donas),
    participantesQueVenderam: num(sales?.vendedoras),
    participantesComPosts: num(posts?.autoras),
    participantesComPedidosOnline: num(online?.vendedoras),
    produtos: num(prod?.total),
    produtosNoCatalogo: num(prod?.catalogo),
    vendasPdv: num(sales?.total),
    receitaPdv: Math.round(num(sales?.receita) * 100) / 100,
    pedidosOnlinePagos: num(online?.total),
    receitaOnline: Math.round(num(online?.receita) * 100) / 100,
    postsIa: num(posts?.total),
    imagensIa: num(posts?.imagens),
    diagnosticos: num(diag?.total),
    vendasPorMes: monthly.map((r) => {
      const mes = String(r.mes);
      const [y, m] = mes.split('-');
      return {
        mes,
        label: `${MONTHS[Number(m) - 1] ?? m}/${y.slice(2)}`,
        vendas: num(r.vendas),
        receita: Math.round(num(r.receita) * 100) / 100,
      };
    }),
    periodo: { inicio: toIso(sales?.inicio), fim: toIso(sales?.fim) },
    atualizadoEm: new Date().toISOString(),
  };
}

/** Artes de divulgação geradas por IA pelas participantes (sem identificar a autora). */
export async function getSapiensPosts(limit = 24): Promise<SapiensPost[]> {
  const safeLimit = Math.max(1, Math.min(60, Math.floor(limit)));
  const rows = await query<Row[]>(
    `SELECT g.id, g.product_name, g.caption, g.image_url, g.image_urls
       FROM post_gallery g JOIN users u ON u.id = g.user_id
      WHERE ${participantFilter()}
      ORDER BY g.created_at DESC
      LIMIT ${safeLimit}`
  );

  const posts: SapiensPost[] = [];
  for (const r of rows) {
    let urls: string[] = [];
    const raw = r.image_urls;
    if (Array.isArray(raw)) urls = raw as string[];
    else if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) urls = parsed;
      } catch {
        /* ignora JSON inválido */
      }
    }
    if (!urls.length && r.image_url) urls = [String(r.image_url)];
    urls.forEach((u, i) => {
      posts.push({
        id: Number(r.id) * 100 + i,
        productName: (r.product_name as string) || null,
        caption: (r.caption as string) || null,
        imageUrl: resolveUploadUrl(u),
      });
    });
  }
  return posts;
}
