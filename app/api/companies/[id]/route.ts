import { NextResponse } from "next/server";
import { handleRoute, jsonError, jsonUnauthorized } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { toCompanyView } from "@/lib/hydrate";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/** GET /api/companies/[id] — detalhes enriquecidos de uma empresa. */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  return handleRoute(async () => {
    const user = await getSessionUser();
    if (!user) return jsonUnauthorized();

    const store = getStore();
    const company = await store.getCompany(params.id);
    if (!company) return jsonError("Empresa não encontrada.", 404);

    const [favorite, lead] = await Promise.all([
      store.getFavorite(user.id, company.id),
      store.getLeadByUserAndCompany(user.id, company.id),
    ]);

    const view = toCompanyView(company, {
      isFavorite: Boolean(favorite),
      leadId: lead?.id ?? null,
      leadStatus: lead?.status ?? null,
    });

    return NextResponse.json({ company: view });
  });
}
