'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileEdit, Save, X } from 'lucide-react';

export type Questionnaire = {
  id: string;
  title: string;
  is_active?: number | boolean;
  created_at?: string;
  updated_at?: string;
};

type Props = {
  questionnaire: Questionnaire | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function QuestionnaireEditorModal({ questionnaire, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(questionnaire?.title ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setTitle(questionnaire?.title ?? '');
    setError('');
  }, [questionnaire]);

  const handleSave = async () => {
    if (!questionnaire?.id) return;
    const t = title.trim();
    if (!t) {
      setError('Informe o título do questionário.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/questionnaires/${questionnaire.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: t }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error ?? 'Erro ao salvar');
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <FileEdit size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Editar questionário</h3>
              <p className="text-sm text-slate-500">Altere o título e salve</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={22} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>}
          <label className="block">
            <span className="block text-sm font-bold text-slate-700 mb-2">Título do questionário</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="Ex: Diagnóstico 2025"
            />
          </label>
        </div>
        <div className="p-6 pt-0 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 disabled:opacity-70 transition-colors"
          >
            <Save size={20} />
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
