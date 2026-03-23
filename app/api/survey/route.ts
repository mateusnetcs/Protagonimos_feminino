import { NextResponse } from 'next/server';
import { query, getPool } from '@/lib/db';

async function ensureAnswersJsonColumn(): Promise<void> {
  const pool = getPool();
  const [rows] = await pool.execute<any[]>(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'survey_responses' AND COLUMN_NAME = 'answers_json'"
  );
  const hasColumn = Array.isArray(rows) && rows.length > 0;
  if (!hasColumn) {
    await pool.execute('ALTER TABLE survey_responses ADD COLUMN answers_json JSON DEFAULT NULL');
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const questionnaireId = body.questionnaire_id ? parseInt(String(body.questionnaire_id), 10) : null;
    const qId = Number.isFinite(questionnaireId) ? questionnaireId : null;

    if (body.answers_json != null) {
      await ensureAnswersJsonColumn();
      const answersJson = typeof body.answers_json === 'string'
        ? body.answers_json
        : JSON.stringify(body.answers_json);
      await query(
        'INSERT INTO survey_responses (answers_json, questionnaire_id) VALUES (?, ?)',
        [answersJson, qId]
      );
      return NextResponse.json({ ok: true });
    }

    const locaisJson = JSON.stringify(body.locais_venda || []);
    const dificuldadesJson = JSON.stringify(body.dificuldades || []);
    const temasJson = JSON.stringify(body.temas_aprender || []);

    await query(
      `INSERT INTO survey_responses (primeira_vez, idade, tempo_atuacao, renda_agricultura, produtos, locais_venda, divulga_redes, controla_financas, dificuldades, conciliar_familia, temas_aprender, sugestao, questionnaire_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.primeira_vez || null, body.idade || null, body.tempo_atuacao || null,
        body.renda_agricultura || null, body.produtos || null, locaisJson,
        body.divulga_redes || null, body.controla_financas || null, dificuldadesJson,
        body.conciliar_familia || null, temasJson, body.sugestao || null, qId,
      ]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Survey submit error:', err);
    return NextResponse.json({ error: 'Erro ao salvar.' }, { status: 500 });
  }
}
