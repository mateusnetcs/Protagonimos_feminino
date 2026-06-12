'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Award, Download, Loader2, PackageOpen, Search } from 'lucide-react';

type CertificateUser = {
  id: string;
  email: string;
  name: string | null;
};

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function fileNameFromDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const match = /filename="([^"]+)"/i.exec(header);
  return match?.[1] ?? fallback;
}

export default function CertificatesView() {
  const [users, setUsers] = useState<CertificateUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/certificates', { credentials: 'include' });
      if (res.status === 403) {
        setError('Acesso restrito a administradores.');
        setUsers([]);
        return;
      }
      if (!res.ok) throw new Error('Erro ao carregar participantes');
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar participantes.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const name = (u.name ?? '').toLowerCase();
    const email = u.email.toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  const handleDownloadOne = async (user: CertificateUser) => {
    setDownloadingId(user.id);
    try {
      const res = await fetch(`/api/admin/certificates/${user.id}`, { credentials: 'include' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Erro ao gerar certificado');
      }
      const blob = await res.blob();
      const fileName = fileNameFromDisposition(
        res.headers.get('Content-Disposition'),
        `certificado-${user.id}.pdf`
      );
      triggerDownload(blob, fileName);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao baixar certificado');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadAll = async () => {
    if (users.length === 0) return;
    setDownloadingAll(true);
    try {
      const res = await fetch('/api/admin/certificates/bulk', { credentials: 'include' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Erro ao gerar pacote');
      }
      const blob = await res.blob();
      triggerDownload(blob, 'certificados-protagonismo-feminino.zip');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao baixar certificados');
    } finally {
      setDownloadingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Award className="text-primary" size={28} />
            Certificados
          </h2>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            Gere certificados de participação nas capacitações do Protagonismo Feminino para
            todos os usuários de nível geral da plataforma.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownloadAll}
          disabled={downloadingAll || loading || users.length === 0}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:opacity-95 disabled:opacity-50 transition-all shrink-0"
        >
          {downloadingAll ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <PackageOpen size={18} />
          )}
          Baixar todos (ZIP)
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou e-mail..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500 gap-2">
          <Loader2 size={22} className="animate-spin text-primary" />
          Carregando participantes...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-slate-500">
          {users.length === 0
            ? 'Nenhum usuário de nível geral cadastrado.'
            : 'Nenhum resultado para a busca.'}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-slate-500 border-b border-slate-200">
                  <th className="px-5 py-3 font-semibold">Participante</th>
                  <th className="px-5 py-3 font-semibold">E-mail</th>
                  <th className="px-5 py-3 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const displayName = user.name?.trim() || user.email.split('@')[0];
                  const busy = downloadingId === user.id;
                  return (
                    <tr key={user.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-5 py-3.5 font-medium text-slate-800">{displayName}</td>
                      <td className="px-5 py-3.5 text-slate-500">{user.email}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDownloadOne(user)}
                          disabled={busy || downloadingAll}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-primary font-semibold hover:bg-primary/10 disabled:opacity-50 transition-colors"
                        >
                          {busy ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Download size={16} />
                          )}
                          PDF
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-slate-50 text-xs text-slate-500 border-t border-slate-200">
            {filtered.length} de {users.length} participante(s) · Certificado em PDF (A4 paisagem)
          </div>
        </div>
      )}
    </div>
  );
}
