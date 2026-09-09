import { NextResponse } from "next/server";
import { handleRoute, jsonUnauthorized } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  return handleRoute(async () => {
    const user = await getSessionUser();
    if (!user) return jsonUnauthorized();
    return NextResponse.json({
      user: { name: user.name, email: user.email, createdAt: user.createdAt },
      demoMode: env.demoMode,
    });
  });
}
