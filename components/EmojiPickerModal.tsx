'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, X } from 'lucide-react';
import { EMOJI_LIST } from '@/lib/emoji-data';

type Props = {
  currentEmoji?: string;
  onSelect: (emoji: string) => void;
  onClose: () => void;
};

export default function EmojiPickerModal({ currentEmoji, onSelect, onClose }: Props) {
  const [search, setSearch] = useState('');

  const filteredEmojis = useMemo(() => {
    if (!search.trim()) return EMOJI_LIST;
    const term = search.toLowerCase().trim();
    return EMOJI_LIST.filter(
      (item) =>
        item.keywords.some((k) => k.includes(term)) ||
        item.emoji.includes(term)
    );
  }, [search]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-slate-900">Escolher emoji</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100 shrink-0">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar emoji..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-1">
            {filteredEmojis.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onSelect(item.emoji);
                  onClose();
                }}
                className={`p-2 rounded-lg text-2xl hover:bg-slate-100 transition-colors ${
                  currentEmoji === item.emoji ? 'bg-primary/20 ring-2 ring-primary/50' : ''
                }`}
                title={item.keywords.join(', ')}
              >
                {item.emoji}
              </button>
            ))}
          </div>
          {filteredEmojis.length === 0 && (
            <p className="text-center text-slate-500 py-8 text-sm">Nenhum emoji encontrado</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
