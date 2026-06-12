import { buildCertificateVersoHtml, CERTIFICATE_VERSO_STYLES } from '@/lib/certificate-verso-html';
import {
  CERTIFICATE_PROJECT_SHORT,
  CERTIFICATE_PROJECT_TITLE,
} from '@/lib/certificate-project';

/** HTML do certificado — tema TecnoProdutivo / Protagonismo Feminino */

export type CertificateHtmlOptions = {
  uemasulLogoDataUri?: string;
  administracaoLogoDataUri?: string;
  qrDataUri?: string;
  verifyUrl?: string;
};

export function buildCertificateHtml(
  recipientName: string,
  issuedAt = new Date(),
  options: CertificateHtmlOptions = {}
): string {
  const { uemasulLogoDataUri, administracaoLogoDataUri, qrDataUri, verifyUrl } = options;
  const name = recipientName.trim() || 'Participante';
  const dateStr = issuedAt.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <link href="https://fonts.googleapis.com/css2?family=Allura&family=Cinzel:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Great+Vibes&family=Pinyon+Script&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4 landscape; margin: 0; }
    body {
      width: 297mm;
      height: 210mm;
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #f5f0ea;
      color: #1a1510;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: 297mm;
      height: 210mm;
      padding: 10mm 12mm;
      position: relative;
      overflow: hidden;
      page-break-after: always;
    }
    .page:last-child {
      page-break-after: auto;
    }
    ${CERTIFICATE_VERSO_STYLES}

    /* Moldura externa ornamentada */
    .frame-outer {
      width: 100%;
      height: 100%;
      background: linear-gradient(145deg, #fffdf9 0%, #fff8f0 40%, #fffcf7 100%);
      border: 4px solid #c9781a;
      outline: 1.5px solid #f48c25;
      outline-offset: 3px;
      box-shadow: inset 0 0 0 6px #fff, inset 0 0 0 7px #f48c25aa;
      position: relative;
      padding: 5px;
    }
    .frame-inner {
      width: 100%;
      height: 100%;
      border: 1.5px solid #e8c9a0;
      position: relative;
      display: flex;
      flex-direction: column;
      padding: 8mm 12mm 10mm;
      overflow: hidden;
    }

    /* Padrão guilloché sutil */
    .bg-pattern {
      position: absolute;
      inset: 0;
      opacity: 0.045;
      background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23f48c25' stroke-width='0.6'%3E%3Cpath d='M30 0c0 16.57-13.43 30-30 30'/%3E%3Cpath d='M60 30c-16.57 0-30 13.43-30 30'/%3E%3Cpath d='M0 30c16.57 0 30-13.43 30-30'/%3E%3Cpath d='M30 60c0-16.57 13.43-30 30-30'/%3E%3C/g%3E%3C/svg%3E");
      pointer-events: none;
    }

    /* Cantos ornamentados SVG */
    .ornament {
      position: absolute;
      width: 72px;
      height: 72px;
      opacity: 0.55;
      pointer-events: none;
    }
    .ornament-tl { top: 4mm; left: 4mm; display: none; }

    /* Logos — canto superior esquerdo */
    .logos-wrap {
      position: absolute;
      top: 4mm;
      left: 5mm;
      z-index: 4;
      display: flex;
      align-items: center;
      gap: 3mm;
      line-height: 0;
    }
    .logos-wrap img.logo-uemasul {
      height: 19mm;
      width: auto;
      max-width: 34mm;
      object-fit: contain;
      display: block;
      opacity: 0.5;
    }
    .logo-uemasul-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5mm;
    }
    .logos-wrap img.logo-admin {
      height: 14mm;
      width: auto;
      max-width: 28mm;
      object-fit: contain;
      display: block;
      opacity: 0.45;
    }
    .ornament-tr { top: 4mm; right: 4mm; transform: scaleX(-1); display: none; }
    .ornament-bl { bottom: 4mm; left: 4mm; transform: scaleY(-1); }
    .ornament-br { bottom: 4mm; right: 4mm; transform: scale(-1); }

    /* Faixas laterais decorativas */
    .side-band {
      position: absolute;
      top: 18mm;
      bottom: 18mm;
      width: 14px;
      background: repeating-linear-gradient(
        180deg,
        #f48c25 0px, #f48c25 3px,
        transparent 3px, transparent 7px,
        #e8c9a0 7px, #e8c9a0 8px,
        transparent 8px, transparent 12px
      );
      opacity: 0.35;
    }
    .side-band-left { left: 6mm; }
    .side-band-right { right: 6mm; }

    .watermark {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Cinzel', serif;
      font-size: 64px;
      font-weight: 600;
      letter-spacing: 0.15em;
      color: #f48c25;
      opacity: 0.035;
      transform: rotate(-12deg);
      pointer-events: none;
      user-select: none;
    }

    /* Cabeçalho */
    .header {
      text-align: center;
      position: relative;
      z-index: 1;
      margin-bottom: 3mm;
    }
    .top-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 5px;
    }
    .divider-line {
      height: 1px;
      width: 52px;
      background: linear-gradient(90deg, transparent, #f48c25, transparent);
    }
    .badge {
      display: inline-block;
      background: linear-gradient(135deg, #f48c25 0%, #d97706 50%, #e67a12 100%);
      color: #fff;
      font-family: 'Cinzel', serif;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      padding: 6px 18px;
      border-radius: 2px;
      box-shadow: 0 2px 8px rgba(244, 140, 37, 0.35);
      border: 1px solid #c9781a;
    }
    .brand {
      font-family: 'Cinzel', serif;
      font-size: 14px;
      font-weight: 500;
      color: #b45309;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .project-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.02em;
      text-transform: none;
      line-height: 1.4;
      max-width: 92%;
      margin: 0 auto 6px;
      color: #92400e;
    }
    .title-wrap {
      position: relative;
      display: inline-block;
      margin: 2px 0;
    }
    .title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 52px;
      font-weight: 700;
      color: #1a1510;
      line-height: 1.1;
      letter-spacing: 0.02em;
    }
    .title-underline {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 4px;
    }
    .title-underline svg { flex-shrink: 0; }
    .title-underline .line {
      height: 1px;
      width: 80px;
      background: linear-gradient(90deg, transparent, #d4a574, #f48c25, #d4a574, transparent);
    }
    .subtitle {
      font-family: 'Cormorant Garamond', serif;
      font-size: 20px;
      font-style: italic;
      color: #64748b;
      margin-top: 5px;
      font-weight: 500;
    }

    /* QR Code de verificação — canto superior direito */
    .qr-wrap {
      position: absolute;
      top: 4mm;
      right: 7mm;
      z-index: 4;
    }
    .qr-box {
      width: 22mm;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .qr-url {
      width: 22mm;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 4.6px;
      line-height: 1.3;
      color: #64748b;
      word-break: break-all;
      text-align: center;
      margin-bottom: 2px;
      font-weight: 500;
    }
    .qr-box img {
      width: 22mm;
      height: 22mm;
      border: 1.5px solid #e8c9a0;
      padding: 2px;
      background: #fff;
      display: block;
      box-sizing: border-box;
    }
    .qr-label {
      width: 22mm;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 5.5px;
      color: #94a3b8;
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      font-weight: 600;
      line-height: 1.2;
      text-align: center;
    }

    /* Corpo */
    .body {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 0 16mm;
      position: relative;
      z-index: 1;
    }
    .intro {
      font-family: 'Cormorant Garamond', serif;
      font-size: 21px;
      line-height: 1.7;
      color: #3d3830;
      max-width: 210mm;
      margin-bottom: 4mm;
    }
    .intro strong {
      font-weight: 700;
      color: #b45309;
    }
    .name-block {
      margin: 2mm 0 3mm;
      position: relative;
    }
    .recipient-label {
      font-family: 'Cinzel', serif;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.35em;
      color: #c9781a;
      margin-bottom: 4px;
    }
    .recipient-name {
      font-family: 'Allura', 'Great Vibes', 'Pinyon Script', cursive;
      font-size: 56px;
      font-weight: 400;
      font-style: normal;
      color: #d97706;
      line-height: 1.2;
      padding: 2mm 14mm 3mm;
      background: linear-gradient(180deg, transparent 85%, rgba(244,140,37,0.12) 85%, rgba(244,140,37,0.12) 88%, transparent 88%);
      position: relative;
    }
    .name-ornament {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-top: 2px;
    }
    .name-ornament .dot {
      width: 5px;
      height: 5px;
      background: #f48c25;
      transform: rotate(45deg);
      opacity: 0.7;
    }
    .name-ornament .hline {
      width: 90px;
      height: 1px;
      background: linear-gradient(90deg, transparent, #e8c9a0, #f48c25, #e8c9a0, transparent);
    }
    /* Assinaturas */
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12mm;
      max-width: 78%;
      margin-left: auto;
      margin-right: auto;
      margin-top: auto;
      padding-top: 5mm;
      position: relative;
      z-index: 1;
    }
    .sig {
      text-align: center;
    }
    .sig-line-wrap {
      margin: 0 3mm;
      position: relative;
    }
    .sig-line {
      border-top: 1.5px solid #334155;
      height: 0;
      margin: 0;
    }
    .sig-line-wrap::before,
    .sig-line-wrap::after {
      content: '';
      position: absolute;
      top: -3px;
      width: 6px;
      height: 6px;
      border: 1px solid #f48c25;
      transform: rotate(45deg);
      background: #fffdf9;
    }
    .sig-line-wrap::before { left: -2px; }
    .sig-line-wrap::after { right: -2px; }
    .sig-name {
      font-family: 'Allura', 'Great Vibes', 'Pinyon Script', cursive;
      font-size: 30px;
      font-weight: 400;
      font-style: normal;
      color: #1e293b;
      margin-bottom: 2px;
      line-height: 1.15;
      padding: 0 2mm;
    }
    .sig-role {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 11px;
      color: #64748b;
      margin-top: 5px;
      line-height: 1.35;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .logo-uemasul-label {
      font-family: 'Cinzel', serif;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.18em;
      color: #92400e;
      text-align: center;
      margin-top: 1mm;
    }

    /* Rodapé */
    .footer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-top: 4mm;
      position: relative;
      z-index: 1;
    }
    .footer .fline {
      width: 40px;
      height: 1px;
      background: linear-gradient(90deg, transparent, #d4a574);
    }
    .footer .fline-r {
      background: linear-gradient(90deg, #d4a574, transparent);
    }
    .footer-date {
      font-family: 'Cinzel', serif;
      font-size: 13px;
      color: #94a3b8;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="page page-front">
    <div class="frame-outer">
      <div class="frame-inner">
        <div class="bg-pattern"></div>
        <div class="watermark">PROTAGONISMO FEMININO</div>
        <div class="side-band side-band-left"></div>
        <div class="side-band side-band-right"></div>

        ${buildLogosBlock(uemasulLogoDataUri, administracaoLogoDataUri)}
        ${cornerOrnament('ornament-tr')}
        ${cornerOrnament('ornament-bl')}
        ${cornerOrnament('ornament-br')}

        ${buildQrBlock(qrDataUri, verifyUrl)}

        <div class="header">
          <div class="top-row">
            <div class="divider-line"></div>
            <div class="badge">${escapeHtml(CERTIFICATE_PROJECT_SHORT)}</div>
            <div class="divider-line"></div>
          </div>
          <div class="brand project-title">${escapeHtml(CERTIFICATE_PROJECT_TITLE)}</div>
          <div class="title-wrap">
            <h1 class="title">Certificado de Participação</h1>
            <div class="title-underline">
              <div class="line"></div>
              <svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 0 L8.5 5.5 L14 7 L8.5 8.5 L7 14 L5.5 8.5 L0 7 L5.5 5.5 Z" fill="#f48c25" opacity="0.8"/></svg>
              <div class="line"></div>
            </div>
          </div>
          <p class="subtitle">Capacitações e formação em empreendedorismo feminino</p>
        </div>

        <div class="body">
          <p class="intro">
            Certificamos, para os devidos fins, que a participante abaixo identificada concluiu
            com êxito as atividades formativas e capacitações do projeto
            <strong>${escapeHtml(CERTIFICATE_PROJECT_TITLE)}</strong>, ofertado pela
            <strong>UEMASUL</strong> e pelo <strong>Curso de Administração</strong>, promovido
            em Imperatriz — MA.
          </p>
          <div class="name-block">
            <div class="recipient-label">Participante</div>
            <div class="recipient-name">${escapeHtml(name)}</div>
            <div class="name-ornament">
              <div class="hline"></div>
              <div class="dot"></div>
              <div class="hline"></div>
            </div>
          </div>
        </div>

        <div class="signatures">
          <div class="sig">
            <div class="sig-name">Profa. Iracema Rocha da Silva</div>
            <div class="sig-line-wrap"><div class="sig-line"></div></div>
            <div class="sig-role">Coordenadora do Projeto</div>
          </div>
          <div class="sig">
            <div class="sig-name">Claudio Jhonson pereira Alves</div>
            <div class="sig-line-wrap"><div class="sig-line"></div></div>
            <div class="sig-role">Superintendente de Agricultura familiar de imperatriz</div>
          </div>
        </div>

        <div class="footer">
          <div class="fline"></div>
          <p class="footer-date">Imperatriz — MA, ${escapeHtml(dateStr)}</p>
          <div class="fline fline-r"></div>
        </div>
      </div>
    </div>
  </div>

  ${buildCertificateVersoHtml()}
</body>
</html>`;
}

function buildQrBlock(qrDataUri?: string, verifyUrl?: string): string {
  if (!qrDataUri || !verifyUrl) return '';

  return `<div class="qr-wrap">
    <div class="qr-box">
      <p class="qr-url">${escapeHtml(verifyUrl)}</p>
      <img src="${qrDataUri}" alt="QR Code verificação" />
      <p class="qr-label">Verificar<br/>autenticidade</p>
    </div>
  </div>`;
}

function buildLogosBlock(uemasul?: string, administracao?: string): string {
  if (!uemasul && !administracao) return cornerOrnament('ornament-tl');

  const uemasulImg = uemasul
    ? `<div class="logo-uemasul-block">
        <img class="logo-uemasul" src="${uemasul}" alt="UEMASUL" />
        <p class="logo-uemasul-label">UEMASUL</p>
      </div>`
    : '';
  const adminImg = administracao
    ? `<img class="logo-admin" src="${administracao}" alt="Curso de Administração" />`
    : '';

  return `<div class="logos-wrap">${uemasulImg}${adminImg}</div>`;
}

function cornerOrnament(className: string): string {
  return `<svg class="ornament ${className}" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4 C20 4 28 12 32 28" fill="none" stroke="#f48c25" stroke-width="1.2"/>
    <path d="M4 4 C4 20 12 28 28 32" fill="none" stroke="#f48c25" stroke-width="1.2"/>
    <path d="M8 8 C18 8 24 14 26 24" fill="none" stroke="#e8c9a0" stroke-width="0.8"/>
    <path d="M8 8 C8 18 14 24 24 26" fill="none" stroke="#e8c9a0" stroke-width="0.8"/>
    <circle cx="6" cy="6" r="2.5" fill="#f48c25" opacity="0.7"/>
    <path d="M14 4 L16 8 L20 8 L17 11 L18 15 L14 13 L10 15 L11 11 L8 8 L12 8 Z" fill="#f48c25" opacity="0.45" transform="scale(0.7) translate(4,2)"/>
    <path d="M4 14 L6 18 L10 18 L7 21 L8 25 L4 23 L0 25 L1 21 L-2 18 L2 18 Z" fill="#f48c25" opacity="0.35" transform="scale(0.6) translate(2,8)"/>
  </svg>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function certificateFileName(recipientName: string, userId: string): string {
  const slug = recipientName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `certificado-${slug || 'participante'}-${userId}.pdf`;
}
