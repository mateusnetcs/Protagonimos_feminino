import {
  CONTEUDO_PROGRAMATICO_INTRO,
  MODULOS_PROGRAMATICOS,
  type ModuloProgramatico,
} from '@/lib/conteudo-programatico-data';
import { CERTIFICATE_PROJECT_SHORT } from '@/lib/certificate-project';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderModulo(modulo: ModuloProgramatico): string {
  const topicos = modulo.topicos
    .map((t) => `<li>${escapeHtml(t)}</li>`)
    .join('');

  return `<article class="verso-mod">
    <p class="verso-mod-num">Módulo ${modulo.ordem}</p>
    <h3 class="verso-mod-title">${escapeHtml(modulo.titulo)}</h3>
    <p class="verso-mod-sub">${escapeHtml(modulo.subtitulo)}</p>
    <p class="verso-mod-label">Conteúdos</p>
    <ul class="verso-mod-topics">${topicos}</ul>
  </article>`;
}

function renderColuna(titulo: string, modulos: ModuloProgramatico[]): string {
  if (modulos.length === 0) return '';

  return `<section class="verso-col">
    <h4 class="verso-col-title">${escapeHtml(titulo)}</h4>
    <div class="verso-mods-wrap">
      ${modulos.map(renderModulo).join('')}
    </div>
  </section>`;
}

/** Verso em 1 página — 3 colunas */
export function buildCertificateVersoHtml(): string {
  const col1 = MODULOS_PROGRAMATICOS.filter((m) => m.ordem >= 1 && m.ordem <= 4);
  const col2 = MODULOS_PROGRAMATICOS.filter((m) => m.ordem >= 5 && m.ordem <= 8);
  const col3 = MODULOS_PROGRAMATICOS.filter((m) => m.ordem >= 9);

  return `<div class="page page-verso">
    <div class="frame-outer frame-verso">
      <div class="frame-inner frame-inner-verso">
        <header class="verso-header">
          <p class="verso-kicker">${escapeHtml(CONTEUDO_PROGRAMATICO_INTRO.titulo)}</p>
          <h2 class="verso-title">${escapeHtml(CONTEUDO_PROGRAMATICO_INTRO.programa)}</h2>
          <p class="verso-brand">${escapeHtml(CONTEUDO_PROGRAMATICO_INTRO.oferta)}</p>
        </header>

        <div class="verso-columns verso-columns-3">
          ${renderColuna('Formação · módulos 1–4', col1)}
          ${renderColuna('Formação e plataforma · 5–8', col2)}
          ${renderColuna('Plataforma e encerramento · 9–11', col3)}
        </div>

        <p class="verso-footer">Imperatriz — MA · ${escapeHtml(CERTIFICATE_PROJECT_SHORT)}</p>
      </div>
    </div>
  </div>`;
}

export const CERTIFICATE_VERSO_STYLES = `
    .page-verso {
      width: 297mm;
      height: 210mm;
      padding: 5mm 7mm;
      background: #f5f0ea;
    }
    .frame-verso {
      height: 100%;
    }
    .frame-inner-verso {
      height: 100%;
      padding: 4mm 5mm 3mm;
      display: flex;
      flex-direction: column;
    }
    .verso-header {
      text-align: center;
      margin-bottom: 3mm;
      flex-shrink: 0;
    }
    .verso-kicker {
      font-family: 'Cinzel', serif;
      font-size: 10px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #c9781a;
      margin-bottom: 2px;
    }
    .verso-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 11px;
      font-weight: 700;
      color: #1a1510;
      line-height: 1.35;
      max-width: 98%;
      margin: 0 auto;
    }
    .verso-brand {
      font-family: 'Cinzel', serif;
      font-size: 8.5px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #b45309;
      margin-top: 3px;
    }
    .verso-columns {
      flex: 1;
      min-height: 0;
    }
    .verso-columns-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 5mm;
      align-items: stretch;
    }
    .verso-col {
      min-width: 0;
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .verso-col-title {
      font-family: 'Cinzel', serif;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #f48c25;
      border-bottom: 1px solid #e8c9a0;
      padding-bottom: 3px;
      margin-bottom: 3mm;
      line-height: 1.25;
      flex-shrink: 0;
    }
    .verso-mods-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 0;
    }
    .verso-mod {
      break-inside: avoid;
    }
    .verso-mod-num {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #c9781a;
    }
    .verso-mod-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 16px;
      font-weight: 700;
      color: #1a1510;
      line-height: 1.12;
      margin-top: 2px;
    }
    .verso-mod-sub {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 10px;
      color: #334155;
      font-style: italic;
      margin: 2px 0 3px;
      line-height: 1.2;
    }
    .verso-mod-label {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #64748b;
      margin-bottom: 2px;
    }
    .verso-mod-topics {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .verso-mod-topics li {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 10px;
      font-weight: 500;
      color: #1e293b;
      line-height: 1.35;
      padding-left: 10px;
      position: relative;
      margin-bottom: 2px;
    }
    .verso-mod-topics li::before {
      content: '•';
      position: absolute;
      left: 0;
      color: #f48c25;
      font-size: 10px;
      font-weight: 700;
    }
    .verso-footer {
      text-align: center;
      font-family: 'Cinzel', serif;
      font-size: 8px;
      color: #94a3b8;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-top: 2mm;
      flex-shrink: 0;
    }
`;
