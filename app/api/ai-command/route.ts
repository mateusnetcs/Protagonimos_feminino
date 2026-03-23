import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const SYSTEM_PROMPT = `Você é um assistente que interpreta comandos em português e retorna ações para um ERP de gestão.

Ações disponíveis (retorne JSON com "action" e "params"):
- open_tab: Abrir aba do painel. tabs: "responses" (respostas/questionários), "catalogo" (catálogo), "pdv" (ponto de venda), "produtos", "post" (gerador de posts), "galeria", "relatorios" (vendas/gráficos), "usuarios", "configuracao"
- add_product: Cadastrar novo produto (abre formulário)
- open_responses: Ver respostas de questionários
- open_relatorios: Ver relatórios e vendas
- logout: Sair do sistema

Exemplos:
- "cadastrar produto" ou "novo produto" -> add_product
- "quanto vendi ontem?" ou "ver vendas" ou "relatório" -> open_relatorios
- "ir para pdv" ou "abrir caixa" -> open_tab com tab: "pdv"
- "ver questionários" ou "respostas" -> open_responses
- "cadastrar cliente" -> add_product (neste sistema cliente é tratado como produto/catálogo)
- "sair" ou "logout" -> logout

Responda APENAS com JSON válido: {"action":"nome_da_acao","params":{}}`;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY não configurada' }, { status: 500 });
    }

    const { query } = await request.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query obrigatória' }, { status: 400 });
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: query.trim() },
        ],
        temperature: 0.2,
        max_tokens: 150,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('OpenAI error:', err);
      return NextResponse.json({ error: 'Erro ao processar comando' }, { status: 500 });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json({ error: 'Resposta inválida' }, { status: 500 });
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    if (!parsed?.action) {
      return NextResponse.json({ error: 'Não foi possível entender o comando' }, { status: 400 });
    }

    return NextResponse.json({
      action: parsed.action,
      params: parsed.params || {},
    });
  } catch (err) {
    console.error('AI command error:', err);
    return NextResponse.json({ error: 'Erro ao processar comando' }, { status: 500 });
  }
}
