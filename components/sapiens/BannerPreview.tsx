'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { BannerContent, BannerSection, BannerVersion } from '@/lib/sapiens-content';
import { AdoptionChart, ColumnsChart, HBarChart } from './SapiensCharts';

/** Carlito: métrica idêntica à Calibri (fonte do template) — a prévia fica igual ao .pptx. */
const FONT_FACE = `
@font-face { font-family: 'SapiensCarlito'; src: url('/sapiens/fonts/Carlito-Regular.ttf') format('truetype'); font-weight: 400; font-display: swap; }
@font-face { font-family: 'SapiensCarlito'; src: url('/sapiens/fonts/Carlito-Bold.ttf') format('truetype'); font-weight: 700; font-display: swap; }
`;
const FONT_STACK = 'Calibri, SapiensCarlito, Carlito, Arial, sans-serif';

type Page = { w: number; h: number };

function abs(x: number, y: number, w: number, h: number, page: Page): CSSProperties {
  return {
    position: 'absolute',
    left: `${(x / page.w) * 100}%`,
    top: `${(y / page.h) * 100}%`,
    width: `${(w / page.w) * 100}%`,
    height: `${(h / page.h) * 100}%`,
  };
}

/**
 * Banner IX SAPIENS em HTML (folha 90 × 120 cm) nas duas versões.
 * Os blocos seguem em fluxo com espaçamento uniforme — mesma regra usada pelo gerador do .pptx.
 */
