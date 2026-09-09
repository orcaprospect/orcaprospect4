import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { authMode } from "@/lib/supabase/config";
import { storeInfo } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * GET /api/health — status da aplicação (sem segredos).
 * Útil para diagnosticar rapidamente modo de banco/autenticação.
 */
export async function GET() {
  const db = storeInfo();
  return NextResponse.json({
    status: "ok",
    app: "orca-prospect",
    time: new Date().toISOString(),
    store: {
      mode: db.mode,
      usingSupabase: db.usingSupabase,
      databaseConfigured: db.databaseConfigured,
    },
    auth: { mode: authMode() },
    demoMode: env.demoMode,
  });
}
