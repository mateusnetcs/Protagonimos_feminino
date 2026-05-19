/** Estilos de layout para artes de post — o produto da foto permanece igual */

export type PostDesignVariant = {
  id: string;
  name: string;
  family: string;
  layout: string;
  background: string;
  accentColors: string;
  typography: string;
  decorations: string;
  benefitsHint: string;
  ctaHint: string;
};

export const POST_DESIGN_VARIANTS: PostDesignVariant[] = [
  {
    id: 'grunge-laranja',
    name: 'Grunge laranja',
    family: 'dark-bold',
    layout:
      'Product on the RIGHT with warm orange backlight glow. Marketing text stacked on the LEFT. Price badge on upper-right in a white circle.',
    background: 'Dark charcoal textured surface, orange paint splatter in corners, dramatic studio lighting.',
    accentColors: 'Vivid orange and white on dark charcoal.',
    typography: 'Bold sans-serif headlines; white script on orange brushstroke banners.',
    decorations: 'Orange horizontal brushstrokes behind subheadline and CTA; small leaf or slice props around product only.',
    benefitsHint: 'Three punchy badges with icons — urban street-market tone, not corporate.',
    ctaHint: 'Bold uppercase CTA on orange brushstroke banner.',
  },
  {
    id: 'minimal-clean',
    name: 'Minimal clean',
    family: 'light-minimal',
    layout:
      'Product CENTERED large. Text in upper area and lower strip. Price in a soft rounded rectangle at bottom-right, not a circle.',
    background: 'Clean off-white to light cream gradient, soft natural shadow under product, airy negative space.',
    accentColors: 'Deep forest green accents with charcoal text; no orange.',
    typography: 'Elegant mix: refined serif for product name, clean sans-serif for benefits and price.',
    decorations: 'Thin line dividers, subtle botanical line art; no brushstrokes or splatter.',
    benefitsHint: 'Three minimal line-icon benefits in a horizontal row — short words, lots of whitespace.',
    ctaHint: 'Understated text link style CTA, no heavy banners.',
  },
  {
    id: 'pop-gradiente',
    name: 'Pop gradiente',
    family: 'vibrant-pop',
    layout:
      'Product on the LEFT (large). Bold text blocks on the RIGHT in stacked colored panels. Price inside a tilted sticker shape.',
    background: 'Vibrant diagonal gradient coral-to-magenta-to-yellow, energetic youth-market feel.',
    accentColors: 'White and deep purple text on bright gradient panels.',
    typography: 'Extra-bold condensed sans-serif, playful rounded corners on text boxes.',
    decorations: 'Geometric circles and stars; no grunge textures.',
    benefitsHint: 'Three benefits inside colorful rounded pills — playful Gen-Z social ad.',
    ctaHint: 'Sticker-style "COMPRE AGORA" or similar energetic CTA.',
  },
  {
    id: 'rustico-artesanal',
    name: 'Rústico artesanal',
    family: 'warm-organic',
    layout:
      'Product slightly right of center on a wooden surface. Text in a kraft-paper style panel on the left with torn-edge look.',
    background: 'Warm wood table texture, soft window light from the left, cozy artisan market mood.',
    accentColors: 'Brown kraft, burnt sienna, cream and olive green.',
    typography: 'Handcrafted feel: slab serif headlines, handwritten-style script for frase and CTA.',
    decorations: 'Burlap or twine hints, stamped-style icons for benefits; no neon or splatter.',
    benefitsHint: 'Three stamped/seal-style benefit marks — feira artisanal, wording único em português.',
    ctaHint: 'Handwritten script CTA on kraft strip.',
  },
  {
    id: 'premium-dark',
    name: 'Premium dark',
    family: 'luxury-dark',
    layout:
      'Product centered with spotlight. Symmetric layout: headline top, benefits left column, price gold badge top-right, CTA bottom center ribbon.',
    background: 'Pure black with subtle vignette and single spotlight cone on product.',
    accentColors: 'Gold and champagne metallic accents on black.',
    typography: 'Luxury fashion ad: thin uppercase tracking for headlines, gold foil effect on price.',
    decorations: 'Minimal gold line frames; no fruit props unless already in product photo.',
    benefitsHint: 'Three refined vertical benefit lines with thin gold dividers — luxury boutique tone.',
    ctaHint: 'Elegant ribbon CTA with gold foil text.',
  },
  {
    id: 'fresh-natural',
    name: 'Fresh natural',
    family: 'fresh-light',
    layout:
      'Product on the RIGHT. Left column with soft rounded green badges for each benefit. Price in a leaf-shaped green tag.',
    background: 'Soft mint-green to sky-blue gradient, bright daylight, fresh farmers market aesthetic.',
    accentColors: 'Fresh green, sky blue and white.',
    typography: 'Friendly rounded sans-serif; light script only for frase.',
    decorations: 'Soft bokeh light spots, delicate leaf silhouettes in corners; clean and healthy.',
    benefitsHint: 'Three leaf-badge benefits — saúde e frescor, texto curto em português.',
    ctaHint: 'Friendly rounded button CTA in green.',
  },
  {
    id: 'retro-vintage',
    name: 'Retro vintage',
    family: 'retro',
    layout:
      'Product bottom-center. Arched headline banner across the top like 1970s print ad. Price in a starburst badge bottom-left.',
    background: 'Cream paper texture with subtle halftone dots and muted teal + mustard color blocks.',
    accentColors: 'Mustard yellow, teal and burnt red — no orange grunge.',
    typography: 'Retro condensed display font for headline; serif subheads.',
    decorations: 'Halftone dots, vintage ribbon banners; no modern flat UI cards.',
    benefitsHint: 'Three retro icon badges in a row — wording estilo cartaz antigo.',
    ctaHint: 'Starburst or ribbon vintage CTA.',
  },
  {
    id: 'editorial-magazine',
    name: 'Editorial revista',
    family: 'editorial',
    layout:
      'Product large on the RIGHT bleeding off-edge. Left: magazine column typography with oversized initial letter on headline.',
    background: 'High-fashion magazine spread: white with bold color block stripe (coral or cobalt) behind text only.',
    accentColors: 'Cobalt blue and coral on white — editorial, not grunge.',
    typography: 'High-contrast editorial serif headline + sans body; asymmetric text grid.',
    decorations: 'Thin rules, page number style footer accent; no splatter or wood texture.',
    benefitsHint: 'Three benefits as magazine pull-quotes with thin rules — tom sofisticado.',
    ctaHint: 'Small caps editorial CTA at bottom of text column.',
  },
  {
    id: 'neon-night',
    name: 'Neon night',
    family: 'neon',
    layout:
      'Product center with neon glow outline. Text stacked top-left in glowing boxes. Price in neon-outlined hexagon top-right.',
    background: 'Deep navy to purple night city blur, neon reflections on surface under product.',
    accentColors: 'Electric pink, cyan and lime neon on dark blue — no orange grunge.',
    typography: 'Bold geometric sans with neon glow effect on key words.',
    decorations: 'Neon lines, light streaks; no kraft paper or wood.',
    benefitsHint: 'Three neon-outline icon badges — nightlife / delivery app aesthetic.',
    ctaHint: 'Glowing neon button CTA.',
  },
];

