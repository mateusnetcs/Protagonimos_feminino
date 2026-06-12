import puppeteer, { type Browser } from 'puppeteer-core';
import { buildCertificateHtml } from '@/lib/certificate-html';
import { getCertificateLogos } from '@/lib/certificate-logo';
import { createCertificateQrDataUri } from '@/lib/certificate-qr';
import { getCertificateVerifyUrl } from '@/lib/certificate-verify';

function getExecutablePath(): string | undefined {
  if (process.env.PUPPETEER_EXECUTABLE_PATH?.trim()) {
    return process.env.PUPPETEER_EXECUTABLE_PATH.trim();
  }
  if (process.platform === 'linux') {
    return '/usr/bin/chromium';
  }
  return undefined;
}

export async function launchCertificateBrowser(): Promise<Browser> {
  const executablePath = getExecutablePath();
  return puppeteer.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
}

async function buildCertificatePdfHtml(
  recipientName: string,
  userId: string,
  issuedAt?: Date
): Promise<string> {
  const verifyUrl = getCertificateVerifyUrl(userId);
  const [logos, qrDataUri] = await Promise.all([
    getCertificateLogos(),
    createCertificateQrDataUri(verifyUrl),
  ]);

  return buildCertificateHtml(recipientName, issuedAt, {
    uemasulLogoDataUri: logos.uemasul ?? undefined,
    administracaoLogoDataUri: logos.administracao ?? undefined,
    qrDataUri,
    verifyUrl,
  });
}

export async function renderCertificatePdf(
  browser: Browser,
  recipientName: string,
  userId: string,
  issuedAt?: Date
): Promise<Buffer> {
  const html = await buildCertificatePdfHtml(recipientName, userId, issuedAt);
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: 'load', timeout: 45000 });
    await page.evaluate(() => document.fonts.ready);
    const pdf = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

export async function generateCertificatePdf(
  recipientName: string,
  userId: string,
  issuedAt?: Date
): Promise<Buffer> {
  const browser = await launchCertificateBrowser();
  try {
    return await renderCertificatePdf(browser, recipientName, userId, issuedAt);
  } finally {
    await browser.close();
  }
}
