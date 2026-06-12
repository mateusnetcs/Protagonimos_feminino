import { existsSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import puppeteer, { type Browser } from 'puppeteer-core';
import { buildCertificateHtml } from '@/lib/certificate-html';
import { getCertificateLogos } from '@/lib/certificate-logo';
import { createCertificateQrDataUri } from '@/lib/certificate-qr';
import { getCertificateVerifyUrl } from '@/lib/certificate-verify';

type CertificateBrowser = Browser & { __profileDir?: string };

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

function getBrowserCandidates(): string[] {
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA;
    return [
      process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      process.env['PROGRAMFILES(X86)'] &&
        path.join(process.env['PROGRAMFILES(X86)'], 'Google', 'Chrome', 'Application', 'chrome.exe'),
      localAppData && path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      process.env['PROGRAMFILES(X86)'] &&
        path.join(process.env['PROGRAMFILES(X86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      localAppData && path.join(localAppData, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    ].filter((candidate): candidate is string => Boolean(candidate));
  }

  if (process.platform === 'darwin') {
    return [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    ];
  }

  return ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'];
}

function getExecutablePath(): string {
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  if (fromEnv && existsSync(fromEnv)) return fromEnv;

  for (const candidate of getBrowserCandidates()) {
    if (existsSync(candidate)) return candidate;
  }

  throw new Error(
    'Navegador não encontrado. Instale Google Chrome ou Microsoft Edge, ou defina PUPPETEER_EXECUTABLE_PATH no .env.local.'
  );
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
    throw new Error(`Falha ao iniciar Chromium (${executablePath}): ${message}`);
  }
}

async function waitForFonts(page: Awaited<ReturnType<Browser['newPage']>>): Promise<void> {
  await Promise.race([
    page.evaluate(async () => {
      const families = [
        '22px "Brush Script MT"',
        '22px "Brush Script Std"',
        '22px "Segoe Script"',
        '22px "Dancing Script"',
        '56px "Allura"',
      ];
      await Promise.all(families.map((spec) => document.fonts.load(spec).catch(() => undefined)));
      await document.fonts.ready;
    }),
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
