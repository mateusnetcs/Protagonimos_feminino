import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdminSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (!isAdminSession(session)) return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });

    const url = new URL(request.url);
    const questionnaireId = url.searchParams.get('questionnaire_id');
    const whereClause = questionnaireId ? 'WHERE questionnaire_id = ?' : '';
    const params = questionnaireId ? [questionnaireId] : [];
    const rows = await query<any[]>(
      `SELECT * FROM survey_responses ${whereClause} ORDER BY created_at DESC`,
      params
    );
    const data = Array.isArray(rows) ? rows : [rows];
    const responses = data.map((r) => {
      const base = {
        ...r,
        id: String(r.id),
        locais_venda: typeof r.locais_venda === 'string' ? JSON.parse(r.locais_venda || '[]') : r.locais_venda || [],
        dificuldades: typeof r.dificuldades === 'string' ? JSON.parse(r.dificuldades || '[]') : r.dificuldades || [],
        temas_aprender: typeof r.temas_aprender === 'string' ? JSON.parse(r.temas_aprender || '[]') : r.temas_aprender || [],
      };
      if (r.answers_json) {
        const aj = typeof r.answers_json === 'string' ? JSON.parse(r.answers_json || '{}') : r.answers_json;
        return { ...base, answers_json: aj };
      }
      return base;
    });
    return NextResponse.json(responses);
  } catch (err) {
    console.error('Survey responses error:', err);
    return NextResponse.json({ error: 'Erro ao carregar.' }, { status: 500 });
  }
}
