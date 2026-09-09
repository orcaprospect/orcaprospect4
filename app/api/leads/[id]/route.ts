import { NextResponse } from "next/server";
import { handleRoute, jsonError, jsonUnauthorized } from "@/lib/api";
import { assertSameOrigin, getSessionUser } from "@/lib/auth";
import { hydrateLeads } from "@/lib/lead-view";
import { getStore } from "@/lib/store";
import { leadPatchSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/leads/[id]
 * Atualiza status, favorito, tags e/ou adiciona observação.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  return handleRoute(async () => {
    if (!assertSameOrigin(req)) return jsonError("Origem não permitida.", 403);
    const user = await getSessionUser();
    if (!user) return jsonUnauthorized();

    const body = leadPatchSchema.parse(await req.json().catch(() => ({})));
    const store = getStore();

    const lead = await store.getLead(params.id, user.id);
    if (!lead) return jsonError("Lead não encontrado.", 404);

    if (body.newNote) {
      await store.addNote(user.id, lead.id, body.newNote);
    }

    const hasFieldUpdate =
      body.status !== undefined ||
      body.favorite !== undefined ||
      (body.addTags && body.addTags.length > 0) ||
      (body.removeTags && body.removeTags.length > 0);

    if (hasFieldUpdate) {
      await store.updateLead(lead.id, user.id, {
        status: body.status,
        favorite: body.favorite,
        addTags: body.addTags,
        removeTags: body.removeTags,
      });
    }

    const all = await hydrateLeads(user.id);
    const updated = all.find((l) => l.id === lead.id);
    if (!updated) return jsonError("Lead não encontrado após atualização.", 404);
    return NextResponse.json({ lead: updated });
  });
}

/** DELETE /api/leads/[id] — exclui o lead (e suas notas). */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  return handleRoute(async () => {
    if (!assertSameOrigin(req)) return jsonError("Origem não permitida.", 403);
    const user = await getSessionUser();
    if (!user) return jsonUnauthorized();

    const store = getStore();
    const ok = await store.deleteLead(params.id, user.id);
    if (!ok) return jsonError("Lead não encontrado.", 404);
    return NextResponse.json({ ok: true });
  });
}
