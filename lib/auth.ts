import NextAuth, { type AuthOptions } from 'next-auth';

export function isAdminSession(session: { user?: { role?: string } } | null): boolean {
  return !!session?.user && (session.user as { role?: string }).role === 'admin';
}
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getPool } from './db';

export const authOptions: AuthOptions = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const pool = getPool();
        const [rows] = await pool.execute(
          'SELECT id, email, password_hash, name, role FROM users WHERE email = ?',
          [String(credentials.email)]
        );
        const user = (rows as { id: number; email: string; password_hash: string; name: string; role?: string }[])[0];
        if (!user) return null;
        const ok = await bcrypt.compare(String(credentials.password), user.password_hash);
        if (!ok) return null;
        return {
          id: String(user.id),
          email: user.email,
          name: user.name || user.email,
          role: user.role === 'admin' ? 'admin' : 'geral',
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = (user as { role?: string }).role || 'geral';
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        session.user.email = token.email as string;
        (session.user as { role?: string }).role = (token.role as string) || 'geral';
      }
      return session;
    },
  },
  pages: { signIn: '/' },
  session: {
    strategy: 'jwt' as const,
    maxAge: 12 * 60 * 60, // 12 horas
  },
  jwt: {
    maxAge: 12 * 60 * 60, // alinhado à sessão (cookie JWT)
  },
};
