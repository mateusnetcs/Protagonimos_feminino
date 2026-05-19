/** Gera arte de post usando SEMPRE a foto real do produto como base */

import {
  pickDesignVariants,
  getPostVariantCount,
  type PickDesignVariantsOptions,
  type PostDesignVariant,
} from '@/lib/post-design-variants';

type ProductInfo = {
  name: string;
  category?: string;
  description?: string;
};

export type PostImagePromptOptions = {
  includeNome: boolean;
  includePreco: boolean;
  includeFrase: boolean;
  priceStr: string;
  fraseProduto?: string;
  pickVariants?: PickDesignVariantsOptions;
};

function isGptImageModel(model: string) {
  return model.startsWith('gpt-image');
}

export function resolveProductImageUrl(imageUrl: string): string {
  const trimmed = imageUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const base = (process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(
    /\/$/,
    ''
  );
  return trimmed.startsWith('/') ? `${base}${trimmed}` : `${base}/${trimmed}`;
}

async function fetchProductImageBytes(
  imageUrl: string
): Promise<{ buffer: Buffer; mime: string; filename: string }> {
  const resolved = resolveProductImageUrl(imageUrl);
  const res = await fetch(resolved, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Não foi possível carregar a foto do produto. Verifique se a imagem existe.');
  }
  const mime = res.headers.get('content-type')?.split(';')[0]?.trim() || 'image/jpeg';
  const ext = mime.includes('png') ? 'png' : 'jpg';
  return {
    buffer: Buffer.from(await res.arrayBuffer()),
    mime,
    filename: `product.${ext}`,
  };
}

function extractImageFromResponse(data: {
  data?: Array<{ b64_json?: string; url?: string }>;
}): string | null {
  const item = data?.data?.[0];
  if (!item) return null;
  if (item.b64_json) {
    return `data:image/png;base64,${item.b64_json}`;
  }
  if (item.url) {
    return item.url;
  }
  return null;
}

function buildTypographySection(
  product: ProductInfo,
  options: PostImagePromptOptions,
  variant: PostDesignVariant
): string {
  const textBlocks: string[] = [];

  if (options.includeNome) {
    const words = product.name.trim().split(/\s+/);
    const first = words[0]?.toUpperCase() || product.name.toUpperCase();
    const rest = words.slice(1).join(' ').toUpperCase() || 'NATURAL';
    textBlocks.push(
      `Product name headline: "${first}" prominent, "${rest}" secondary — use the variant accent colors.`
    );
  }

  if (options.includeFrase && options.fraseProduto) {
    textBlocks.push(`Highlight phrase in Portuguese: "${options.fraseProduto}".`);
  } else if (options.includeFrase) {
    textBlocks.push('Short catchy Portuguese marketing phrase.');
  }

  if (options.includePreco) {
    textBlocks.push(
      `Price badge: "APENAS" small above "R$ ${options.priceStr}" large and bold (Portuguese).`
    );
  }

  if (options.includeNome || options.includeFrase) {
    textBlocks.push(`Three benefit badges with icons — ${variant.benefitsHint}`);
    textBlocks.push(`Call to action in Portuguese — ${variant.ctaHint}`);
  }

  if (textBlocks.length === 0) return '';
  return `\n\nTEXT CONTENT (all in Portuguese, sharp and readable):\n${textBlocks.map((b) => `- ${b}`).join('\n')}`;
}

/** Layout de anúncio com estilo variável */
export function buildPostImagePrompt(
  product: ProductInfo,
  options: PostImagePromptOptions,
  variant: PostDesignVariant
): string {
  const category = product.category || 'produto artesanal brasileiro';
  const textSection = buildTypographySection(product, options, variant);

  return `Square 1080x1080 professional Brazilian Instagram advertisement.
Design style: "${variant.name}" (id: ${variant.id}) — MUST look completely different from other ad styles. Do NOT default to orange grunge unless this style is "Grunge laranja".
Category: ${category}.

LAYOUT: ${variant.layout}
BACKGROUND: ${variant.background}
COLORS: ${variant.accentColors}
TYPOGRAPHY: ${variant.typography}
DECORATIONS: ${variant.decorations}${textSection}`;
}

/** Prompt para edição — preserva o produto da foto original */
export function buildPostImageFromPhotoPrompt(
  product: ProductInfo,
  options: PostImagePromptOptions,
  variant: PostDesignVariant
): string {
  return `CRITICAL: Keep the EXACT product from the input photograph unchanged — same item, shape, colors, packaging, label and proportions. Do NOT replace it with a different product, bottle, fruit or package. Do NOT redraw the product.

Create design style "${variant.name}" — this layout must be visually DIFFERENT from other ad templates (other color palettes, other text placement, other background).

Only add professional Instagram ad design AROUND and BEHIND the existing product photo:
${buildPostImagePrompt(product, options, variant)}

You may add complementary props around the product but the hero product itself must match the uploaded photo exactly.`;
}

async function generatePostImageEditOpenAI(
  apiKey: string,
  productImageUrl: string,
  product: ProductInfo,
  options: PostImagePromptOptions,
  model: string,
  variant: PostDesignVariant
): Promise<{ imageUrl: string | null; error: string | null }> {
  const prompt = buildPostImageFromPhotoPrompt(product, options, variant);

  try {
    const { buffer, mime, filename } = await fetchProductImageBytes(productImageUrl);
    const form = new FormData();
    form.append('image', new Blob([buffer], { type: mime }), filename);
    form.append('prompt', prompt);
    form.append('model', model);
    form.append('size', '1024x1024');

    if (isGptImageModel(model)) {
      form.append('quality', 'high');
    }

    const res = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        imageUrl: null,
        error: (data?.error?.message as string) || `OpenAI Edits HTTP ${res.status}`,
      };
    }

    const imageUrl = extractImageFromResponse(data);
    if (imageUrl) return { imageUrl, error: null };
    return { imageUrl: null, error: 'OpenAI não retornou imagem na edição.' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { imageUrl: null, error: msg };
  }
}

