import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import {
  buildPostImageFromPhotoPrompt,
  generatePostImagesOpenAI,
  resolveProductImageUrl,
} from '@/lib/openai-images';
import { getPostVariantCount, pickDesignVariants } from '@/lib/post-design-variants';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const {
      product_id,
      include_frase = true,
      include_preco = true,
      include_nome = true,
      exclude_variant_ids,
      variant_seed,
    } = body;
    if (!product_id) return NextResponse.json({ error: 'product_id obrigatório' }, { status: 400 });

    const rows = await query<{ id: number; name: string; category?: string; description?: string; price_sale?: number; image_url?: string }[]>(
      'SELECT id, name, category, description, price_sale, image_url FROM products WHERE id = ?',
      [product_id]
    );
    const product = Array.isArray(rows) ? rows[0] : rows;
    if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });

    const openaiKey = process.env.OPENAI_API_KEY?.trim();
    const useApiToken = process.env.USEAPI_TOKEN?.trim();
    const imageProvider =
      process.env.POST_IMAGE_PROVIDER?.toLowerCase() ||
      (openaiKey ? 'openai' : useApiToken ? 'dreamina' : 'none');

    let caption = '';
    let imageUrl: string | null = null;
    let imageUrls: string[] = [];
    let imageError: string | null = null;
    let jobid: string | null = null;
    let jobids: string[] = [];

    const fallbackCaption = `${product.name} - R$ ${Number(product.price_sale || 0).toFixed(2).replace('.', ',')}\n\nProduto artesanal dos produtores de Imperatriz. #InovaçãoImperatriz #ProdutoresLocais`;
    const priceStr = Number(product.price_sale || 0).toFixed(2).replace('.', ',');

    let fraseProduto = '';
    if (include_frase && openaiKey) {
      const fraseRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Você cria frases curtas e impactantes para posts de marketing. Responda APENAS com a frase, sem aspas nem explicações. Máximo 60 caracteres.',
            },
            {
              role: 'user',
              content: `Crie uma frase curta e chamativa em português para destacar este produto em um post de Instagram: ${product.name}. ${product.description || 'Produto artesanal de qualidade'}. Deve ser atrativa, com sensação de urgência ou benefício. Exemplo: "Garanta aquela bebida pro verão no conforto da sua casa!"`,
            },
          ],
          max_tokens: 80,
        }),
      });
      const fraseData = await fraseRes.json();
      fraseProduto = fraseData?.choices?.[0]?.message?.content?.trim() || '';
    }

    // Legenda com OpenAI
    if (openaiKey) {
      const captionParts: string[] = [
        `- Categoria: ${product.category || 'Produto'}`,
        `- Descrição: ${product.description || 'Produto artesanal de qualidade'}`,
      ];
      if (include_nome) captionParts.push(`- Nome: ${product.name}`);
      if (include_preco) captionParts.push(`- Preço: R$ ${priceStr}`);
      if (include_frase && fraseProduto) captionParts.push(`- Frase de destaque sugerida: ${fraseProduto}`);

      const captionPrompt = `Crie uma legenda atraente em português para um post de Instagram promovendo este produto:
${captionParts.join('\n')}

A legenda deve ser engajante, incluir hashtags relevantes (#InovaçãoImperatriz #ProdutoresLocais) e ter no máximo 200 caracteres.${!include_nome ? ' Não inclua o nome do produto na legenda.' : ''}${!include_preco ? ' Não inclua o preço na legenda.' : ''}`;

      const captionRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Você cria legendas curtas e engajantes para posts de Instagram.' },
            { role: 'user', content: captionPrompt },
          ],
          max_tokens: 150,
        }),
      });
      const captionData = await captionRes.json();
      caption = captionData?.choices?.[0]?.message?.content?.trim() || fallbackCaption;
    } else {
      caption = fallbackCaption;
    }

  // Imagem: sempre a partir da foto cadastrada do produto
    const pickVariants = {
      excludeIds: Array.isArray(exclude_variant_ids)
        ? exclude_variant_ids.filter((id: unknown) => typeof id === 'string')
        : undefined,
      seed: typeof variant_seed === 'number' ? variant_seed : undefined,
    };
    const designVariants = pickDesignVariants(getPostVariantCount(), pickVariants);
    const postImageOptions = {
      includeNome: include_nome,
      includePreco: include_preco,
      includeFrase: include_frase,
      priceStr,
      fraseProduto: fraseProduto || undefined,
      pickVariants,
    };
    const productPhotoUrl = product.image_url?.trim() || null;

    const tryOpenAI = () =>
      openaiKey &&
      productPhotoUrl &&
      (imageProvider === 'openai' || imageProvider === 'auto');
    const tryDreamina = () =>
      useApiToken &&
      productPhotoUrl &&
      imageUrls.length === 0 &&
      !jobid &&
      (imageProvider === 'dreamina' ||
        imageProvider === 'auto' ||
        (imageProvider === 'openai' && !!imageError));

    if (!productPhotoUrl) {
      imageError = 'Cadastre uma foto do produto na aba Produtos antes de gerar o post.';
    } else if (!openaiKey && !useApiToken) {
      imageError = 'Configure OPENAI_API_KEY ou USEAPI_TOKEN em .env.local';
    } else {
      if (tryOpenAI()) {
        const oaiResult = await generatePostImagesOpenAI(
          openaiKey!,
          product,
          postImageOptions,
          productPhotoUrl
        );
        if (oaiResult.imageUrls.length > 0) {
          imageUrls = oaiResult.imageUrls;
          imageUrl = oaiResult.imageUrl;
        } else if (oaiResult.error) {
          imageError = oaiResult.error;
        }
      }

      if (tryDreamina()) {
        try {
          const accountsRes = await fetch('https://api.useapi.net/v1/dreamina/accounts', {
            headers: { Authorization: `Bearer ${useApiToken}` },
          });
          const accounts = await accountsRes.json();
          const account =
            typeof accounts === 'object' && !Array.isArray(accounts) ? Object.keys(accounts)[0] : null;

          if (account) {
            const resolvedPhoto = resolveProductImageUrl(productPhotoUrl);
            const imgRes = await fetch(resolvedPhoto, { cache: 'no-store' });
            if (!imgRes.ok) throw new Error('Não foi possível carregar a foto do produto');
            const imgBuffer = await imgRes.arrayBuffer();
            const imgBytes = Buffer.from(imgBuffer);
            const contentType = imgRes.headers.get('content-type')?.includes('png')
              ? 'image/png'
              : 'image/jpeg';

            const uploadRes = await fetch(
              `https://api.useapi.net/v1/dreamina/assets/${encodeURIComponent(account)}`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${useApiToken}`,
                  'Content-Type': contentType,
                },
                body: imgBytes,
              }
            );
            const uploadData = await uploadRes.json();
            const assetRef = uploadData?.assetRef || uploadData?.imageRef;

            if (assetRef) {
              for (const variant of designVariants) {
                const prompt = buildPostImageFromPhotoPrompt(product, postImageOptions, variant);
                const genRes = await fetch('https://api.useapi.net/v1/dreamina/images', {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${useApiToken}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    prompt,
                    model: 'seedream-4.6',
                    ratio: '1:1',
                    resolution: '2k',
                    imageRef_1: assetRef,
                    imageStrength: 0.92,
                  }),
                });
                const genData = await genRes.json();
                if (genData?.jobid) {
                  jobids.push(genData.jobid);
                }
              }
              if (jobids.length > 0) {
                jobid = jobids[0];
              } else if (!imageUrl) {
                imageError = 'Dreamina não retornou jobid';
              }
            } else if (!imageUrl) {
              imageError = uploadData?.error || 'Falha ao enviar foto do produto';
            }
          } else if (!imageUrl) {
            imageError = 'Nenhuma conta Dreamina configurada. Configure em useapi.net';
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error('Dreamina error:', msg);
          if (!imageUrl) imageError = msg;
        }
      }

      if (!imageUrl && !jobid && !imageError) {
        imageError =
          'Não foi possível gerar a imagem com a foto do produto. Verifique OPENAI_API_KEY, USEAPI_TOKEN e o saldo da conta.';
      }
    }

    return NextResponse.json({
      caption,
      imageUrl,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      variantIds: designVariants.map((v) => v.id),
      variantNames: designVariants.map((v) => v.name),
      jobid: jobid ?? undefined,
      jobids: jobids.length > 0 ? jobids : undefined,
      imageError: imageError ?? undefined,
      product: { name: product.name, category: product.category, image_url: product.image_url },
    });
  } catch (err) {
    console.error('Post generate error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao gerar post' },
      { status: 500 }
    );
  }
}
