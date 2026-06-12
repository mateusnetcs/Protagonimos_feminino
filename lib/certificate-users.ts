import { getServerSession } from 'next-auth';
import { authOptions, isAdminSession } from '@/lib/auth';
import { canAdminAccessUser } from '@/lib/restricted-access';
import { query } from '@/lib/db';

export type CertificateUser = {
  id: string;
  email: string;
  name: string | null;
};

export async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: 'Não autorizado' as const, status: 401 as const };
  if (!isAdminSession(session)) {
    return { error: 'Acesso restrito a administradores' as const, status: 403 as const };
  }
  return { session };
}

export async function listCertificateEligibleUsers(
  sessionUserId: string | undefined
): Promise<CertificateUser[]> {
  const rows = await query<{ id: number; email: string; name: string | null; role: string }[]>(
    "SELECT id, email, name, role FROM users WHERE role = 'geral' ORDER BY name, email"
  );
  const data = Array.isArray(rows) ? rows : [rows];
  return data
    .filter((u) => canAdminAccessUser(sessionUserId, u.id))
    .map((u) => ({
      id: String(u.id),
      email: u.email,
      name: u.name,
    }));
}

export async function getCertificateUserById(
  sessionUserId: string | undefined,
  userId: string
): Promise<CertificateUser | null> {
  const rows = await query<{ id: number; email: string; name: string | null; role: string }[]>(
    "SELECT id, email, name, role FROM users WHERE id = ? AND role = 'geral' LIMIT 1",
    [userId]
  );
  const user = (Array.isArray(rows) ? rows[0] : rows) as
    | { id: number; email: string; name: string | null; role: string }
    | undefined;
  if (!user) return null;
  if (!canAdminAccessUser(sessionUserId, user.id)) return null;
  return {
    id: String(user.id),
    email: user.email,
    name: user.name,
  };
}
