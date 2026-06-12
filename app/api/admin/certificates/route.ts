import { NextResponse } from 'next/server';
import { listCertificateEligibleUsers, requireAdminSession } from '@/lib/certificate-users';

export async function GET() {
  try {
    const auth = await requireAdminSession();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const sessionUserId = (auth.session.user as { id?: string })?.id;
    const users = await listCertificateEligibleUsers(sessionUserId);
    return NextResponse.json(users);
  } catch (err) {
    console.error('Certificates list error:', err);
    return NextResponse.json({ error: 'Erro ao listar participantes' }, { status: 500 });
  }
}
