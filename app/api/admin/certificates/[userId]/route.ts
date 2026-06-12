import { NextResponse } from 'next/server';
import { certificateFileName } from '@/lib/certificate-html';
import { getCertificateUserById, requireAdminSession } from '@/lib/certificate-users';
import { generateCertificatePdf } from '@/lib/generate-certificate-pdf';

export const runtime = 'nodejs';
export const maxDuration = 120;

type RouteContext = { params: Promise<{ userId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireAdminSession();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { userId } = await context.params;
    const sessionUserId = (auth.session.user as { id?: string })?.id;
    const user = await getCertificateUserById(sessionUserId, userId);
    if (!user) {
      return NextResponse.json({ error: 'Participante não encontrado' }, { status: 404 });
    }

    const displayName = user.name?.trim() || user.email.split('@')[0];
    const pdf = await generateCertificatePdf(displayName, user.id);
    const fileName = certificateFileName(displayName, user.id);

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('Certificate PDF error:', err);
    return NextResponse.json({ error: 'Erro ao gerar certificado' }, { status: 500 });
  }
}
