import crypto from "node:crypto";
import type { RawCompany } from "@/types";
import { ensureUrl, instagramUrl } from "@/lib/utils";
import { ProviderError, fetchWithTimeout, type DataProvider, type ProviderQuery, type ProviderResult } from "./types";

/**
 * ============================================================
 * PROVIDER CUSTOMIZADO
 * ============================================================
 * Permite plugar uma API PRÓPRIA (ou de um fornecedor com o qual
 * você tenha contrato) sem alterar o restante do sistema.
 *
 * Contrato esperado (POST JSON para CUSTOM_PROVIDER_URL):
 *
 *   Request  → { segment, city, state, country, limit }
 *   Response → { "companies": [ { ...RawCompany } ] }  ou [ ...RawCompany ]
 *
 *   RawCompany: {
 *     externalId: "id-único-na-sua-fonte",   (obrigatório)
 *     name: "Razão/Nome fantasia",            (obrigatório)
 *     category, city, state, country, address,
 *     website, instagram, phone, whatsapp, email,
 *     description, services: [],
 *     signals: { website, whatsapp, contactForm, budgetRequests, catalog, instagramActive },
 *     sourceUrl
 *   }
 *
 * Autenticação: se CUSTOM_PROVIDER_API_KEY estiver definida, ela é
 * enviada no header "X-Api-Key" (somente server-side).
 *
 * Veja também providers/custom-provider.example.ts.
 */
export class CustomProvider implements DataProvider {
  id = "custom";
  label = "Fonte personalizada";
  description = "API própria contratada/configurada por você via CUSTOM_PROVIDER_URL.";
  envVars = ["CUSTOM_PROVIDER_URL=...", "CUSTOM_PROVIDER_API_KEY=(opcional)"];

  private url: string;
  private apiKey: string;

  constructor(url: string, apiKey: string) {
    this.url = url;
    this.apiKey = apiKey;
  }

  configured(): boolean {
    return Boolean(this.url);
  }

  async search(query: ProviderQuery): Promise<ProviderResult> {
    if (!this.configured()) {
      throw new ProviderError("Provider customizado não configurado. Defina CUSTOM_PROVIDER_URL.");
    }

    let res: Response;
    try {
      res = await fetchWithTimeout(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.apiKey ? { "X-Api-Key": this.apiKey } : {}),
        },
        body: JSON.stringify({
          segment: query.segment,
          city: query.city,
          state: query.state,
          country: query.country,
          limit: query.limit,
        }),
        timeoutMs: 25000,
      });
    } catch {
      throw new ProviderError("Não foi possível acessar sua fonte personalizada (CUSTOM_PROVIDER_URL).");
    }
    if (!res.ok) {
      throw new ProviderError(`Fonte personalizada respondeu com erro HTTP ${res.status}.`, res.status);
    }

    const data = await res.json().catch(() => null);
    if (!data) throw new ProviderError("Fonte personalizada retornou JSON inválido.");

    const rawList: unknown[] = Array.isArray(data)
      ? data
      : Array.isArray(data.companies)
        ? data.companies
        : [];

    const companies: RawCompany[] = [];
    for (const item of rawList.slice(0, query.limit)) {
      if (!item || typeof item !== "object") continue;
      const r = item as Record<string, unknown>;
      const name = typeof r.name === "string" ? r.name.trim() : "";
      if (!name) continue;
      const externalId =
        typeof r.externalId === "string" && r.externalId
          ? r.externalId
          : crypto.createHash("sha1").update(`${name}|${r.city ?? ""}`).digest("hex").slice(0, 20);
      const signals = (typeof r.signals === "object" && r.signals !== null ? r.signals : {}) as RawCompany["signals"];
      const boolOrNull = (v: unknown): boolean | null =>
        typeof v === "boolean" ? v : v === "true" ? true : v === "false" ? false : null;

      companies.push({
        externalId,
        name,
        category: typeof r.category === "string" ? r.category : null,
        city: typeof r.city === "string" ? r.city : null,
        state: typeof r.state === "string" ? r.state : null,
        country: typeof r.country === "string" ? r.country : null,
        address: typeof r.address === "string" ? r.address : null,
        website: ensureUrl(typeof r.website === "string" ? r.website : null),
        instagram: instagramUrl(typeof r.instagram === "string" ? r.instagram : null),
        phone: typeof r.phone === "string" ? r.phone : null,
        whatsapp: typeof r.whatsapp === "string" ? r.whatsapp : null,
        email: typeof r.email === "string" ? r.email : null,
        description: typeof r.description === "string" ? r.description : null,
        services: Array.isArray(r.services) ? r.services.filter((s): s is string => typeof s === "string") : [],
        signals: {
          website: boolOrNull(signals?.website),
          whatsapp: boolOrNull(signals?.whatsapp),
          contactForm: boolOrNull(signals?.contactForm),
          budgetRequests: boolOrNull(signals?.budgetRequests),
          catalog: boolOrNull(signals?.catalog),
          instagramActive: boolOrNull(signals?.instagramActive),
        },
        sourceUrl: typeof r.sourceUrl === "string" ? r.sourceUrl : null,
      });
    }

    return { companies, notice: data.notice ?? undefined };
  }
}
