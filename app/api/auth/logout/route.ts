import { NextResponse } from "next/server";
import { handleRoute, jsonError } from "@/lib/api";
import { assertSameOrigin, clearSessionCookie } from "@/lib/auth";
import { supabaseAuthConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handleRoute(async () => {
    if (!assertSameOrigin(req)) return jsonError("Origem não permitida.", 403);

    // ---- Modo Supabase Auth ----
    if (supabaseAuthConfigured()) {
      const supabase = createSupabaseServerClient();
      await supabase.auth.signOut();
      await clearSessionCookie(); // limpa também cookie do modo local, se existir
      return NextResponse.json({ ok: true });
    }

    // ---- Modo local ----
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  });
}
