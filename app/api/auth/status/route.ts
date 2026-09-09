import { NextResponse } from "next/server";
import { handleRoute } from "@/lib/api";
import { env } from "@/lib/env";
import { getStore } from "@/lib/store";
import { authMode } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/status — informação pública mínima para a tela de login:
 * modo de autenticação (Supabase/local), modo demo e se já existe conta
 * criada (para abrir direto em "Criar conta" no primeiro acesso).
 */
export async function GET() {
  return handleRoute(async () => {
    const hasUsers = (await getStore().countUsers()) > 0;
    return NextResponse.json({
      hasUsers,
      demoMode: env.demoMode,
      authMode: authMode(),
    });
  });
}
