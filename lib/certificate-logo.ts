import { readFileSync } from 'fs';
import path from 'path';
import { UEMASUL_LOGO_URL } from '@/lib/certificate-verify';

let cachedUemasul: string | null = null;
let cachedAdministracao: string | null = null;

const UEMASUL_PATH = path.join(process.cwd(), 'public', 'images', 'uemasul-brasao.png');
const ADMIN_PATH = path.join(process.cwd(), 'public', 'images', 'certificate-logo.png');

function toDataUri(buf: Buffer): string {
  return `data:image/png;base64,${buf.toString('base64')}`;
}

/** Brasão UEMASUL embutido em base64 para geração do PDF via Puppeteer */
export async function getCertificateUemasulLogoDataUri(): Promise<string | null> {
  if (cachedUemasul) return cachedUemasul;

  try {
    cachedUemasul = toDataUri(readFileSync(UEMASUL_PATH));
    return cachedUemasul;
  } catch {
    try {
      const res = await fetch(UEMASUL_LOGO_URL, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) return null;
      cachedUemasul = toDataUri(Buffer.from(await res.arrayBuffer()));
      return cachedUemasul;
    } catch {
      return null;
    }
  }
}

/** Logo do Curso de Administração */
export function getCertificateAdministracaoLogoDataUri(): string | null {
  if (cachedAdministracao) return cachedAdministracao;
  try {
    cachedAdministracao = toDataUri(readFileSync(ADMIN_PATH));
    return cachedAdministracao;
  } catch {
    return null;
  }
}

export async function getCertificateLogos(): Promise<{
  uemasul: string | null;
  administracao: string | null;
}> {
  const [uemasul, administracao] = await Promise.all([
    getCertificateUemasulLogoDataUri(),
    Promise.resolve(getCertificateAdministracaoLogoDataUri()),
  ]);
  return { uemasul, administracao };
}
