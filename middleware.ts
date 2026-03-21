import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Redireciona HTTP para HTTPS em produção.
 * O Coolify/Traefik passa x-forwarded-proto quando o usuário acessa via HTTPS.
 * Se acessar via HTTP, redirecionamos para HTTPS.
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || request.nextUrl.host;
  const proto = request.headers.get('x-forwarded-proto');

  // Em desenvolvimento (localhost), não redirecionar
  if (host?.includes('localhost') || host?.startsWith('127.0.0.1')) {
    return NextResponse.next();
  }

  // Se o proxy indica que a requisição original foi HTTP, redirecionar para HTTPS
  if (proto === 'http') {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