export type PickDesignVariantsOptions = {
  /** Embaralhamento reproduzível (opcional, para debug) */
  seed?: number;
  /** Estilos já usados na geração anterior — evita repetir ao clicar de novo */
  excludeIds?: string[];
};

function randomInt(max: number): number {
  if (max <= 0) return 0;
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] % max;
  }
  return Math.floor(Math.random() * max);
}

function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
  const pool = [...arr];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = (seed + i * 7919) % (i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

function shuffleRandom<T>(arr: T[]): T[] {
  const pool = [...arr];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

/** Escolhe N estilos visualmente distintos (aleatório a cada geração) */
export function pickDesignVariants(
  count: number,
  options?: PickDesignVariantsOptions
): PostDesignVariant[] {
  const exclude = new Set(options?.excludeIds ?? []);
  let pool = POST_DESIGN_VARIANTS.filter((v) => !exclude.has(v.id));
  if (pool.length < count) {
    pool = [...POST_DESIGN_VARIANTS];
  }

  const shuffled =
    options?.seed !== undefined ? shuffleWithSeed(pool, options.seed) : shuffleRandom(pool);

  if (count <= 1) return shuffled.slice(0, count);

  const picked: PostDesignVariant[] = [];
  const usedFamilies = new Set<string>();

  for (const variant of shuffled) {
    if (picked.length >= count) break;
    if (usedFamilies.has(variant.family)) continue;
    picked.push(variant);
    usedFamilies.add(variant.family);
  }

  for (const variant of shuffled) {
    if (picked.length >= count) break;
    if (!picked.some((p) => p.id === variant.id)) picked.push(variant);
  }

  return picked.slice(0, count);
}

export function getPostVariantCount(): number {
  const raw = parseInt(process.env.POST_IMAGE_VARIANT_COUNT || '2', 10);
  if (Number.isNaN(raw) || raw < 1) return 2;
  return Math.min(raw, POST_DESIGN_VARIANTS.length);
}
