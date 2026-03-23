/**
 * Regra de acesso: usuário ID 13 só é visível para o administrador ID 1.
 * Outros admins não podem ver produtos, relatórios, catálogo etc. do usuário 13.
 */
export const RESTRICTED_USER_ID = 13;
export const SUPER_ADMIN_ID = 1;

/**
 * Verifica se o administrador logado pode acessar os dados do usuário alvo.
 * - Usuário 13: apenas admin ID 1 pode acessar
 * - Demais usuários: qualquer admin pode acessar
 */
export function canAdminAccessUser(
  sessionUserId: string | number | null | undefined,
  targetUserId: number | string | null | undefined
): boolean {
  if (targetUserId == null || targetUserId === '') return true;
  const target = Number(targetUserId);
  if (!Number.isFinite(target)) return true;
  if (target !== RESTRICTED_USER_ID) return true;

  const session = sessionUserId != null && sessionUserId !== '' ? Number(sessionUserId) : NaN;
  return Number.isFinite(session) && session === SUPER_ADMIN_ID;
}
