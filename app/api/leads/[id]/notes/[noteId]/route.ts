import { NextResponse } from "next/server";
import { handleRoute, jsonError, jsonUnauthorized } from "@/lib/api";
import { assertSameOrigin, getSessionUser } from "@/lib/auth";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/** DELETE /api/leads/[id]/notes/[noteId] — exclui uma observação. */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; noteId: string } }
) {
  return handleRoute(async () => {
    if (!assertSameOrigin(req)) return jsonError("Origem não permitida.", 403);
    const user = await getSessionUser();
    if (!user) return jsonUnauthorized();

    const store = getStore();
    const ok = await store.deleteNote(user.id, params.id, params.noteId);
    if (!ok) return jsonError("Observação não encontrada.", 404);
    return NextResponse.json({ ok: true });
  });
}
