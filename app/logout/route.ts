import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { supabaseAuthConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /logout — encerra a sessão (local e/ou Supabase) e volta ao login.
 * Usado para quebrar loops de cookie órfão: o layout do app redireciona
 * para cá quando a sessão existe mas o usuário não é mais válido.
 */
export async function GET(req: Request) {
  if (supabaseAuthConfigured()) {
    try {
      const supabase = createSupabaseServerClient();
      await supabase.auth.signOut();
    } catch {
      // segue — o importante é limpar o cookie local
    }
  }
  await clearSessionCookie();

  // Redirect relativo (funciona atrás de proxies/preview sem quebrar o host).
  return new NextResponse(null, {
    status: 303,
    headers: { Location: "/login", "Cache-Control": "no-store" },
  });
}
