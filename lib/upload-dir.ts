import { mkdir } from 'fs/promises';
import path from 'path';

/** Raiz de uploads graváveis em runtime (public/uploads). */
export function getUploadRoot(): string {
  const base = process.env.UPLOAD_DIR?.trim() || path.join(process.cwd(), 'public', 'uploads');
  return base;
}

export async function ensureUploadSubdir(subdir: 'posts' | 'products' | 'customers'): Promise<string> {
  const dir = path.join(getUploadRoot(), subdir);
  try {
    await mkdir(dir, { recursive: true });
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === 'EACCES' || code === 'EROFS') {
      throw new Error(
        'Sem permissão para gravar imagens no servidor. No Coolify, monte um volume em /app/public/uploads e faça redeploy.'
      );
    }
    throw err;
  }
  return dir;
}

export function uploadPublicUrl(subdir: string, filename: string): string {
  return `/uploads/${subdir}/${filename}`;
}
