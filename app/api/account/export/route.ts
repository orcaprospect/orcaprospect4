import { NextResponse } from "next/server";
import { handleRoute, jsonUnauthorized } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/** GET /api/account/export — portabilidade de dados (LGPD art. 18, II). */
export async function GET() {
  return handleRoute(async () => {
    const user = await getSessionUser();
    if (!user) return jsonUnauthorized();

    const store = getStore();
    const data = await store.exportUserData(user.id);
    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="orca-prospect-meus-dados-${date}.json"`,
        "Cache-Control": "no-store",
      },
    });
  });
}
