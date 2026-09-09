import { NextResponse } from "next/server";
import { handleRoute, jsonError, jsonUnauthorized } from "@/lib/api";
import { assertSameOrigin, getSessionUser } from "@/lib/auth";
import { hydrateLeads } from "@/lib/lead-view";
import { getStore } from "@/lib/store";
import { createLeadSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** GET /api/leads — lista completa de leads do usuário (com empresa e notas). */
export async function GET() {
  return handleRoute(async () => {
    const user = await getSessionUser();
    if (!user) return jsonUnauthorized();
    const leads = await hydrateLeads(user.id);
    return NextResponse.json({ leads });
  });
}

/** POST /api/leads — salva uma empresa como lead (status "novo"). */
export async function POST(req: Request) {
  return handleRoute(async () => {
    if (!assertSameOrigin(req)) return jsonError("Origem não permitida.", 403);
    const user = await getSessionUser();
    if (!user) return jsonUnauthorized();

    const body = createLeadSchema.parse(await req.json().catch(() => ({})));
    const store = getStore();

    const company = await store.getCompany(body.companyId);
    if (!company) return jsonError("Empresa não encontrada. Faça a busca novamente.", 404);

    const existing = await store.getLeadByUserAndCompany(user.id, company.id);
    if (existing) {
      const notes = await store.listNotes(user.id, existing.id);
      return NextResponse.json({ already: true, leadId: existing.id, status: existing.status, notes });
    }

    const lead = await store.createLead(user.id, company.id);
    const notes = await store.listNotes(user.id, lead.id);
    return NextResponse.json({ already: false, leadId: lead.id, status: lead.status, notes }, { status: 201 });
  });
}
