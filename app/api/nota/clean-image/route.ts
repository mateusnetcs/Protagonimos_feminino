import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

/**
 * Remove o fundo da imagem e aplica fundo branco (#FFFFFF).
 * Usa remove.bg API - requer REMOVEBG_API_KEY no .env
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const apiKey = process.env.REMOVEBG_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'REMOVEBG_API_KEY não encontrada. Verifique: 1) Adicione no arquivo .env.local (não .env.example) 2) Formato: REMOVEBG_API_KEY=sua_chave 3) Reinicie o servidor (Ctrl+C e npm run dev) após salvar.',
        },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    let imageUrl = body.imageUrl?.trim();
    if (!imageUrl) return NextResponse.json({ error: 'URL da imagem inválida' }, { status: 400 });
    if (imageUrl.startsWith('/')) {
      const base = process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
      imageUrl = base.replace(/\/$/, '') + imageUrl;
    }
    if (!imageUrl.startsWith('http')) {
      return NextResponse.json({ error: 'URL da imagem inválida' }, { status: 400 });
    }

    const formData = new FormData();
    formData.append('image_url', imageUrl);
    formData.append('size', 'auto');
    formData.append('format', 'jpg');
    formData.append('bg_color', 'ffffff');

    const res = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('remove.bg error:', res.status, errText);
      if (res.status === 402) {
        return NextResponse.json(
          { error: 'Limite de créditos do remove.bg atingido (50/mês grátis).' },
          { status: 402 }
        );
      }
      return NextResponse.json(
        { error: 'Não foi possível processar a imagem.' },
        { status: 502 }
      );
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const filename = `clean-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    await mkdir(uploadDir, { recursive: true });
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    const url = `/uploads/products/${filename}`;
    return NextResponse.json({ imageUrl: url });
  } catch (err) {
    console.error('Clean image error:', err);
    return NextResponse.json({ error: 'Erro ao processar imagem.' }, { status: 500 });
  }
}
