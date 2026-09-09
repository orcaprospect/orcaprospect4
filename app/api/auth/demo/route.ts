import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { handleRoute, jsonError } from "@/lib/api";
import { assertSameOrigin, hashPassword, setSessionCookie } from "@/lib/auth";
import { env } from "@/lib/env";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * Conta de demonstração: cria/entra com um usuário local de teste.
 * Disponível apenas quando DEMO_MODE=true — evita contas de teste
 * em produção.
 */
export async function POST(req: Request) {
  return handleRoute(async () => {
    if (!assertSameOrigin(req)) return jsonError("Origem não permitida.", 403);
    if (!env.demoMode) {
      return jsonError(
        "A conta de demonstração está disponível apenas com DEMO_MODE=true.",
        403
      );
    }

    const store = getStore();
    const email = "demo@orcaprospect.local";
    let user = await store.getUserByEmail(email);
    if (!user) {
      user = await store.createUser({
        name: "Conta Demonstração",
        email,
        passwordHash: hashPassword(crypto.randomBytes(24).toString("hex")),
      });
    }

    await setSessionCookie(user.id);
    return NextResponse.json({ user: { name: user.name, email: user.email } });
  });
}
