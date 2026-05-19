/**
 * Converte /uploads/... salvo no banco para rota que funciona em produção (standalone).
 */
export function resolveUploadUrl(url: string | null | undefined): string {
  if (!url?.trim()) return '';
  const t = url.trim();
  if (t.startsWith('http://') || t.startsWith('https://') || t.startsWith('data:')) {
    return t;
  }
  if (t.startsWith('/api/uploads/')) return t;
  if (t.startsWith('/uploads/')) {
    return `/api/uploads/${t.slice('/uploads/'.length)}`;
  }
  return t;
}
