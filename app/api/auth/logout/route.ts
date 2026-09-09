import { NextResponse } from "next/server";
import { handleRoute, jsonError } from "@/lib/api";
import { assertSameOrigin, clearSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handleRoute(async () => {
    if (!assertSameOrigin(req)) return jsonError("Origem não permitida.", 403);
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  });
}
