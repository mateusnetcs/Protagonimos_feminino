'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Loader2, Command } from 'lucide-react';

export type CommandAction =
  | { action: 'open_tab'; params: { tab: string } }
  | { action: 'add_product'; params: Record<string, unknown> }
  | { action: 'open_responses'; params: Record<string, unknown> }
  | { action: 'open_relatorios'; params: Record<string, unknown> }
  | { action: 'logout'; params: Record<string, unknown> };

type Props = {
  open: boolean;
  onClose: () => void;
  onAction: (result: CommandAction) => void;
  isAdmin?: boolean;
};

export default function CommandBar({ open, onClose, onAction, isAdmin }: Props) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeCommand = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao processar');
      }
      if (data.action) {
        onAction(data as CommandAction);
        onClose();
        setQuery('');
      } else {
        throw new Error('Comando não reconhecido');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar comando');
    } finally {
      setLoading(false);
    }
  }, [query, onAction, onClose]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && !loading) executeCommand();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, loading, executeCommand]);

  useEffect(() => {
    if (open) setQuery('');
    if (open) setError(null);
  }, [open]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[15vh] px-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
            <Search size={20} className="text-slate-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite um comando... Ex: Cadastrar produto, Ver vendas, Ir para PDV"
              className="flex-1 bg-transparent outline-none text-slate-900 placeholder:text-slate-400 font-medium"
              autoFocus
              disabled={loading}
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-500 text-xs font-mono">
              <Command size={12} />K
            </kbd>
          </div>
          {error && (
            <div className="px-4 py-2 bg-red-50 text-red-600 text-sm">{error}</div>
          )}
          {loading && (
            <div className="flex items-center gap-2 px-4 py-3 text-slate-500 text-sm">
              <Loader2 size={18} className="animate-spin" />
              Processando...
            </div>
          )}
          <div className="px-4 py-3 bg-slate-50/50 text-slate-500 text-xs">
            Exemplos: &quot;cadastrar produto&quot;, &quot;quanto vendi ontem?&quot;, &quot;ver questionários&quot;, &quot;abrir PDV&quot;
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
