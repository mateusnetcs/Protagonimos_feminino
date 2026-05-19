import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { parseGalleryImageUrls } from '@/lib/post-gallery-utils';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const userId = (session.user as { id?: string }).id;
    if (!userId) return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

    const imageIndexParam = new URL(request.url).searchParams.get('image_index');
    const imageIndex =
      imageIndexParam !== null && imageIndexParam !== '' ? parseInt(imageIndexParam, 10) : null;

    const rows = await query<
      { id: number; image_url: string; image_urls: string | null }[]
    >('SELECT id, image_url, image_urls FROM post_gallery WHERE id = ? AND user_id = ?', [
      id,
      userId,
    ]);
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

    const urls = parseGalleryImageUrls(row);

    if (
      imageIndex !== null &&
      !Number.isNaN(imageIndex) &&
      urls.length > 1 &&
      imageIndex >= 0 &&
      imageIndex < urls.length
    ) {
      const remaining = urls.filter((_, i) => i !== imageIndex);
      if (remaining.length === 0) {
        await query('DELETE FROM post_gallery WHERE id = ? AND user_id = ?', [id, userId]);
      } else {
        await query(
          'UPDATE post_gallery SET image_url = ?, image_urls = ? WHERE id = ? AND user_id = ?',
          [remaining[0], JSON.stringify(remaining), id, userId]
        );
      }
      return NextResponse.json({ ok: true });
    }

    await query('DELETE FROM post_gallery WHERE id = ? AND user_id = ?', [id, userId]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Gallery delete error:', err);
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 });
  }
}
