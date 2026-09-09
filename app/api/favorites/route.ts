import { NextResponse } from "next/server";
import { handleRoute, jsonError, jsonUnauthorized } from "@/lib/api";
import { assertSameOrigin, getSessionUser } from "@/lib/auth";
import { toCompanyView } from "@/lib/hydrate";
import { getStore } from "@/lib/store";
import { favoriteSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** GET /api/favorites — empresas favoritadas ("Meus leads"). */
export async function GET() {
  return handleRoute(async () => {
    const user = await getSessionUser();
    if (!user) return jsonUnauthorized();

    const store = getStore();
    const favorites = await store.listFavorites(user.id);
    const companies = await store.getCompaniesByIds(favorites.map((f) => f.companyId));
    const companyById = new Map(companies.map((c) => [c.id, c]));
    const leads = await store.listLeads(user.id);
    const leadByCompany = new Map(leads.map((l) => [l.companyId, l]));

    const items = favorites
      .map((f) => {
        const rec = companyById.get(f.companyId);
        if (!rec) return null;
        const lead = leadByCompany.get(f.companyId);
        return {
          favoriteId: f.id,
          createdAt: f.createdAt,
          company: toCompanyView(rec, {
            isFavorite: true,
            leadId: lead?.id ?? null,
            leadStatus: lead?.status ?? null,
          }),
        };
      })
      .filter(Boolean);

    return NextResponse.json({ favorites: items });
  });
}

/**
 * POST /api/favorites — favorita/desfavorita uma empresa.
 * Body: { companyId, favorite? } — sem `favorite`, alterna (toggle).
 */
export async function POST(req: Request) {
  return handleRoute(async () => {
    if (!assertSameOrigin(req)) return jsonError("Origem não permitida.", 403);
    const user = await getSessionUser();
    if (!user) return jsonUnauthorized();

    const body = favoriteSchema.parse(await req.json().catch(() => ({})));
    const store = getStore();

    const company = await store.getCompany(body.companyId);
    if (!company) return jsonError("Empresa não encontrada. Faça a busca novamente.", 404);

    const current = await store.getFavorite(user.id, company.id);
    const next = body.favorite !== undefined ? body.favorite : !current;
    await store.setFavorite(user.id, company.id, next);

    return NextResponse.json({ favorite: next });
  });
}
