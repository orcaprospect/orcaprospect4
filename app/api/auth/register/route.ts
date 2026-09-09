import { NextResponse } from "next/server";
import { handleRoute, jsonError } from "@/lib/api";
import { assertSameOrigin, hashPassword, setSessionCookie } from "@/lib/auth";
import { env } from "@/lib/env";
import { getStore } from "@/lib/store";
import { supabaseAuthConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Mensagem amigável para erros do Supabase Auth. */
function supabaseAuthErrorMessage(message: string): string {
  if (/already registered|already exists/i.test(message)) {
    return "Este e-mail já tem uma conta. Faça login.";
  }
  if (/fetch failed|network|ENOTFOUND|ECONNREFUSED|failed to fetch/i.test(message)) {
    return "Não foi possível conectar ao Supabase. Verifique NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no ambiente.";
  }
  if (/rate limit|too many/i.test(message)) {
    return "Muitas tentativas. Aguarde um minuto e tente novamente.";
  }
  return `Erro ao criar conta: ${message}`;
}

export async function POST(req: Request) {
  return handleRoute(async () => {
    if (!assertSameOrigin(req)) return jsonError("Origem não permitida.", 403);
    const body = registerSchema.parse(await req.json().catch(() => ({})));

    // ---- Modo Supabase Auth (URL + Anon Key definidas) ----
    if (supabaseAuthConfigured()) {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase.auth.signUp({
        email: body.email,
        password: body.password,
        options: {
          data: { name: body.name },
          emailRedirectTo: `${env.appUrl}/login`,
        },
      });

      if (error) return jsonError(supabaseAuthErrorMessage(error.message), 400);

      const user = data.user;
      // Conta já existente com confirmação de e-mail pendente:
      if (user && (user.identities?.length ?? 1) === 0) {
        return jsonError("Este e-mail já tem uma conta. Faça login.", 409);
      }

      // Sincroniza o perfil local (mesmo id uuid usado em leads/favoritos).
      if (user) {
        await getStore()
          .upsertUser({ id: user.id, name: body.name, email: body.email })
          .catch(() => {});
      }

      // Sem sessão => o Supabase exige confirmação de e-mail.
      if (!data.session) {
        return NextResponse.json({ needsConfirmation: true });
      }

      return NextResponse.json(
        { user: { name: body.name, email: body.email } },
        { status: 201 }
      );
    }

    // ---- Modo local (conta no banco do próprio app) ----
    const store = getStore();
    const existing = await store.getUserByEmail(body.email);
    if (existing) {
      return jsonError("Este e-mail já está cadastrado. Faça login.", 409);
    }
    const user = await store.createUser({
      name: body.name,
      email: body.email,
      passwordHash: hashPassword(body.password),
    });
    await setSessionCookie(user.id);
    return NextResponse.json({ user: { name: user.name, email: user.email } }, { status: 201 });
  });
}
