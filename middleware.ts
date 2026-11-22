import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isLoopbackHost(host: string) {
  return (
    host.includes('localhost') ||
    host.startsWith('127.0.0.1') ||
    host.startsWith('[::1]') ||
    // Requisições internas do servidor standalone (ex.: otimizador de imagens /_next/image)
    host.startsWith('0.0.0.0')
  );
}

/**
 * Redireciona HTTP para HTTPS em produção.
 * O Coolify/Traefik passa x-forwarded-proto quando o usuário acessa via HTTPS.
 *
 * Health checks internos costumam ser HTTP sem X-Forwarded-For; redirecionar
 * nesses casos quebra o probe e pode levar a 502/504 no gateway.
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || request.nextUrl.host;
  const protoHeader = request.headers.get('x-forwarded-proto');
  const proto = protoHeader?.split(',')[0]?.trim();

  if (isLoopbackHost(host)) {
    return NextResponse.next();
  }

  const hasEdgeClientHint =
    Boolean(request.headers.get('x-forwarded-for')) ||
    Boolean(request.headers.get('x-real-ip'));

  if (proto === 'http' && hasEdgeClientHint) {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Exclui API (NextAuth, health), assets, favicon e QUALQUER arquivo estático
     * (caminho com extensão: .jpg, .png, .pptx, .ttf...) — menos risco de redirect
     * indevido em chamadas internas e probes. Sem isso, o otimizador de imagens
     * recebia um 301 ao buscar /public e as fotos apareciam quebradas.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|uploads|.*\\.[a-zA-Z0-9]+$).*)',
  ],
};
