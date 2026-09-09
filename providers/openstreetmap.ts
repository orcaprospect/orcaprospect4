import type { RawCompany } from "@/types";
import { findOsmTags, osmCategoryLabel } from "@/lib/segments";
import { ensureUrl, normalizeText, phoneDigits, instagramUrl } from "@/lib/utils";
import { ProviderError, fetchWithTimeout, type DataProvider, type ProviderQuery, type ProviderResult } from "./types";

/**
 * ============================================================
 * PROVIDER OPENSTREETMAP (Nominatim + Overpass API)
 * ============================================================
 * Fonte pública, gratuita e PERMITIDA para este tipo de uso,
 * desde que as políticas de uso sejam respeitadas:
 *  - Nominatim: máx. 1 req/s + User-Agent identificável;
 *  - Overpass: consultas limitadas, sem uso abusivo.
 * Não realizamos scraping de páginas — usamos apenas as APIs oficiais.
 * https://operations.osmfoundation.org/policies/nominatim/
 * https://overpass-api.de/full.html
 */

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const USER_AGENT = "OrcaProspect/0.1 (prospeccao B2B; uso responsavel das APIs publicas)";

interface NominatimResult {
  display_name: string;
  boundingbox: [string, string, string, string]; // [south, north, west, east]
}

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  tags?: Record<string, string>;
}

function escapeOverpassRegex(value: string): string {
  return value.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&").replace(/"/g, "");
}

function firstTag(tags: Record<string, string>, keys: string[]): string | null {
  for (const k of keys) {
    const v = tags[k];
    if (v && v.trim()) return v.trim();
  }
  return null;
}

export class OpenStreetMapProvider implements DataProvider {
  id = "osm";
  label = "OpenStreetMap";
  description = "APIs públicas Nominatim + Overpass (dados abertos). Não requer chave.";
  envVars = ["OSM_ENABLED=true"];

  configured(): boolean {
    return true;
  }

  private async geocode(query: ProviderQuery): Promise<{ south: number; west: number; north: number; east: number }> {
    const params = new URLSearchParams({
      format: "jsonv2",
      limit: "1",
      "accept-language": "pt-BR",
    });
    if (query.city) params.set("city", query.city);
    if (query.state) params.set("state", query.state);
    params.set("country", query.country || "Brasil");
    params.set("country_codes", "br");

    let res: Response;
    try {
      res = await fetchWithTimeout(`${NOMINATIM_URL}?${params.toString()}`, {
        headers: { "User-Agent": USER_AGENT },
        timeoutMs: 15000,
      });
    } catch {
      throw new ProviderError(
        "Não foi possível acessar a API do OpenStreetMap (Nominatim). Verifique sua conexão e tente novamente."
      );
    }
    if (res.status === 429) {
      throw new ProviderError(
        "A API pública do OpenStreetMap está com limite de uso no momento. Aguarde alguns segundos e tente novamente."
      );
    }
    if (!res.ok) {
      throw new ProviderError("Erro ao consultar a localização no OpenStreetMap.", res.status);
    }
    const results = (await res.json()) as NominatimResult[];
    if (!results.length) {
      throw new ProviderError(
        `Não foi possível localizar "${[query.city, query.state].filter(Boolean).join(", ")}" no OpenStreetMap. Verifique o nome da cidade/estado.`
      );
    }
    const bb = results[0].boundingbox; // [south, north, west, east]
    return {
      south: Number(bb[0]),
      north: Number(bb[1]),
      west: Number(bb[2]),
      east: Number(bb[3]),
    };
  }

  private buildOverpassQuery(segment: string, bbox: { south: number; west: number; north: number; east: number }): string {
    const bb = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
    const parts: string[] = [];
    const mapped = findOsmTags(segment);
    if (mapped) {
      const keyMap: Record<string, string[] | undefined> = {
        craft: mapped.craft,
        shop: mapped.shop,
        amenity: mapped.amenity,
        office: mapped.office,
        leisure: mapped.leisure,
        healthcare: mapped.healthcare,
      };
      for (const [key, values] of Object.entries(keyMap)) {
        if (values?.length) {
          parts.push(`nwr["${key}"~"${values.join("|")}",i](${bb});`);
        }
      }
    }
    parts.push(`nwr["name"~"${escapeOverpassRegex(segment)}",i](${bb});`);
    return `[out:json][timeout:25];(${parts.join("")});out center 90;`;
  }

