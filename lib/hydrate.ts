import { scoreCompany } from "./score";
import type { CompanyRecord } from "./store/types";
import type { CompanyView, LeadStatus } from "@/types";

/** Converte um registro do banco para a "view" enriquecida usada na UI. */
export function toCompanyView(
  rec: CompanyRecord,
  opts: {
    isFavorite?: boolean;
    leadId?: string | null;
    leadStatus?: LeadStatus | null;
    providerLabel?: string;
  } = {}
): CompanyView {
  const { score, tier, breakdown, unverified } = scoreCompany({
    signals: rec.signals ?? {},
    category: rec.category ?? null,
    name: rec.name,
  });
  return {
    id: rec.id,
    name: rec.name,
    category: rec.category ?? null,
    city: rec.city ?? null,
    state: rec.state ?? null,
    country: rec.country ?? null,
    address: rec.address ?? null,
    website: rec.website ?? null,
    instagram: rec.instagram ?? null,
    phone: rec.phone ?? null,
    whatsapp: rec.whatsapp ?? null,
    email: rec.email ?? null,
    description: rec.description ?? null,
    services: rec.services ?? [],
    signals: rec.signals ?? {},
    sourceUrl: rec.sourceUrl ?? null,
    provider: rec.provider,
    providerLabel: opts.providerLabel,
    lastUpdatedAt: rec.updatedAt,
    score,
    tier,
    breakdown,
    unverified,
    isFavorite: opts.isFavorite ?? false,
    leadId: opts.leadId ?? null,
    leadStatus: opts.leadStatus ?? null,
    isDemo: rec.provider === "demo",
  };
}
