'use client';

import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

type Props = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'neutral';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  loadingLabel?: string;
};

export default function ConfirmModal({
  title = 'Confirmar',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
  loading = false,
  loadingLabel = 'Processando...',
}: Props) {
  const variantStyles = {
    danger: {
      icon: 'bg-red-100 text-red-600',
      button: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: 'bg-amber-100 text-amber-600',
      button: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    neutral: {
      icon: 'bg-slate-100 text-slate-600',
      button: 'bg-slate-700 hover:bg-slate-800 text-white',
    },
  };

  const style = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 text-center">
          <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4 ${style.icon}`}>
            <AlertTriangle size={28} strokeWidth={2.5} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
          <p className="text-slate-600 leading-relaxed">{message}</p>
        </div>
        <div className="p-6 pt-0 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 ${style.button}`}
          >
            {loading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
