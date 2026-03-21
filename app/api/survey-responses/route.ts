import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const rows = await query<any[]>(`SELECT * FROM survey_responses ORDER BY created_at DESC`);
    const data = Array.isArray(rows) ? rows : [rows];
    const responses = data.map((r) => ({
      ...r,
      id: String(r.id),
      locais_venda: typeof r.locais_venda === 'string' ? JSON.parse(r.locais_venda || '[]') : r.locais_venda || [],
      dificuldades: typeof r.dificuldades === 'string' ? JSON.parse(r.dificuldades || '[]') : r.dificuldades || [],
      temas_aprender: typeof r.temas_aprender === 'string' ? JSON.parse(r.temas_aprender || '[]') : r.temas_aprender || [],
    }));
    return NextResponse.json(responses);
  } catch (err) {
    console.error('Survey responses error:', err);
    return NextResponse.json({ error: 'Erro ao carregar.' }, { status: 500 });
  }
}
