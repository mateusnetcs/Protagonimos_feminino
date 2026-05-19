'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, MessageCircle, Send, X } from 'lucide-react';
import type { AssistantAction, AssistantChatMessage } from '@/lib/assistant-types';

type Props = {
  isAdmin?: boolean;
  onAction: (action: AssistantAction) => void;
};

const WELCOME: AssistantChatMessage = {
  role: 'assistant',
  content:
    'Olá! Sou a assistente do **Jornada do Produtor**. Posso te ensinar a usar o painel: cadastrar produtos, PDV, catálogo, posts com IA, pedidos e relatórios.\n\nO que você quer fazer hoje?',
  actions: [
    { type: 'open_tab', tab: 'produtos', label: 'Cadastrar produto' },
    { type: 'open_tab', tab: 'post', label: 'Gerar post com IA' },
    { type: 'open_tab', tab: 'pdv', label: 'Abrir PDV' },
  ],
};

function formatMessage(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function AssistantChat({ isAdmin, onAction }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: AssistantChatMessage = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar mensagem');

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply || '',
          actions: Array.isArray(data.actions) ? data.actions : [],
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const filterActions = (actions?: AssistantAction[]) => {
    if (!actions) return [];
    if (isAdmin) return actions;
    return actions.filter(
      (a) => a.type !== 'open_tab' || (a.tab !== 'responses' && a.tab !== 'usuarios')
    );
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-full shadow-lg shadow-primary/30 hover:scale-105 transition-transform font-bold"
          aria-label="Abrir assistente"
        >
          <MessageCircle size={22} />
          <span className="hidden sm:inline">Ajuda IA</span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-[60] w-[min(100vw-2rem,400px)] h-[min(85vh,560px)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-white shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <MessageCircle size={20} className="shrink-0" />
              <div>
                <p className="font-bold text-sm leading-tight">Assistente Jornada</p>
                <p className="text-xs text-white/80 truncate">Tire dúvidas e vá direto à tela certa</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/20 shrink-0"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[92%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-br-md'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md shadow-sm'
                  }`}
                >
                  {formatMessage(msg.content)}
                  {msg.role === 'assistant' && filterActions(msg.actions).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-slate-100">
                      {filterActions(msg.actions).map((action, i) => (
                        <button
                          key={`${idx}-${i}-${action.type}`}
                          type="button"
                          onClick={() => {
                            onAction(action);
                            setOpen(false);
                          }}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-2 text-slate-500 text-sm">
                  <Loader2 size={18} className="animate-spin" />
                  Pensando...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && (
            <p className="px-4 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">{error}</p>
          )}

          <div className="p-3 border-t border-slate-200 bg-white shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ex: Como gerar post no Instagram?"
                rows={2}
                disabled={loading}
                className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={loading || !input.trim()}
                className="p-2.5 rounded-xl bg-primary text-white disabled:opacity-40 hover:bg-primary/90 shrink-0"
                aria-label="Enviar"
              >
                <Send size={20} />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 text-center">
              Enter envia · Shift+Enter quebra linha
            </p>
          </div>
        </div>
      )}
    </>
  );
}