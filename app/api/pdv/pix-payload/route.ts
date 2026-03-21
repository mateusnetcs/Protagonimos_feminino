import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

const PIX_MERCHANT_NAME_MAX = 25;

function getPixPayload(chave: string, amount: number, merchantName: string, merchantCity: string): string {
  try {
    const name = (merchantName || 'PDV').substring(0, PIX_MERCHANT_NAME_MAX).trim() || 'PDV';
    const city = (merchantCity || 'Brasil').substring(0, 15).trim() || 'Brasil';
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pixbr = require('pixbr');
    const msg = new pixbr.Messages.Static(chave, name, city);
    if (amount > 0) {
      msg.setField(new pixbr.Fields.Transaction_Amount(amount.toFixed(2)));
    }
    return msg.getStringValue();
  } catch (e) {
    console.error('getPixPayload:', e);
    return '';
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const amount = parseFloat(searchParams.get('amount') || '0');
    const name = searchParams.get('name') || '';
    const city = searchParams.get('city') || '';

    let chave = searchParams.get('chave') || '';
    let nome = name || process.env.PDV_PIX_NOME_RECEBEDOR || 'PDV';
    let cidade = city || 'Brasil';

    const session = await getServerSession(authOptions);
    if (session?.user) {
      const userId = (session.user as { id?: string }).id;
      if (userId && (!chave || !name)) {
        const rows = await query<{ chave: string; nome_beneficiario: string; cidade_beneficiario: string }[]>(
          'SELECT chave, nome_beneficiario, cidade_beneficiario FROM user_pix_config WHERE user_id = ? LIMIT 1',
          [userId]
        );
        if (Array.isArray(rows) && rows.length > 0 && !chave) {
          chave = rows[0].chave;
          nome = rows[0].nome_beneficiario || nome;
          cidade = rows[0].cidade_beneficiario || cidade;
        }
      }
    }

    if (!chave) {
      chave = process.env.NEXT_PUBLIC_PDV_PIX_CHAVE || process.env.PDV_PIX_CHAVE || '';
    }
    if (!nome) nome = process.env.PDV_PIX_NOME_RECEBEDOR || 'PDV';

    if (!chave || chave.length < 5) {
      return NextResponse.json({ error: 'Chave PIX não configurada. Configure nas opções do PDV.' }, { status: 400 });
    }

    const payload = getPixPayload(chave, amount, nome, cidade);
    if (!payload) {
      return NextResponse.json({ error: 'Erro ao gerar payload PIX' }, { status: 500 });
    }

    return NextResponse.json({ payload });
  } catch (e) {
    console.error('PIX payload error:', e);
    return NextResponse.json({ error: 'Erro ao gerar PIX' }, { status: 500 });
  }
}
