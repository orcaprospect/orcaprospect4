import { NextResponse } from "next/server";
import { handleRoute, jsonError, jsonUnauthorized } from "@/lib/api";
import { assertSameOrigin, getSessionUser } from "@/lib/auth";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/account/data
 * Apaga TODOS os dados de prospecção do usuário (leads, notas,
 * favoritos, tags e pesquisas). LGPD: direito de eliminação.
 */
export async function DELETE(req: Request) {
  return handleRoute(async () => {
    if (!assertSameOrigin(req)) return jsonError("Origem não permitida.", 403);
    const user = await getSessionUser();
    if (!user) return jsonUnauthorized();

    await getStore().deleteUserData(user.id);
    return NextResponse.json({ ok: true });
  });
}
