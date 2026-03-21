'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';

type Customer = {
  id: number;
  name: string;
  last_name: string;
  email: string;
  photo_url?: string | null;
  cidade?: string | null;
  bairro?: string | null;
  rua?: string | null;
  numero?: string | null;
  cep?: string | null;
  complemento?: string | null;
};

type Props = {
  customer: Customer;
  onClose: () => void;
  onUpdated: (customer: Customer) => void;
  onLogout?: () => void;
};

export default function CustomerSettingsModal({ customer, onClose, onUpdated, onLogout }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    old_password: '',
    new_password: '',
    new_password_confirm: '',
  });

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const res = await fetch('/api/catalog/profile', {
        method: 'PATCH',
        credentials: 'include',
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar foto');
      onUpdated(data.customer);
      setSuccess('Foto atualizada!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.new_password !== form.new_password_confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    if (form.new_password.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/catalog/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          old_password: form.old_password,
          new_password: form.new_password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erro ao alterar senha');
      onUpdated(data.customer);
      setForm({ old_password: '', new_password: '', new_password_confirm: '' });
      setSuccess('Senha alterada com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Configurações</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center">
                {customer.photo_url ? (
                  <img src={customer.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-4xl text-slate-400">person</span>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={loading}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow"
              >
                <span className="material-symbols-outlined text-lg">photo_camera</span>
              </button>
            </div>
            <p className="text-sm text-slate-600">{customer.name} {customer.last_name}</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <h3 className="font-bold text-slate-900">Alterar senha</h3>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Senha atual *</span>
              <input
                type="password"
                value={form.old_password}
                onChange={(e) => setForm((f) => ({ ...f, old_password: e.target.value }))}
                className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200"
                placeholder="••••••••"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Nova senha *</span>
              <input
                type="password"
                value={form.new_password}
                onChange={(e) => setForm((f) => ({ ...f, new_password: e.target.value }))}
                className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200"
                placeholder="••••••••"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Confirmar nova senha *</span>
              <input
                type="password"
                value={form.new_password_confirm}
                onChange={(e) => setForm((f) => ({ ...f, new_password_confirm: e.target.value }))}
                className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200"
                placeholder="••••••••"
              />
            </label>
            <button
              type="submit"
              disabled={loading || !form.old_password || !form.new_password}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold disabled:opacity-70"
            >
              {loading ? 'Salvando...' : 'Alterar senha'}
            </button>
          </form>

          {onLogout && (
            <button
              type="button"
              onClick={async () => {
                await fetch('/api/catalog/logout', { method: 'POST', credentials: 'include' });
                onLogout();
                onClose();
              }}
              className="w-full py-3 rounded-xl font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50"
            >
              Sair da conta
            </button>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
        </div>
      </motion.div>
    </div>
  );
}
