import { NextResponse } from 'next/server';
import { getSapiensStats } from '@/lib/sapiens-stats';
import { buildBannerContent } from '@/lib/sapiens-content';

export const dynamic = 'force-dynamic';

/** Público: indicadores agregados (sem dados pessoais) + conteúdo do banner IX SAPIENS. */
export async function GET() {
  try {
    const stats = await getSapiensStats();
    return NextResponse.json({ stats, banner: buildBannerContent(stats) });
  } catch (err) {
    console.error('[api/sapiens]', err);
    return NextResponse.json({ error: 'Erro ao carregar indicadores' }, { status: 500 });
  }
}
