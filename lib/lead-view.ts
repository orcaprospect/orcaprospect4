import { toCompanyView } from "./hydrate";
import { getStore } from "./store";
import type { LeadView, NoteView } from "@/types";

/** Monta a LeadView completa (lead + empresa + notas) para o usuário. */
export async function hydrateLeads(userId: string): Promise<LeadView[]> {
  const store = getStore();
  const [leads, notes] = await Promise.all([
    store.listLeads(userId),
    store.listNotes(userId),
  ]);
  if (leads.length === 0) return [];

  const companies = await store.getCompaniesByIds(leads.map((l) => l.companyId));
  const companyById = new Map(companies.map((c) => [c.id, c]));
  const favorites = await store.listFavorites(userId);
  const favSet = new Set(favorites.map((f) => f.companyId));
  const notesByLead = new Map<string, NoteView[]>();
  for (const n of notes) {
    const list = notesByLead.get(n.leadId) ?? [];
    list.push({ id: n.id, content: n.content, createdAt: n.createdAt });
    notesByLead.set(n.leadId, list);
  }

  const out: LeadView[] = [];
  for (const lead of leads) {
    const rec = companyById.get(lead.companyId);
    if (!rec) continue;
    out.push({
      id: lead.id,
      status: lead.status,
      favorite: lead.favorite,
      tags: lead.tags,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      notes: notesByLead.get(lead.id) ?? [],
      company: toCompanyView(rec, {
        isFavorite: lead.favorite || favSet.has(rec.id),
        leadId: lead.id,
        leadStatus: lead.status,
      }),
    });
  }
  return out;
}
