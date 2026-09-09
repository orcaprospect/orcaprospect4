import type { RawCompany } from "@/types";
import { ensureUrl } from "@/lib/utils";
import { ProviderError, fetchWithTimeout, type DataProvider, type ProviderQuery, type ProviderResult } from "./types";

/**
 * ============================================================
 * PROVIDER GOOGLE PLACES API (New)
 * ============================================================
 * Requer GOOGLE_MAPS_API_KEY com a "Places API (New)" habilitada
 * no Google Cloud Console. A chave é usada SOMENTE no servidor
 * (route handlers) — nunca é exposta ao navegador.
 *
 * Ao armazenar/exibir dados do Google, revise e respeite os Termos
 * de Serviço do Google Maps Platform (atribuição, cache e restrições
 * de armazenamento): https://cloud.google.com/maps-platform/terms
 */

const ENDPOINT = "https://places.googleapis.com/v1/places:searchText";

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.editorialSummary",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.primaryTypeDisplayName",
  "places.googleMapsUri",
  "nextPageToken",
].join(",");

interface PlacesResponse {
  places?: Array<{
    id: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    editorialSummary?: { text?: string };
    websiteUri?: string;
    nationalPhoneNumber?: string;
    internationalPhoneNumber?: string;
    primaryTypeDisplayName?: { text?: string };
    googleMapsUri?: string;
  }>;
  nextPageToken?: string;
  error?: { message?: string; status?: string };
}

/** Extrai "Cidade" e "UF" de endereços no formato pt-BR. */
function parseCityState(address: string | undefined): { city: string | null; state: string | null } {
  if (!address) return { city: null, state: null };
  const match = address.match(/,\s*([^,-]+?)\s*-\s*([A-Z]{2})\b/);
  if (match) return { city: match[1].trim(), state: match[2] };
  return { city: null, state: null };
}

export class GooglePlacesProvider implements DataProvider {
  id = "google";
  label = "Google Places API (New)";
  description = "Resultados reais do Google Places. Requer GOOGLE_MAPS_API_KEY (somente servidor).";
  envVars = ["GOOGLE_MAPS_API_KEY=..."];

  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  configured(): boolean {
    return Boolean(this.apiKey);
  }

  async search(query: ProviderQuery): Promise<ProviderResult> {
    if (!this.configured()) {
      throw new ProviderError(
        "Google Places não configurado. Defina GOOGLE_MAPS_API_KEY no ambiente (server-side)."
      );
    }

    const location = [query.city, query.state, query.country].filter(Boolean).join(", ");
    const textQuery = location ? `${query.segment} em ${location}` : query.segment;

    const companies: RawCompany[] = [];
    let pageToken: string | undefined;

    for (let page = 0; page < 3 && companies.length < query.limit; page++) {
      let res: Response;
      try {
        res = await fetchWithTimeout(ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": this.apiKey,
            "X-Goog-FieldMask": FIELD_MASK,
          },
          body: JSON.stringify({
            textQuery,
            languageCode: "pt-BR",
            regionCode: "BR",
            pageSize: 20,
            ...(pageToken ? { pageToken } : {}),
          }),
          timeoutMs: 20000,
        });
      } catch {
        throw new ProviderError("Não foi possível acessar a Google Places API. Verifique a conexão.");
      }

      const data = (await res.json().catch(() => ({}))) as PlacesResponse;

      if (!res.ok) {
        const status = data.error?.status ?? String(res.status);
        if (status === "PERMISSION_DENIED" || res.status === 403) {
          throw new ProviderError(
            "GOOGLE_MAPS_API_KEY inválida ou sem a Places API (New) habilitada. Ative a API no Google Cloud Console."
          );
        }
        if (res.status === 429) {
          throw new ProviderError("Cota da Google Places API excedida. Verifique o billing da sua chave.");
        }
        throw new ProviderError(
          `Erro na Google Places API: ${data.error?.message ?? status}`,
          res.status
        );
      }

      for (const p of data.places ?? []) {
        const name = p.displayName?.text?.trim();
        if (!name || !p.id) continue;
        const { city, state } = parseCityState(p.formattedAddress);
        const website = ensureUrl(p.websiteUri ?? null);
        companies.push({
          externalId: p.id,
          name,
          category: p.primaryTypeDisplayName?.text ?? null,
          city,
          state,
          country: query.country || "Brasil",
          address: p.formattedAddress ?? null,
          website,
          instagram: null,
          phone: p.internationalPhoneNumber ?? p.nationalPhoneNumber ?? null,
          whatsapp: null,
          email: null,
          description: p.editorialSummary?.text ?? null,
          services: [],
          signals: {
            website: Boolean(website),
            whatsapp: null,
            contactForm: null,
            budgetRequests: null,
            catalog: null,
            instagramActive: null,
          },
          sourceUrl: p.googleMapsUri ?? null,
        });
        if (companies.length >= query.limit) break;
      }

      pageToken = data.nextPageToken;
      if (!pageToken) break;
    }

    if (companies.length === 0) {
      return {
        companies,
        notice:
          "Nenhuma empresa encontrada no Google Places para esta busca. Tente ampliar o termo ou a localização.",
      };
    }

    return {
      companies,
      notice:
        "Fonte: Google Places. Sinais como formulário de contato, WhatsApp e pedidos de orçamento não são fornecidos por esta API e aparecem como não verificados no score.",
    };
  }
}
