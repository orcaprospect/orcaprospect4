import { NextResponse } from "next/server";
import { handleRoute, jsonError } from "@/lib/api";
import { assertSameOrigin, setSessionCookie, verifyPassword } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { loginSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handleRoute(async () => {
    if (!assertSameOrigin(req)) return jsonError("Origem não permitida.", 403);

    const body = loginSchema.parse(await req.json().catch(() => ({})));
    const store = getStore();

    const user = await store.getUserByEmail(body.email);
    if (!user || !verifyPassword(body.password, user.passwordHash)) {
      return jsonError("E-mail ou senha incorretos.", 401);
    }

    await setSessionCookie(user.id);
    return NextResponse.json({ user: { name: user.name, email: user.email } });
  });
}
