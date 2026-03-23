import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdminSession } from '@/lib/auth';
import { canAdminAccessUser } from '@/lib/restricted-access';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (!isAdminSession(session)) return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 });

    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    if (!canAdminAccessUser((session.user as { id?: string })?.id, userId)) {
      return NextResponse.json({ error: 'Acesso negado a este usuário.' }, { status: 403 });
    }

    const body = await _request.json();
    const email = body.email != null ? String(body.email).trim().toLowerCase() : undefined;
    const name = body.name != null ? String(body.name).trim() : undefined;
    const password = body.password != null ? String(body.password) : undefined;
    const role = body.role === 'admin' ? 'admin' : body.role === 'geral' ? 'geral' : undefined;

    if (!email && name === undefined && !password && !role) {
      return NextResponse.json({ error: 'Envie ao menos um campo para atualizar' }, { status: 400 });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 });
    }
    if (password !== undefined && password.length > 0 && password.length < 6) {
      return NextResponse.json({ error: 'Senha deve ter no mínimo 6 caracteres' }, { status: 400 });
    }

    if (email) {
      const existing = await query<{ id: number }[]>(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );
      if (Array.isArray(existing) && existing.length > 0) {
        return NextResponse.json({ error: 'Este e-mail já está cadastrado' }, { status: 400 });
      }
    }

    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (email) {
      updates.push('email = ?');
      values.push(email);
    }
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name || '');
    }
    if (role !== undefined) {
      updates.push('role = ?');
      values.push(role);
    }
    if (password && password.length >= 6) {
      const passwordHash = await bcrypt.hash(password, 10);
      updates.push('password_hash = ?');
      values.push(passwordHash);
    }

    if (updates.length === 0) return NextResponse.json({ ok: true });

    values.push(userId);
    await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('User update error:', err);
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (!isAdminSession(session)) return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 });

    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    if (!canAdminAccessUser((session.user as { id?: string })?.id, userId)) {
      return NextResponse.json({ error: 'Acesso negado a este usuário.' }, { status: 403 });
    }

    const currentUserId = (session.user as { id?: string }).id;
    if (currentUserId && String(userId) === String(currentUserId)) {
      return NextResponse.json({ error: 'Você não pode excluir seu próprio usuário' }, { status: 400 });
    }

    const result = await query<{ affectedRows?: number }>('DELETE FROM users WHERE id = ?', [userId]);
    const affected = result && typeof result === 'object' && 'affectedRows' in result ? (result.affectedRows ?? 0) : 0;
    if (affected === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('User delete error:', err);
    return NextResponse.json({ error: 'Erro ao excluir usuário' }, { status: 500 });
  }
}
