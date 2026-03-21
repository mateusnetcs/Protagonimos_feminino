import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ config: null });
    }

    const rows = await query<{ tipo_chave: string; chave: string; nome_beneficiario: string; cidade_beneficiario: string }[]>(
      'SELECT tipo_chave, chave, nome_beneficiario, cidade_beneficiario FROM user_pix_config WHERE user_id = ? LIMIT 1',
      [userId]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ config: null });
    }

    return NextResponse.json({
      config: {
        tipo_chave: rows[0].tipo_chave || 'email',
        chave: rows[0].chave,
        nome_beneficiario: rows[0].nome_beneficiario,
        cidade_beneficiario: rows[0].cidade_beneficiario,
      },
    });
  } catch (err) {
    console.error('PIX config GET error:', err);
    return NextResponse.json({ error: 'Erro ao buscar configuração' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });
    }

    const body = await request.json();
    const tipoChave = ['cpf', 'cnpj', 'email', 'telefone'].includes(body.tipo_chave)
      ? body.tipo_chave
      : 'email';
    const chave = String(body.chave || '').trim();
    const nomeBeneficiario = String(body.nome_beneficiario || '').trim();
    const cidadeBeneficiario = String(body.cidade_beneficiario || '').trim();

    if (!chave || chave.length < 5) {
      return NextResponse.json({ error: 'Informe a chave PIX' }, { status: 400 });
    }
    if (!nomeBeneficiario) {
      return NextResponse.json({ error: 'Informe o nome do beneficiário' }, { status: 400 });
    }
    if (!cidadeBeneficiario) {
      return NextResponse.json({ error: 'Informe a cidade do beneficiário' }, { status: 400 });
    }

    await query(
      `INSERT INTO user_pix_config (user_id, tipo_chave, chave, nome_beneficiario, cidade_beneficiario)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         tipo_chave = VALUES(tipo_chave),
         chave = VALUES(chave),
         nome_beneficiario = VALUES(nome_beneficiario),
         cidade_beneficiario = VALUES(cidade_beneficiario),
         updated_at = CURRENT_TIMESTAMP`,
      [userId, tipoChave, chave, nomeBeneficiario, cidadeBeneficiario]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('PIX config POST error:', err);
    return NextResponse.json({ error: 'Erro ao salvar configuração' }, { status: 500 });
  }
}
