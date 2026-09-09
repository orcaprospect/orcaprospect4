import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, SESSION_FALLBACK_SECRET } from "@/lib/auth-cookie";
import { verifySessionTokenEdge } from "@/lib/session-edge";
import { supabaseAuthConfigured } from "@/lib/supabase/config";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware-client";

/**
 * Proteção de rotas + renovação de sessão.
 *
 * - Modo Supabase Auth (NEXT_PUBLIC_SUPABASE_URL + ANON_KEY): valida a
 *   sessão via @supabase/ssr, renovando os tokens (cookies). Erros de
 *   rede NUNCA derrubam o middleware (evita "tela branca").
 * - Modo local: valida a ASSINATURA do cookie (não só a presença) para
 *   que cookies órfãos/expirados não causem loop de redirecionamento.
 */
const PROTECTED_PREFIXES = ["/dashboard", "/search", "/leads", "/favorites", "/settings"];
const AUTH_PAGES = ["/login"];

function loginRedirect(req: NextRequest): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
  return NextResponse.redirect(url);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api");

  // ---- Modo Supabase Auth ----
  if (supabaseAuthConfigured()) {
    const { supabase, response } = createSupabaseMiddlewareClient(req);
    let user = null;
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error) user = data.user ?? null;
    } catch (error) {
      // Supabase inacessível (URL errada, rede, projeto pausado): trata
      // como deslogado em vez de quebrar a requisição com erro 500.
      console.error(
        "[Orça Prospect] Falha ao validar sessão no Supabase:",
        error instanceof Error ? error.message : error
      );
    }

    if (isApi) return response;

    const isProtected = PROTECTED_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    );
    if (isProtected && !user) return loginRedirect(req);
    if (AUTH_PAGES.includes(pathname) && user) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return response;
  }

  // ---- Modo local (cookie assinado próprio) ----
  if (isApi) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const sessionUserId = await verifySessionTokenEdge(
    token,
    process.env.SESSION_SECRET || SESSION_FALLBACK_SECRET
  );

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isProtected && !sessionUserId) return loginRedirect(req);
  if (AUTH_PAGES.includes(pathname) && sessionUserId) {
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
    "/api/:path*",
  ],
};
