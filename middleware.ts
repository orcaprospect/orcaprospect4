import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-cookie";

/**
 * Proteção de rotas (borda): bloqueia páginas do app para visitantes
 * sem cookie de sessão. A validação criptográfica da sessão acontece
 * no servidor (lib/auth.ts) — aqui é apenas um filtro rápido.
 */
const PROTECTED_PREFIXES = ["/dashboard", "/search", "/leads", "/favorites", "/settings"];
const AUTH_PAGES = ["/login"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = req.cookies.has(SESSION_COOKIE);

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (isProtected && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (AUTH_PAGES.includes(pathname) && hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/search",
    "/search/:path*",
    "/leads",
    "/leads/:path*",
    "/favorites",
    "/favorites/:path*",
    "/settings",
    "/settings/:path*",
    "/login",
  ],
};
