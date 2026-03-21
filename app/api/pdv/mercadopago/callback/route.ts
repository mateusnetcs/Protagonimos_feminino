import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

const MP_TOKEN_URL = 'https://api.mercadopago.com/oauth/token';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/?error=mp_oauth_missing_params', process.env.APP_URL || 'http://localhost:3000')
      );
    }

    let userId: string;
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64url').toString());
      userId = String(decoded.userId);
      const ts = Number(decoded.ts);
      if (!userId || !ts || Date.now() - ts > 10 * 60 * 1000) {
        throw new Error('State inválido ou expirado');
      }
    } catch {
      return NextResponse.redirect(
        new URL('/?error=mp_oauth_invalid_state', process.env.APP_URL || 'http://localhost:3000')
      );
    }

    const appId = process.env.MERCADOPAGO_APP_ID;
    const appSecret = process.env.MERCADOPAGO_APP_SECRET;
    const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${baseUrl.replace(/\/$/, '')}/api/pdv/mercadopago/callback`;

    if (!appId || !appSecret) {
      return NextResponse.redirect(
        new URL('/?error=mp_oauth_not_configured', process.env.APP_URL || 'http://localhost:3000')
      );
    }

    const res = await fetch(MP_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: appId,
        client_secret: appSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('MP OAuth token error:', data);
      return NextResponse.redirect(
        new URL(`/?error=mp_oauth_token_failed&msg=${encodeURIComponent(data.message || 'Erro ao obter token')}`, process.env.APP_URL || 'http://localhost:3000')
      );
    }

    const accessToken = data.access_token;
    const refreshToken = data.refresh_token ?? null;
    const expiresIn = data.expires_in; // segundos
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

    if (!accessToken) {
      return NextResponse.redirect(
        new URL('/?error=mp_oauth_no_token', process.env.APP_URL || 'http://localhost:3000')
      );
    }

    await query(
      `INSERT INTO user_mercadopago (user_id, access_token, refresh_token, expires_at)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         access_token = VALUES(access_token),
         refresh_token = COALESCE(VALUES(refresh_token), refresh_token),
         expires_at = VALUES(expires_at),
         updated_at = CURRENT_TIMESTAMP`,
      [userId, accessToken, refreshToken, expiresAt]
    );

    return NextResponse.redirect(
      new URL('/?mp_connected=1&tab=pdv', process.env.APP_URL || 'http://localhost:3000')
    );
  } catch (err) {
    console.error('MP Callback error:', err);
    return NextResponse.redirect(
      new URL('/?error=mp_oauth_error', process.env.APP_URL || 'http://localhost:3000')
    );
  }
}
