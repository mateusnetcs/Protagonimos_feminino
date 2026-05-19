/** Extrai todas as URLs de imagem de um registro da galeria (compatível com registros antigos). */
export function parseGalleryImageUrls(item: {
  image_url: string | null;
  image_urls?: string | string[] | null;
}): string[] {
  const fromJson: string[] = [];
  const raw = item.image_urls;
  if (raw) {
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed)) {
        for (const u of parsed) {
          if (typeof u === 'string' && u.trim()) fromJson.push(u.trim());
        }
      }
    } catch {
      /* ignore JSON inválido */
    }
  }

  if (fromJson.length > 0) return fromJson;

  const single = item.image_url?.trim();
  if (single && isDisplayableImageUrl(single)) return [single];
  return [];
}

export function isDisplayableImageUrl(url: string): boolean {
  const t = url.trim();
  if (!t) return false;
  if (t.startsWith('data:image/') && t.length > 500_000) return false;
  if (t === 'null' || t === 'undefined') return false;
  return (
    t.startsWith('/uploads/') ||
    t.startsWith('http://') ||
    t.startsWith('https://') ||
    t.startsWith('data:image/')
  );
}

export type GalleryDisplayCard = {
  key: string;
  galleryId: number;
  imageIndex: number;
  image_url: string;
  product_name: string | null;
  caption: string | null;
  created_at: string;
};

export function expandGalleryItems(
  items: {
    id: number;
    product_name: string | null;
    caption: string | null;
    image_url: string;
    image_urls: string | null;
    created_at: string;
  }[]
): GalleryDisplayCard[] {
  const cards: GalleryDisplayCard[] = [];
  for (const item of items) {
    const urls = parseGalleryImageUrls(item).filter(isDisplayableImageUrl);
    if (urls.length === 0) continue;
    urls.forEach((image_url, imageIndex) => {
      cards.push({
        key: `${item.id}-${imageIndex}`,
        galleryId: item.id,
        imageIndex,
        image_url,
        product_name: item.product_name,
        caption: item.caption,
        created_at: item.created_at,
      });
    });
  }
  return cards;
}
