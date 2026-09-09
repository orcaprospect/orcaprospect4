import { NextResponse } from "next/server";
import { handleRoute, jsonError } from "@/lib/api";
import { assertSameOrigin, hashPassword, setSessionCookie } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { registerSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handleRoute(async () => {
    if (!assertSameOrigin(req)) return jsonError("Origem não permitida.", 403);

    const body = registerSchema.parse(await req.json().catch(() => ({})));
    const store = getStore();

    const existing = await store.getUserByEmail(body.email);
    if (existing) {
      return jsonError("Este e-mail já está cadastrado. Faça login.", 409);
    }

    const user = await store.createUser({
      name: body.name,
      email: body.email,
      passwordHash: hashPassword(body.password),
    });

    await setSessionCookie(user.id);
    return NextResponse.json({ user: { name: user.name, email: user.email } }, { status: 201 });
  });
}
