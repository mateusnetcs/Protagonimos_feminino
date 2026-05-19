import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { buildAssistantKnowledge } from '@/lib/assistant-knowledge';
import {
  MANAGEMENT_TABS,
  type AssistantAction,
  type AssistantChatResponse,
  type ManagementTabId,
} from '@/lib/assistant-types';

function buildSystemPrompt(isAdmin: boolean): string {
  return `Você é a assistente virtual do Painel de Gestão "Jornada do Produtor". Ensina produtoras a usar o sistema.

${buildAssistantKnowledge(isAdmin)}

FORMATO DE RESPOSTA — retorne APENAS JSON válido:
{
  "reply": "texto da resposta em markdown simples (pode usar **negrito** e listas)",
  "actions": [
    { "type": "open_tab", "tab": "pdv", "label": "Ir para PDV" },
    { "type": "add_product", "label": "Cadastrar produto" },
    { "type": "import_nota", "label": "Importar nota fiscal" }
  ]
}

Regras do JSON:
- "actions" pode ser array vazio se não precisar de botão.
- "type" só pode ser: open_tab, add_product, import_nota.
- Para open_tab, "tab" deve ser um destes ids: ${MANAGEMENT_TABS.join(', ')}.
- ${isAdmin ? '' : 'Nunca use tab responses ou usuarios.'}
- Máximo 3 ações por resposta.`;
}

function sanitizeActions(raw: unknown, isAdmin: boolean): AssistantAction[] {
  if (!Array.isArray(raw)) return [];
  const out: AssistantAction[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const label = typeof o.label === 'string' ? o.label.trim().slice(0, 60) : '';
    if (!label) continue;

    if (o.type === 'open_tab' && typeof o.tab === 'string') {
      const tab = o.tab as ManagementTabId;
      if (!MANAGEMENT_TABS.includes(tab)) continue;
      if (!isAdmin && (tab === 'responses' || tab === 'usuarios')) continue;
      out.push({ type: 'open_tab', tab, label });
    } else if (o.type === 'add_product') {
      out.push({ type: 'add_product', label });
    } else if (o.type === 'import_nota') {
      out.push({ type: 'import_nota', label });
    }
    if (out.length >= 3) break;
  }
  return out;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const openaiKey = process.env.OPENAI_API_KEY?.trim();
    if (!openaiKey) {
      return NextResponse.json(
        { error: 'Assistente indisponível: OPENAI_API_KEY não configurada no servidor.' },
        { status: 503 }
      );
    }

    const isAdmin = (session.user as { role?: string }).role === 'admin';
    const body = await request.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];

    const apiMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: buildSystemPrompt(isAdmin) },
    ];

    for (const m of messages.slice(-12)) {
      if (!m || typeof m !== 'object') continue;
      const role = m.role === 'assistant' ? 'assistant' : m.role === 'user' ? 'user' : null;
      const content = typeof m.content === 'string' ? m.content.trim() : '';
      if (role && content) apiMessages.push({ role, content });
    }

    if (apiMessages.length < 2) {
      return NextResponse.json({ error: 'Envie uma mensagem' }, { status: 400 });
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: apiMessages,
        temperature: 0.4,
        max_tokens: 900,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Assistant OpenAI error:', errText);
      return NextResponse.json({ error: 'Erro ao falar com a assistente' }, { status: 500 });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json({ error: 'Resposta vazia da IA' }, { status: 500 });
    }

    let parsed: { reply?: string; actions?: unknown };
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json({
        reply: content,
        actions: [],
      } satisfies AssistantChatResponse);
    }

    const reply =
      typeof parsed.reply === 'string' && parsed.reply.trim()
        ? parsed.reply.trim()
        : 'Não consegui formular uma resposta. Tente reformular sua pergunta.';

    const actions = sanitizeActions(parsed.actions, isAdmin);

    return NextResponse.json({ reply, actions } satisfies AssistantChatResponse);
  } catch (err) {
    console.error('Assistant chat error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro no assistente' },
      { status: 500 }
    );
  }
}
