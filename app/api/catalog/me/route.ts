import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customer-auth';
import { query } from '@/lib/db';

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ customer: null }, { status: 200 });
  try {
    const rows = await query<{ id: number; name: string; last_name: string; email: string; photo_url?: string | null; cidade?: string | null; bairro?: string | null; rua?: string | null; numero?: string | null; cep?: string | null; complemento?: string | null }[]>(
      'SELECT id, name, last_name, email, photo_url, cidade, bairro, rua, numero, cep, complemento FROM customers WHERE id = ?',
      [session.id]
    );
    const c = Array.isArray(rows) ? rows[0] : rows;
    if (c) {
      return NextResponse.json({
        customer: {
          id: c.id,
          name: c.name,
          last_name: c.last_name,
          email: c.email,
          photo_url: c.photo_url ?? null,
          cidade: c.cidade ?? null,
          bairro: c.bairro ?? null,
          rua: c.rua ?? null,
          numero: c.numero ?? null,
          cep: c.cep ?? null,
          complemento: c.complemento ?? null,
        },
      });
    }
  } catch {
    // Colunas podem não existir ainda; retorna dados da sessão
  }
  return NextResponse.json({ customer: session });
}
