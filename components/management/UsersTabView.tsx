'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Loader2, Plus, Shield, User, Users, Pencil, Trash2 } from 'lucide-react';

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

export default function UsersTabView() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formEmail, setFormEmail] = useState('');
  const [formName, setFormName] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'geral'>('geral');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'geral'>('geral');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/users', { credentials: 'include' });
      if (res.status === 403) {
        setError('Acesso restrito a administradores.');
        setUsers([]);
        return;
      }
      if (!res.ok) throw new Error('Erro ao carregar');
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar usuários.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: formEmail.trim(),
          name: formName.trim(),
          password: formPassword,
          role: formRole,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(data.error ?? 'Erro ao criar usuário');
        return;
      }
      setFormEmail('');
      setFormName('');
      setFormPassword('');
      setFormRole('geral');
      setShowForm(false);
      fetchUsers();
    } catch {
      setFormError('Erro ao criar usuário');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (u: UserRow) => {
    setEditingUser(u);
    setEditEmail(u.email);
    setEditName(u.name || '');
    setEditPassword('');
    setEditRole((u.role === 'admin' ? 'admin' : 'geral') as 'admin' | 'geral');
    setFormError('');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setFormError('');
    setSaving(true);
    try {
      const body: { email?: string; name?: string; password?: string; role?: string } = {
        email: editEmail.trim(),
        name: editName.trim(),
        role: editRole,
      };
      if (editPassword.length >= 6) body.password = editPassword;
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(data.error ?? 'Erro ao atualizar usuário');
        return;
      }
      setEditingUser(null);
      fetchUsers();
    } catch {
      setFormError('Erro ao atualizar usuário');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: UserRow) => {
    if (!confirm(`Excluir o usuário "${u.name || u.email}"? Esta ação não pode ser desfeita.`)) return;
    setDeletingId(u.id);
    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? 'Erro ao excluir usuário');
        return;
      }
      fetchUsers();
    } catch {
      alert('Erro ao excluir usuário');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
    >
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users size={20} className="text-primary" />
            Usuários
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Gerencie usuários administradores e gerais do sistema.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 shrink-0"
        >
          <Plus size={20} />
          Novo usuário
        </button>
      </div>

      {showForm && (
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 mb-4">Criar novo usuário</h3>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">E-mail</label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="usuario@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">Nome</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Nome do usuário"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">Senha (mín. 6 caracteres)</label>
              <input
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Nível de acesso</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    checked={formRole === 'geral'}
                    onChange={() => setFormRole('geral')}
                    className="text-primary"
                  />
                  <User size={18} className="text-slate-500" />
                  <span>Geral</span>
                  <span className="text-slate-400 text-xs">(vê apenas seus dados)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    checked={formRole === 'admin'}
                    onChange={() => setFormRole('admin')}
                    className="text-primary"
                  />
                  <Shield size={18} className="text-amber-600" />
                  <span>Administrador</span>
                  <span className="text-slate-400 text-xs">(vê tudo)</span>
                </label>
              </div>
            </div>
            {formError && <p className="text-red-600 text-sm">{formError}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50"
              >
                {saving && <Loader2 size={18} className="animate-spin" />}
                Criar usuário
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 rounded-xl font-bold border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {editingUser && (
        <div className="p-6 border-b border-slate-100 bg-amber-50/50">
          <h3 className="font-bold text-slate-800 mb-4">Editar usuário</h3>
          <form onSubmit={handleEditSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">E-mail</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="usuario@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">Nome</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Nome do usuário"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">Nova senha (deixe em branco para manter)</label>
              <input
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                minLength={6}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Nível de acesso</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="editRole"
                    checked={editRole === 'geral'}
                    onChange={() => setEditRole('geral')}
                    className="text-primary"
                  />
                  <User size={18} className="text-slate-500" />
                  <span>Geral</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="editRole"
                    checked={editRole === 'admin'}
                    onChange={() => setEditRole('admin')}
                    className="text-primary"
                  />
                  <Shield size={18} className="text-amber-600" />
                  <span>Administrador</span>
                </label>
              </div>
            </div>
            {formError && <p className="text-red-600 text-sm">{formError}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50"
              >
                {saving && <Loader2 size={18} className="animate-spin" />}
                Salvar
              </button>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-6 py-2.5 rounded-xl font-bold border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 flex items-center justify-center gap-2 text-slate-500">
            <Loader2 size={24} className="animate-spin" />
            Carregando...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="font-medium">Nenhum usuário cadastrado.</p>
          </div>
        ) : (
          <table className="w-full text-left min-w-[500px]">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-sm uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">E-mail</th>
                <th className="px-6 py-4">Nível</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium text-slate-800">{u.name || '—'}</td>
                  <td className="px-6 py-4 text-slate-600">{u.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        u.role === 'admin'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {u.role === 'admin' ? <Shield size={14} /> : <User size={14} />}
                      {u.role === 'admin' ? 'Administrador' : 'Geral'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-primary transition-colors"
                        title="Editar"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(u)}
                        disabled={deletingId === u.id}
                        className="p-2 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Excluir"
                      >
                        {deletingId === u.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}
