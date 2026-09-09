import { NextResponse } from "next/server";
import { handleRoute, jsonError, jsonUnauthorized } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { buildLeadsCsv } from "@/lib/csv";
import { hydrateLeads } from "@/lib/lead-view";

export const dynamic = "force-dynamic";

/**
 * GET /api/export?ids=a,b,c
 * Exporta os leads indicados em CSV (colunas comerciais — LGPD:
 * minimização de dados). Sem `ids`, exporta todos os leads do usuário.
 */
export async function GET(req: Request) {
  return handleRoute(async () => {
    const user = await getSessionUser();
    if (!user) return jsonUnauthorized();

    const url = new URL(req.url);
    const idsParam = url.searchParams.get("ids");
    const ids = new Set(
      (idsParam ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    );

    const all = await hydrateLeads(user.id);
    const leads = ids.size ? all.filter((l) => ids.has(l.id)) : all;

    if (leads.length === 0) {
      return jsonError("Nenhum lead para exportar.", 404);
    }

    const csv = buildLeadsCsv(leads);
    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="orca-prospect-leads-${date}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  });
}
