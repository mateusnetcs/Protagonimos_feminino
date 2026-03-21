import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const MP_AUTH_URL = 'https://auth.mercadopago.com.br/authorization';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.redirect(new URL('/api/auth/signin?callbackUrl=/', process.env.APP_URL || 'http://localhost:3000'));
    }

    const appId = process.env.MERCADOPAGO_APP_ID;
    const appSecret = process.env.MERCADOPAGO_APP_SECRET;
    const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!appId || !appSecret) {
      return NextResponse.json(
        { error: 'Mercado Pago OAuth não configurado. Defina MERCADOPAGO_APP_ID e MERCADOPAGO_APP_SECRET no .env' },
        { status: 500 }
      );
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });
    }

    const redirectUri = `${baseUrl.replace(/\/$/, '')}/api/pdv/mercadopago/callback`;
    const state = Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString('base64url');

    const params = new URLSearchParams({
      client_id: appId,
      response_type: 'code',
      platform_id: 'mp',
      state,
      redirect_uri: redirectUri,
    });

    const authUrl = `${MP_AUTH_URL}?${params.toString()}`;
    return NextResponse.redirect(authUrl);
  } catch (err) {
    console.error('MP Connect error:', err);
    return NextResponse.json({ error: 'Erro ao iniciar conexão' }, { status: 500 });
  }
}
