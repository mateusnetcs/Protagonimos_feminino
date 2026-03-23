import { NextResponse } from 'next/server';

/**
 * Busca URL da imagem de um produto pelo código de barras (EAN) ou pelo nome.
 * Usa Open Food Facts API (gratuita, sem chave).
 * - barcode: prioridade quando informado e válido (8+ dígitos)
 * - search: busca por nome quando não há barcode ou quando a busca por barcode falha
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get('barcode')?.replace(/\D/g, '');
    const searchTerms = searchParams.get('search')?.trim().slice(0, 100);

    // Tentativa 1: buscar por código de barras (quando válido)
    if (barcode && barcode.length >= 8) {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
        { cache: 'no-store' }
      );
      const data = await res.json().catch(() => null);
      if (data?.product) {
        const p = data.product;
        const imageUrl =
          p.image_front_url ||
          p.image_url ||
          p.image_small_url ||
          (p.selected_images?.front?.display?.pt || p.selected_images?.front?.display?.en)?.url ||
          null;
        if (imageUrl) {
          return NextResponse.json({ imageUrl });
        }
      }
    }

    // Tentativa 2: buscar por nome do produto
    if (searchTerms && searchTerms.length >= 2) {
      const query = encodeURIComponent(searchTerms);
      const res = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${query}&search_simple=1&action=process&json=1&page_size=5`,
        { cache: 'no-store' }
      );
      const data = await res.json().catch(() => null);
      const products = data?.products;
      if (Array.isArray(products) && products.length > 0) {
        for (const p of products) {
          const imageUrl =
            p.image_front_url ||
            p.image_url ||
            p.image_small_url ||
            (p.selected_images?.front?.display?.pt || p.selected_images?.front?.display?.en)?.url ||
            null;
          if (imageUrl) {
            return NextResponse.json({ imageUrl });
          }
        }
      }
    }

    return NextResponse.json({ imageUrl: null });
  } catch (err) {
    console.error('Fetch image:', err);
    return NextResponse.json({ imageUrl: null });
  }
}