  async search(query: ProviderQuery): Promise<ProviderResult> {
    if (!query.city && !query.state) {
      throw new ProviderError(
        "A busca via OpenStreetMap precisa de uma cidade ou estado. Informe a localização ou ative o modo demonstração."
      );
    }

    const bbox = await this.geocode(query);
    const q = this.buildOverpassQuery(query.segment, bbox);

    let res: Response;
    try {
      res = await fetchWithTimeout(OVERPASS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": USER_AGENT,
        },
        body: `data=${encodeURIComponent(q)}`,
        timeoutMs: 30000,
      });
    } catch {
      throw new ProviderError(
        "Não foi possível acessar a API Overpass (OpenStreetMap). O serviço pode estar sob carga — tente novamente em instantes."
      );
    }
    if (res.status === 429 || res.status === 504) {
      throw new ProviderError(
        "A API Overpass está sob carga no momento. Tente novamente em alguns instantes."
      );
    }
    if (!res.ok) {
      throw new ProviderError("Erro ao consultar empresas no OpenStreetMap (Overpass).", res.status);
    }

    const data = (await res.json()) as { elements?: OverpassElement[] };
    const seen = new Set<string>();
    const companies: RawCompany[] = [];

    for (const el of data.elements ?? []) {
      const t = el.tags ?? {};
      const name = t.name?.trim();
      if (!name) continue;

      const dedupeKey = `${normalizeText(name)}|${normalizeText(t["addr:street"] ?? "")}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      const website = ensureUrl(firstTag(t, ["website", "contact:website", "url"]));
      const phone = firstTag(t, ["phone", "contact:phone", "contact:mobile", "contact:telephone"]);
      const whatsapp = firstTag(t, ["contact:whatsapp", "whatsapp"]);
      const email = firstTag(t, ["email", "contact:email"]);
      const instagram = instagramUrl(firstTag(t, ["contact:instagram", "instagram"]));

      const addressParts = [
        [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(", "),
        t["addr:suburb"],
      ].filter(Boolean);
      const address = addressParts.length ? addressParts.join(" - ") : null;

      const mappedTagKeys = ["craft", "shop", "amenity", "office", "leisure", "healthcare"];
      let category = osmCategoryLabel(t);
      if (!category) {
        // encontrada apenas pelo nome: usa o próprio termo como categoria
        category = query.segment.charAt(0).toUpperCase() + query.segment.slice(1);
      } else if (!mappedTagKeys.some((k) => t[k])) {
        category = null;
      }

      companies.push({
        externalId: `${el.type}/${el.id}`,
        name,
        category,
        city: t["addr:city"] ?? query.city ?? null,
        state: t["addr:state"] ?? query.state ?? null,
        country: t["addr:country"] ?? query.country ?? "Brasil",
        address: address || null,
        website,
        instagram,
        phone,
        whatsapp: whatsapp ?? null,
        email,
        description: null,
        services: [],
        signals: {
          website: Boolean(website),
          whatsapp: Boolean(whatsapp),
          contactForm: null,
          budgetRequests: null,
          catalog: null,
          instagramActive: Boolean(instagram),
        },
        sourceUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
      });

      if (companies.length >= query.limit) break;
    }

    if (companies.length === 0) {
      return {
        companies,
        notice:
          "Nenhuma empresa encontrada nesta área na base aberta do OpenStreetMap. Tente outro termo, outra cidade, ou configure o Google Places para resultados mais completos.",
      };
    }

    return {
      companies,
      notice:
        "Fonte: OpenStreetMap (dados abertos). Sinais como formulário de contato e pedidos de orçamento não podem ser verificados por esta fonte e aparecem como não verificados no score.",
    };
  }
}
