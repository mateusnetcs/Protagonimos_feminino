import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { product_id, include_frase = true, include_preco = true, include_nome = true } = body;
    if (!product_id) return NextResponse.json({ error: 'product_id obrigatório' }, { status: 400 });

    const rows = await query<{ id: number; name: string; category?: string; description?: string; price_sale?: number; image_url?: string }[]>(
      'SELECT id, name, category, description, price_sale, image_url FROM products WHERE id = ?',
      [product_id]
    );
    const product = Array.isArray(rows) ? rows[0] : rows;
    if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });

    const openaiKey = process.env.OPENAI_API_KEY;
    const useApiToken = process.env.USEAPI_TOKEN;

    let caption = '';
    let imageUrl: string | null = null;
    let imageError: string | null = null;
    let jobid: string | null = null;

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

    // Imagem: Dreamina com foto do produto — prompt criativo e detalhado
    const elementsToInclude: string[] = [];
    if (include_nome) elementsToInclude.push(`"${product.name}"`);
    if (include_preco) elementsToInclude.push(`"R$ ${priceStr}"`);
    if (include_frase && fraseProduto) elementsToInclude.push(`"${fraseProduto}"`);
    const includeText = elementsToInclude.length > 0
      ? `Include these elements as highlighted text in the image with elegant, bold typography: ${elementsToInclude.join(' and ')}. `
      : 'Do not add any text overlay on the image. ';

    const imagePrompt = `Create multiple creative Instagram post designs for this product. Professional, high-end marketing style with varied concepts:
Lifestyle shots with fresh ingredients and natural lighting, minimalist studio with bold typography, vibrant colorful compositions with decorative props, organic flat lays with natural materials.
${includeText}Each design: creative composition, appetizing, eye-catching, shareable, professional photographer quality. Diverse styles: premium, artisanal, energetic, cozy.`;

    if (useApiToken && product.image_url) {
      try {
        const accountsRes = await fetch('https://api.useapi.net/v1/dreamina/accounts', {
          headers: { Authorization: `Bearer ${useApiToken}` },
        });
        const accounts = await accountsRes.json();
        const account = typeof accounts === 'object' && !Array.isArray(accounts)
          ? Object.keys(accounts)[0]
          : null;

        if (account) {
          const imgRes = await fetch(product.image_url);
          if (!imgRes.ok) throw new Error('Não foi possível carregar a foto do produto');
          const imgBuffer = await imgRes.arrayBuffer();
          const imgBytes = Buffer.from(imgBuffer);
          const contentType = imgRes.headers.get('content-type')?.includes('png') ? 'image/png' : 'image/jpeg';

          const uploadRes = await fetch(`https://api.useapi.net/v1/dreamina/assets/${encodeURIComponent(account)}`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${useApiToken}`,
              'Content-Type': contentType,
            },
            body: imgBytes,
          });
          const uploadData = await uploadRes.json();
          const assetRef = uploadData?.assetRef || uploadData?.imageRef;

          if (assetRef) {
            const genRes = await fetch('https://api.useapi.net/v1/dreamina/images', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${useApiToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                prompt: imagePrompt,
                model: 'seedream-4.6',
                ratio: '1:1',
                resolution: '2k',
                imageRef_1: assetRef,
                imageStrength: 0.75,
              }),
            });
            const genData = await genRes.json();
            if (genData?.jobid) {
              jobid = genData.jobid;
            } else {
              imageError = genData?.error || 'Dreamina não retornou jobid';
            }
          } else {
            imageError = uploadData?.error || 'Falha ao enviar foto do produto';
          }
        } else {
          imageError = 'Nenhuma conta Dreamina configurada. Configure em useapi.net';
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('Dreamina error:', msg);
        imageError = msg;
      }
    }

    if (!jobid && !imageUrl && !imageError && openaiKey) {
      const imageRes = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: `Professional product photography${include_nome ? ` of ${product.name}` : ''}, ${product.category || 'artisanal product'}, appetizing, high quality, clean white background, soft lighting, e-commerce style${elementsToInclude.length > 0 ? `. Include text overlay: ${elementsToInclude.join(', ')}` : ''}`,
          n: 1,
          size: '1024x1024',
          response_format: 'b64_json',
          quality: 'standard',
        }),
      });
      const imageData = await imageRes.json();
      if (imageData?.error) {
        imageError = imageData.error?.message || 'Erro ao gerar imagem com DALL-E.';
      } else if (imageData?.data?.[0]?.b64_json) {
        imageUrl = `data:image/png;base64,${imageData.data[0].b64_json}`;
      }
    }

    if (!useApiToken && !openaiKey) {
      imageError = 'Configure USEAPI_TOKEN (Dreamina) ou OPENAI_API_KEY em .env.local';
    } else if (!product.image_url && useApiToken) {
      imageError = 'Produto sem foto. Cadastre uma imagem para usar Dreamina.';
    }

    return NextResponse.json({
      caption,
      imageUrl,
      jobid: jobid ?? undefined,
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
