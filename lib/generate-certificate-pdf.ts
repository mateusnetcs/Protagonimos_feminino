import { existsSync } from 'fs';
import puppeteer, { type Browser } from 'puppeteer-core';
import { buildCertificateHtml } from '@/lib/certificate-html';
import { getCertificateLogos } from '@/lib/certificate-logo';
import { createCertificateQrDataUri } from '@/lib/certificate-qr';
import { getCertificateVerifyUrl } from '@/lib/certificate-verify';

const CHROMIUM_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--disable-software-rasterizer',
  '--font-render-hinting=none',
] as const;

function getExecutablePath(): string | undefined {
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  if (fromEnv) return fromEnv;

  if (process.platform !== 'linux') return undefined;

  for (const candidate of ['/usr/bin/chromium', '/usr/bin/chromium-browser']) {
    if (existsSync(candidate)) return candidate;
  }

  return '/usr/bin/chromium';
}

export async function launchCertificateBrowser(): Promise<Browser> {
  const executablePath = getExecutablePath();
  try {
    return await puppeteer.launch({
      headless: true,
      executablePath,
      args: [...CHROMIUM_ARGS],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Falha ao iniciar Chromium (${executablePath ?? 'sem caminho'}): ${message}`
    );
  }
}

async function waitForFonts(page: Awaited<ReturnType<Browser['newPage']>>): Promise<void> {
  await Promise.race([
    page.evaluate(() => document.fonts.ready),
    new Promise<void>((resolve) => setTimeout(resolve, 8000)),
  ]);
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
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await waitForFonts(page);
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