export default function BannerPreview({ banner, version }: { banner: BannerContent; version: BannerVersion }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const L = version === 'v1' ? banner.layout : banner.layoutV2;
  const page = L.page;
  const F = L.fonts;
  const C = L.content;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cm = width / page.w;
  /** pt (tamanho real impresso) → px na prévia */
  const pt = (v: number) => v * 0.03528 * cm;

  const header = (title: string) => (
    <div
      style={{
        height: L.headerH * cm,
        fontSize: pt(F.headerPt),
        borderWidth: Math.max(1, cm * 0.08),
        borderRadius: `${cm * 0.7}px 0 ${cm * 0.7}px 0`,
      }}
      className="flex shrink-0 items-center justify-center bg-[#d0cece] border-black font-bold text-black leading-none"
    >
      {title}
    </div>
  );

  const textBlock = (children: ReactNode, extraTop = L.headerGap) => (
    <div
      style={{
        marginTop: extraTop * cm,
        padding: `${L.inset.y * cm}px ${L.inset.x * cm}px`,
        fontSize: pt(F.bodyPt),
        lineHeight: L.lineHeight,
      }}
      className="text-justify text-black"
      lang="pt-BR"
    >
      {children}
    </div>
  );

  const section = (s: BannerSection) => (
    <div key={s.id} className="flex flex-col">
      {header(s.title)}
      {textBlock(s.paragraphs.map((p, i) => <p key={i}>{p}</p>))}
    </div>
  );

  const column = (children: ReactNode) => (
    <div className="flex flex-col" style={{ gap: L.gap * cm }}>
      {children}
    </div>
  );

  const twoCols = (left: ReactNode, right: ReactNode) => (
    <div className="grid items-start" style={{ gridTemplateColumns: `${C.colW * cm}px ${C.colW * cm}px`, columnGap: C.colGap * cm }}>
      {left}
      {right}
    </div>
  );

  const qr = (size: number) => (
    <QRCodeSVG
      value={banner.qr.url}
      size={256}
      level="M"
      marginSize={1}
      fgColor="#021e5d"
      style={{ width: size * cm, height: size * cm, flexShrink: 0 }}
    />
  );

  let body: ReactNode;
  if (version === 'v1') {
    const V1 = banner.layout;
    body = (
      <div
        className="grid h-full items-stretch"
        style={{ gridTemplateColumns: `${C.colW * cm}px ${C.colW * cm}px`, columnGap: C.colGap * cm }}
      >
        {column(
          <>
            {section(banner.introducao)}
            {section(banner.metodos)}
            {section(banner.conclusoes)}
            <div className="flex items-center" style={{ gap: cm * 0.6 }}>
              {qr(V1.qrSize)}
              <p style={{ fontSize: pt(F.bodyPt), lineHeight: L.lineHeight }} className="text-black">
                {banner.qr.caption}
              </p>
            </div>
          </>
        )}
        <div className="flex h-full min-h-0 flex-col" style={{ gap: L.gap * cm }}>
          {section(banner.resultados)}
          {/* o gráfico ocupa o espaço que sobra na coluna */}
          <div className="min-h-0 flex-1" style={{ minHeight: V1.chartMinH * cm }}>
            <AdoptionChart data={banner.chart.data} height="100%" fontSize={pt(F.chartPt)} />
          </div>
          {section(banner.referencias)}
        </div>
      </div>
    );
  } else {
    const K = banner.layoutV2.cards;
    const v2 = banner.v2;
    const card = (title: string, children: ReactNode, w?: number) => (
      <div
        style={{ borderWidth: Math.max(1, cm * 0.06), width: w ? w * cm : undefined }}
        className={`flex flex-col border-slate-300 bg-white ${w ? 'shrink-0' : 'flex-1 min-w-0'}`}
      >
        <div
          style={{ height: K.titleH * cm, fontSize: pt(F.chartTitlePt), lineHeight: 1.15, padding: `0 ${cm * 0.6}px` }}
          className="flex shrink-0 items-center justify-center text-center font-bold text-[#021e5d]"
        >
          {title}
        </div>
        <div className="flex-1 min-h-0" style={{ padding: `0 ${cm * 0.6}px ${cm * 0.4}px` }}>
          {children}
        </div>
      </div>
    );
    body = (
      <div className="flex h-full flex-col" style={{ gap: L.gap * cm }}>
        {twoCols(section(banner.introducao), section(banner.metodos))}
        <div className="flex min-h-0 flex-1 flex-col">
          {header(banner.resultados.title)}
          {/* os cartões ocupam o espaço que sobra no banner */}
          <div className="flex flex-1" style={{ minHeight: K.minH * cm, gap: K.gap * cm, marginTop: L.headerGap * cm }}>
            {card(
              v2.chartPct.title,
              <ColumnsChart
                data={v2.chartPct.data}
                suffix={v2.chartPct.suffix}
                height="100%"
                fontSize={pt(F.chartPt)}
                valueFontSize={pt(F.chartValuePt)}
              />
            )}
            {card(
              v2.chartVolume.title,
              <HBarChart
                data={v2.chartVolume.data}
                height="100%"
                fontSize={pt(F.chartPt)}
                valueFontSize={pt(F.chartValuePt)}
                highlightFirst
                labelWidthEm={19}
                tooltipUnit=""
              />
            )}
            {card(
              v2.qrTitle,
              <div className="flex h-full flex-col items-center justify-center">
                {qr(K.qrW - 2.4)}
                <span style={{ fontSize: pt(F.chartPt), marginTop: cm * 0.4 }} className="font-bold text-[#0435da]">
                  {v2.qrHint}
                </span>
              </div>,
              K.qrW
            )}
          </div>
          {textBlock(
            <p>
              <strong>{v2.caption.source}</strong> {v2.caption.text}
            </p>
          )}
        </div>
        {twoCols(section(banner.conclusoes), section(banner.referencias))}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden bg-white shadow-xl ring-1 ring-slate-200"
      style={{ aspectRatio: `${page.w} / ${page.h}`, fontFamily: FONT_STACK }}
    >
      <style dangerouslySetInnerHTML={{ __html: FONT_FACE }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/sapiens/banner-fundo.png" alt="" style={abs(L.background.x, L.background.y, L.background.w, L.background.h, page)} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/sapiens/ix-sapiens-logo.png" alt="IX SAPIENS" style={abs(L.logo.x, L.logo.y, L.logo.w, L.logo.h, page)} />

      <div
        className="absolute flex flex-col"
        style={{
          left: `${(L.title.x / page.w) * 100}%`,
          top: `${(L.title.y / page.h) * 100}%`,
          width: `${(L.title.w / page.w) * 100}%`,
          height: `${((L.fillTo - L.title.y) / page.h) * 100}%`,
          gap: L.gap * cm,
        }}
      >
        <div
          className="text-center font-bold text-black"
          style={{ padding: `${L.inset.y * cm}px ${L.inset.x * cm}px`, lineHeight: L.lineHeight }}
        >
          <p style={{ fontSize: pt(F.titlePt) }} className="uppercase">
            {banner.title}
          </p>
          {banner.authors.map((a) => (
            <p key={a.email} style={{ fontSize: pt(F.authorsPt) }}>
              {a.line}
            </p>
          ))}
        </div>
        <div className="min-h-0 flex-1" style={{ marginLeft: (C.x - L.title.x) * cm, width: C.w * cm }}>
          {body}
        </div>
      </div>
    </div>
  );
}
