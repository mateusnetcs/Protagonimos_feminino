import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

/** Salva data URL ou URL remota em /public/uploads/posts e retorna o caminho local */
export async function persistPostImage(imageUrl: string): Promise<string> {
  const trimmed = imageUrl.trim();
  if (!trimmed) throw new Error('URL de imagem vazia');
  if (trimmed.startsWith('/uploads/')) return trimmed;

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'posts');
  await mkdir(uploadDir, { recursive: true });

  const saveBuffer = async (buffer: Buffer, ext: string) => {
    const filename = `post-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    await writeFile(path.join(uploadDir, filename), buffer);
    return `/uploads/posts/${filename}`;
  };

  if (trimmed.startsWith('data:image/')) {
    const match = trimmed.match(/^data:image\/([\w+.-]+);base64,(.+)$/s);
    if (!match) throw new Error('Data URL de imagem inválida');
    const rawExt = match[1].toLowerCase().replace('jpeg', 'jpg');
    const ext = ['png', 'jpg', 'webp', 'gif'].includes(rawExt) ? rawExt : 'png';
    const buffer = Buffer.from(match[2], 'base64');
    return saveBuffer(buffer, ext);
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const res = await fetch(trimmed, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Falha ao baixar imagem (${res.status})`);
    const contentType = res.headers.get('content-type') || 'image/png';
    const ext = contentType.includes('jpeg')
      ? 'jpg'
      : contentType.includes('webp')
        ? 'webp'
        : contentType.includes('gif')
          ? 'gif'
          : 'png';
    const buffer = Buffer.from(await res.arrayBuffer());
    return saveBuffer(buffer, ext);
  }

  return trimmed;
}

export async function persistPostImages(urls: string[]): Promise<string[]> {
  const results: string[] = [];
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    if (!url?.trim()) continue;
    results.push(await persistPostImage(url));
    if (i < urls.length - 1) {
      await new Promise((r) => setTimeout(r, 2));
    }
  }
  if (results.length === 0) throw new Error('Nenhuma imagem válida para salvar');
  return results;
}
