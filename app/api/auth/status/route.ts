import { NextResponse } from "next/server";
import { handleRoute } from "@/lib/api";
import { env } from "@/lib/env";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/status — informação pública mínima para a tela de login:
 * se ainda não existe nenhum usuário, a tela abre direto em "Criar conta".
 */
export async function GET() {
  return handleRoute(async () => {
    const hasUsers = (await getStore().countUsers()) > 0;
    return NextResponse.json({ hasUsers, demoMode: env.demoMode });
  });
}
