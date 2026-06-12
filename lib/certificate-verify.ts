import crypto from 'crypto';
import { query } from '@/lib/db';

const UEMASUL_LOGO_URL =
  'https://www.uemasul.edu.br/wp-content/uploads/2019/11/uemasul_brasao_colorido.png';

function getVerifySecret(): string {
  return (
    process.env.CERTIFICATE_VERIFY_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    'certificate-verify-fallback'
  );
}

export function getAppBaseUrl(): string {
  return (process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(
    /\/$/,
    ''
  );
}

export function createCertificateVerifyToken(userId: string): string {
  return crypto
    .createHmac('sha256', getVerifySecret())
    .update(`cert:${userId}`)
    .digest('hex')
    .slice(0, 32);
}

export function isValidCertificateToken(userId: string, token: string): boolean {
  if (!userId?.trim() || !token?.trim()) return false;
  const expected = createCertificateVerifyToken(userId.trim());
  const a = Buffer.from(expected);
  const b = Buffer.from(token.trim());
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function getCertificateVerifyUrl(userId: string): string {
  const token = createCertificateVerifyToken(userId);
  const base = getAppBaseUrl();
  return `${base}/certificado/verificar?u=${encodeURIComponent(userId)}&t=${encodeURIComponent(token)}`;
}

export type CertificateVerifyResult =
  | {
      valid: true;
      participant: { id: string; name: string; email: string };
      program: string;
      offeredBy: string;
    }
  | { valid: false; message: string };

export async function verifyCertificate(
  userId: string | undefined,
  token: string | undefined
): Promise<CertificateVerifyResult> {
  if (!userId?.trim() || !token?.trim()) {
    return { valid: false, message: 'Link de verificação incompleto.' };
  }

  if (!isValidCertificateToken(userId, token)) {
    return { valid: false, message: 'Certificado não autenticado ou link inválido.' };
  }

  const rows = await query<{ id: number; email: string; name: string | null; role: string }[]>(
    "SELECT id, email, name, role FROM users WHERE id = ? AND role = 'geral' LIMIT 1",
    [userId.trim()]
  );
  const user = (Array.isArray(rows) ? rows[0] : rows) as
    | { id: number; email: string; name: string | null; role: string }
    | undefined;

  if (!user) {
    return { valid: false, message: 'Participante não encontrado na plataforma.' };
  }

  const displayName = user.name?.trim() || user.email.split('@')[0];

  return {
    valid: true,
    participant: {
      id: String(user.id),
      name: displayName,
      email: user.email,
    },
    program: 'Protagonismo Feminino',
    offeredBy: 'Uemasul · Curso de Administração',
  };
}

export { UEMASUL_LOGO_URL };
