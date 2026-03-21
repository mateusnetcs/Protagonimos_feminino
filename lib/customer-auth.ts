import { cookies } from 'next/headers';
import { createHmac } from 'crypto';

const COOKIE_NAME = 'customer_session';
const SECRET = process.env.CUSTOMER_SESSION_SECRET || process.env.NEXTAUTH_SECRET || 'change-me-dev';
const MAX_AGE = 30 * 24 * 60 * 60; // 30 dias

export type CustomerSession = {
  id: number;
  email: string;
  name: string;
  last_name: string;
  photo_url?: string | null;
  cidade?: string | null;
  bairro?: string | null;
  rua?: string | null;
  numero?: string | null;
  cep?: string | null;
  complemento?: string | null;
};

function sign(value: string): string {
  return createHmac('sha256', SECRET).update(value).digest('hex');
}

export function createSessionCookie(payload: Partial<CustomerSession> & Pick<CustomerSession, 'id' | 'email' | 'name' | 'last_name'>): string {
  const exp = Date.now() + MAX_AGE * 1000;
  const data = JSON.stringify({ ...payload, exp });
  const sig = sign(data);
  return Buffer.from(`${data}::${sig}`).toString('base64url');
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const decoded = Buffer.from(raw, 'base64url').toString('utf8');
    const [data, sig] = decoded.split('::');
    if (!data || !sig || sign(data) !== sig) return null;
    const parsed = JSON.parse(data) as CustomerSession & { exp: number };
    if (parsed.exp < Date.now()) return null;
    const { exp, ...session } = parsed;
    return session;
  } catch {
    return null;
  }
}

export function getSessionCookieHeader(payload: string, maxAge = MAX_AGE): string {
  return `${COOKIE_NAME}=${payload}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}
