import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-cookie";
import { supabaseAuthConfigured } from "@/lib/supabase/config";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware-client";

/**
 * Proteção de rotas + renovação de sessão.
 *
 * - Modo Supabase Auth (NEXT_PUBLIC_SUPABASE_URL + ANON_KEY): valida a
 *   sessão via @supabase/ssr, renovando os tokens (cookies) a cada passagem.
 * - Modo local: filtra por presença do cookie próprio (a validação
 *   criptográfica acontece no servidor, em lib/auth.ts).
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
    const { data } = await supabase.auth.getUser(); // valida + renova tokens
    const user = data.user ?? null;

    if (isApi) return response; // APIs revalidam no servidor (401 JSON)

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
  const hasSession = req.cookies.has(SESSION_COOKIE);
  if (isApi) return NextResponse.next();

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isProtected && !hasSession) return loginRedirect(req);
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
    "/api/:path*",
  ],
};
