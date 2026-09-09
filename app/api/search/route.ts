import { NextResponse } from "next/server";
import { handleRoute, jsonError, jsonUnauthorized } from "@/lib/api";
import { assertSameOrigin, getSessionUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { toCompanyView } from "@/lib/hydrate";
import { getStore } from "@/lib/store";
import { searchSchema } from "@/lib/validation";
import { NOT_CONFIGURED_MESSAGE, providerStatuses, resolveProvider } from "@/providers";
import type { CompanyView } from "@/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/search
 * Busca empresas no provider ativo, calcula o score, persiste as
 * empresas (com dedupe) e devolve a lista enriquecida.
 */
export async function POST(req: Request) {
  return handleRoute(async () => {
    if (!assertSameOrigin(req)) return jsonError("Origem não permitida.", 403);
    const user = await getSessionUser();
    if (!user) return jsonUnauthorized();

    if (!checkRateLimit(`search:${user.id}`, 12, 60_000)) {
      return jsonError(
        "Muitas buscas em sequência. Aguarde alguns segundos para respeitar as APIs públicas.",
        429
      );
    }

    const q = searchSchema.parse(await req.json().catch(() => ({})));

    const provider = resolveProvider();
    if (!provider) {
      return NextResponse.json(
        {
          status: "unconfigured",
          message: NOT_CONFIGURED_MESSAGE,
          providers: providerStatuses(),
        },
        { status: 200 }
      );
    }

    const result = await provider.search({
      segment: q.segment,
      city: q.city,
      state: q.state,
      country: q.country || "Brasil",
      limit: q.limit,
    });

    // Persiste/atualiza empresas (dedupe por externalKey ou nome+local)
    const store = getStore();
    const views: CompanyView[] = [];
    for (const raw of result.companies) {
      const rec = await store.upsertCompany({ ...raw, provider: provider.id });
      views.push(toCompanyView(rec, { providerLabel: provider.label }));
    }

    // Estado de lead/favorito por usuário
    const [favorites, leads] = await Promise.all([
      store.listFavorites(user.id),
      store.listLeads(user.id),
    ]);
    const favSet = new Set(favorites.map((f) => f.companyId));
    const leadByCompany = new Map(leads.map((l) => [l.companyId, l]));
    for (const v of views) {
      v.isFavorite = favSet.has(v.id);
      const lead = leadByCompany.get(v.id);
      v.leadId = lead?.id ?? null;
      v.leadStatus = lead?.status ?? null;
    }

    await store.addSearch({
      userId: user.id,
      segment: q.segment,
      city: q.city,
      state: q.state,
      country: q.country || "Brasil",
      provider: provider.id,
      resultCount: views.length,
    });

    return NextResponse.json({
      status: "ok",
      provider: {
        id: provider.id,
        label: provider.label,
        demo: provider.id === "demo",
      },
      results: views,
      notice: result.notice ?? null,
      disclaimer:
        "Score estimado com base nos dados públicos disponíveis. Não afirma que a empresa possui ou não automação.",
    });
  });
}
