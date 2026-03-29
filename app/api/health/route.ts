import { NextResponse } from 'next/server';

/** Resposta leve para health check do Coolify/Traefik (sem DB). */
export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}
