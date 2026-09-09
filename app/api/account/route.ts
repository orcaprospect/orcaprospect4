import { NextResponse } from "next/server";
import { handleRoute, jsonError, jsonUnauthorized } from "@/lib/api";
import { assertSameOrigin, getSessionUser, hashPassword, verifyPassword } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { accountPatchSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** PATCH /api/account — atualiza nome e/ou senha do usuário autenticado. */
export async function PATCH(req: Request) {
  return handleRoute(async () => {
    if (!assertSameOrigin(req)) return jsonError("Origem não permitida.", 403);
    const user = await getSessionUser();
    if (!user) return jsonUnauthorized();

    const body = accountPatchSchema.parse(await req.json().catch(() => ({})));
    const store = getStore();
    const record = await store.getUserById(user.id);
    if (!record) return jsonUnauthorized();

    const patch: { name?: string; passwordHash?: string } = {};
    if (body.name && body.name !== record.name) patch.name = body.name;
    if (body.newPassword) {
      if (!verifyPassword(body.currentPassword, record.passwordHash)) {
        return jsonError("Senha atual incorreta.", 400);
      }
      patch.passwordHash = hashPassword(body.newPassword);
    }

    if (Object.keys(patch).length === 0) {
      return jsonError("Nada para atualizar.", 400);
    }

    await store.updateUser(user.id, patch);
    return NextResponse.json({ ok: true });
  });
}
