import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const userId = (session.user as { id?: string }).id;
    if (!userId) return NextResponse.json({ error: 'Usuário não identificado' }, { status: 401 });

    const rows = await query<
      { id: number; product_name: string | null; caption: string | null; image_url: string; image_urls: string | null; created_at: string }[]
    >(
      `SELECT id, product_name, caption, image_url, image_urls, created_at
       FROM post_gallery
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );
    const items = Array.isArray(rows) ? rows : [rows].filter(Boolean);
    return NextResponse.json(items);
  } catch (err) {
    console.error('Gallery list error:', err);
    return NextResponse.json({ error: 'Erro ao carregar galeria' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const userId = (session.user as { id?: string }).id ?? (session.user as { id?: number })?.id;
    if (!userId) return NextResponse.json({ error: 'Usuário não identificado' }, { status: 401 });

    const body = await request.json();
    const { product_id, product_name, caption, image_url, image_urls } = body;

    if (!image_url || typeof image_url !== 'string') {
      return NextResponse.json({ error: 'image_url obrigatório' }, { status: 400 });
    }

    const urlsJson = Array.isArray(image_urls) ? JSON.stringify(image_urls) : null;

    await query(
      `INSERT INTO post_gallery (user_id, product_id, product_name, caption, image_url, image_urls)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, product_id || null, product_name || null, caption || null, image_url, urlsJson]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Gallery save error:', err);
    return NextResponse.json({ error: 'Erro ao salvar na galeria' }, { status: 500 });
  }
}
