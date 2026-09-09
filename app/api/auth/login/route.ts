import { NextResponse } from "next/server";
import { handleRoute, jsonError } from "@/lib/api";
import { assertSameOrigin, setSessionCookie, verifyPassword } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { supabaseAuthConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

function supabaseAuthErrorMessage(message: string): string {
  if (/invalid login credentials/i.test(message)) {
    return "E-mail ou senha incorretos.";
  }
  if (/email not confirmed/i.test(message)) {
    return "Confirme seu e-mail antes de entrar (verifique a caixa de entrada e o spam).";
  }
  if (/fetch failed|network|ENOTFOUND|ECONNREFUSED|failed to fetch/i.test(message)) {
    return "Não foi possível conectar ao Supabase. Verifique NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no ambiente.";
  }
  if (/rate limit|too many/i.test(message)) {
    return "Muitas tentativas. Aguarde um minuto e tente novamente.";
  }
  return `Erro de autenticação: ${message}`;
}

export async function POST(req: Request) {
  return handleRoute(async () => {
    if (!assertSameOrigin(req)) return jsonError("Origem não permitida.", 403);
    const body = loginSchema.parse(await req.json().catch(() => ({})));

    // ---- Modo Supabase Auth ----
    if (supabaseAuthConfigured()) {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: body.email,
        password: body.password,
      });
      if (error) return jsonError(supabaseAuthErrorMessage(error.message), 401);

      const u = data.user;
      if (!u?.email) return jsonError("Não foi possível entrar. Tente novamente.", 401);

      const name =
        typeof u.user_metadata?.name === "string" && u.user_metadata.name
          ? (u.user_metadata.name as string)
          : u.email!.split("@")[0];
      await getStore()
        .upsertUser({ id: u.id, name, email: u.email! })
        .catch(() => {});

      return NextResponse.json({ user: { name, email: u.email } });
    }

    // ---- Modo local ----
    const store = getStore();
    const user = await store.getUserByEmail(body.email);
    if (!user || !verifyPassword(body.password, user.passwordHash)) {
      return jsonError("E-mail ou senha incorretos.", 401);
    }
    await setSessionCookie(user.id);
    return NextResponse.json({ user: { name: user.name, email: user.email } });
  });
}
