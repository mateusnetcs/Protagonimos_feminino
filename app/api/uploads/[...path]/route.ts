import { readFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import { getUploadRoot } from '@/lib/upload-dir';

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

const ALLOWED_FOLDERS = new Set(['posts', 'products', 'customers']);

/** Serve arquivos gravados em runtime (standalone não expõe /public/uploads novos). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await params;
    if (!segments?.length) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    }

    if (segments.some((s) => s.includes('..') || s.includes('\\'))) {
      return NextResponse.json({ error: 'Caminho inválido' }, { status: 400 });
    }

    const [folder, ...rest] = segments;
    if (!folder || !ALLOWED_FOLDERS.has(folder) || rest.length === 0) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    }

    const filename = rest.join('/');
    const filePath = path.join(getUploadRoot(), folder, filename);

    const buffer = await readFile(filePath);
    const ext = path.extname(filename).toLowerCase();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === 'ENOENT') {
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 });
    }
    console.error('Uploads serve error:', err);
    return NextResponse.json({ error: 'Erro ao carregar imagem' }, { status: 500 });
  }
}
