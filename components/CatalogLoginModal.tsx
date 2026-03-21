'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

export default function CatalogLoginModal({ onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    last_name: '',
    email: '',
    password: '',
    birth_date: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/catalog/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erro ao entrar');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.last_name || !form.email || !form.password) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/catalog/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          last_name: form.last_name,
          email: form.email,
          password: form.password,
          birth_date: form.birth_date || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar');
      const loginRes = await fetch('/api/catalog/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      if (!loginRes.ok) throw new Error('Cadastro ok, mas erro ao entrar.');
      onSuccess();
      onClose();
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
          <h2 className="text-xl font-bold text-slate-900">{mode === 'login' ? 'Entrar' : 'Criar conta'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6">
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 rounded-xl font-semibold ${mode === 'login' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2 rounded-xl font-semibold ${mode === 'register' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              Cadastrar
            </button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Email *</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200"
                  placeholder="seu@email.com"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Senha *</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200"
                  placeholder="••••••••"
                  required
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold disabled:opacity-70"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Nome *</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200"
                  placeholder="Seu nome"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Sobrenome *</span>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                  className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200"
                  placeholder="Seu sobrenome"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Email *</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200"
                  placeholder="seu@email.com"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Senha *</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200"
                  placeholder="Mínimo 6 caracteres"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Data de nascimento</span>
                <input
                  type="date"
                  value={form.birth_date}
                  onChange={(e) => setForm((f) => ({ ...f, birth_date: e.target.value }))}
                  className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200"
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold disabled:opacity-70"
              >
                {loading ? 'Cadastrando...' : 'Criar conta'}
              </button>
            </form>
          )}

          {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
        </div>
      </motion.div>
    </div>
  );
}
