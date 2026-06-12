import { existsSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import puppeteer, { type Browser } from 'puppeteer-core';

type CertificateBrowser = Browser & { __profileDir?: string };
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
  '--disable-crash-reporter',
  '--disable-breakpad',
  '--disable-features=Crashpad',
] as const;

function createChromiumProfileDir(): string {
  const base = process.env.CHROMIUM_USER_DATA_DIR?.trim() || tmpdir();
  return mkdtempSync(path.join(base, 'protagonimos-chromium-'));
}

export async function closeCertificateBrowser(browser: Browser): Promise<void> {
  const profileDir = (browser as CertificateBrowser).__profileDir;
  await browser.close().catch(() => undefined);
  if (profileDir) {
    try {
      rmSync(profileDir, { recursive: true, force: true });
    } catch {
      /* perfil já removido */
    }
  }
}

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
  const profileDir = createChromiumProfileDir();
  const configDir = path.join(profileDir, '.config');
  const cacheDir = path.join(profileDir, '.cache');
  const crashesDir = path.join(profileDir, 'crashes');

  try {
    const browser = (await puppeteer.launch({
      headless: true,
      executablePath,
      userDataDir: profileDir,
      env: {
        ...process.env,
        HOME: profileDir,
        XDG_CONFIG_HOME: configDir,
        XDG_CACHE_HOME: cacheDir,
      },
      args: [...CHROMIUM_ARGS, `--crash-dumps-dir=${crashesDir}`],
    })) as CertificateBrowser;

    browser.__profileDir = profileDir;
    return browser;
  } catch (err) {
    try {
      rmSync(profileDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Falha ao iniciar Chromium (${executablePath ?? 'sem caminho'}): ${message}`
    );
  }
}

async function waitForFonts(page: Awaited<ReturnType<Browser['newPage']>>): Promise<void> {
    await Promise.race([
    page.evaluate(() => document.fonts.ready),
    new Promise<void>((resolve) => setTimeout(resolve, 12000)),
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
    await closeCertificateBrowser(browser);
  }
}