async function generateOneVariant(
  apiKey: string,
  productImageUrl: string,
  product: ProductInfo,
  options: PostImagePromptOptions,
  variant: PostDesignVariant
): Promise<{ imageUrl: string | null; error: string | null }> {
  const models = [
    (process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1').trim(),
    'gpt-image-1',
    'dall-e-2',
  ];
  const uniqueModels = [...new Set(models.filter(Boolean))];

  let lastError: string | null = null;
  for (const model of uniqueModels) {
    const result = await generatePostImageEditOpenAI(
      apiKey,
      productImageUrl,
      product,
      options,
      model,
      variant
    );
    if (result.imageUrl) return result;
    lastError = result.error;
    if (result.error && !/model|endpoint/i.test(result.error)) break;
  }
  return { imageUrl: null, error: lastError };
}

export type GeneratePostImagesResult = {
  imageUrls: string[];
  imageUrl: string | null;
  error: string | null;
  variantsUsed: string[];
};

/**
 * Gera várias artes (designs diferentes) usando a foto cadastrada do produto.
 */
export async function generatePostImagesOpenAI(
  apiKey: string,
  product: ProductInfo & { id?: number },
  options: PostImagePromptOptions,
  productImageUrl: string | null | undefined
): Promise<GeneratePostImagesResult> {
  if (!productImageUrl?.trim()) {
    return {
      imageUrls: [],
      imageUrl: null,
      error: 'Cadastre uma foto do produto na aba Produtos antes de gerar o post.',
      variantsUsed: [],
    };
  }

  const count = getPostVariantCount();
  const variants = pickDesignVariants(count, options.pickVariants);

  const results = await Promise.all(
    variants.map((variant) =>
      generateOneVariant(apiKey, productImageUrl, product, options, variant)
    )
  );

  const imageUrls = results
    .map((r) => r.imageUrl)
    .filter((url): url is string => Boolean(url));

  const variantsUsed = variants
    .filter((_, i) => results[i]?.imageUrl)
    .map((v) => v.name);

  if (imageUrls.length > 0) {
    return {
      imageUrls,
      imageUrl: imageUrls[0],
      error: null,
      variantsUsed,
    };
  }

  const firstError = results.find((r) => r.error)?.error;
  return {
    imageUrls: [],
    imageUrl: null,
    error: firstError || 'Falha ao gerar imagens com a foto do produto.',
    variantsUsed: [],
  };
}

/** Compatibilidade: gera uma única arte (primeira variante) */
export async function generatePostImageOpenAI(
  apiKey: string,
  product: ProductInfo & { id?: number },
  options: PostImagePromptOptions,
  productImageUrl: string | null | undefined
): Promise<{ imageUrl: string | null; error: string | null }> {
  const result = await generatePostImagesOpenAI(apiKey, product, options, productImageUrl);
  return { imageUrl: result.imageUrl, error: result.error };
}
