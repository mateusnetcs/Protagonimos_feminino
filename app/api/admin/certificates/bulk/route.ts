import { NextResponse } from 'next/server';
import { certificateFileName } from '@/lib/certificate-html';
import { listCertificateEligibleUsers, requireAdminSession } from '@/lib/certificate-users';
import { launchCertificateBrowser, renderCertificatePdf } from '@/lib/generate-certificate-pdf';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET() {
  let browser: Awaited<ReturnType<typeof launchCertificateBrowser>> | null = null;

  try {
    const auth = await requireAdminSession();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const sessionUserId = (auth.session.user as { id?: string })?.id;
    const users = await listCertificateEligibleUsers(sessionUserId);
    if (users.length === 0) {
      return NextResponse.json({ error: 'Nenhum participante elegível encontrado' }, { status: 404 });
    }

    browser = await launchCertificateBrowser();

    const { ZipArchive } = await import('archiver');
    const archive = new ZipArchive({ zlib: { level: 6 } });
    const chunks: Buffer[] = [];

    const zipReady = new Promise<Buffer>((resolve, reject) => {
      archive.on('data', (chunk: Buffer) => chunks.push(chunk));
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', reject);
    });

    for (const user of users) {
      const displayName = user.name?.trim() || user.email.split('@')[0];
      const pdf = await renderCertificatePdf(browser, displayName, user.id);
      archive.append(pdf, { name: certificateFileName(displayName, user.id) });
    }

    await archive.finalize();
    const zipBuffer = await zipReady;

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="certificados-protagonismo-feminino.zip"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('Certificates bulk error:', detail, err);
    return NextResponse.json(
      { error: 'Erro ao gerar pacote de certificados', detail },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close().catch(() => undefined);
    }
  }
}
