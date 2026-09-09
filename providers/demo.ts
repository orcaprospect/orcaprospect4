import type { RawCompany } from "@/types";
import { normalizeText } from "@/lib/utils";
import type { DataProvider, ProviderQuery, ProviderResult } from "./types";

/**
 * ============================================================
 * PROVIDER DE DEMONSTRAÇÃO — "DADOS DE DEMONSTRAÇÃO"
 * ============================================================
 * Gera EMPRESAS FICTÍCIAS, determinísticas e claramente
 * identificadas, para explorar a ferramenta sem nenhuma API.
 * Nenhuma empresa aqui representa um negócio real:
 *  - nomes sempre contêm "Exemplo" ou "Demonstração";
 *  - telefones usam placeholder "0000-0000" (não discável);
 *  - domínios usam o TLD reservado `.invalid` (RFC 2606).
 * Não use este provider em produção.
 */

interface DemoCompany extends RawCompany {
  level: "high" | "medium" | "low";
}

const SUFFIXES = [
  "Exemplo Aurora",
  "Exemplo Bela Vista",
  "Demonstração Central",
  "Exemplo Dona Rosa",
  "Exemplo Estrela",
  "Demonstração Ipê",
];

const LEVELS: DemoCompany["level"][] = ["high", "medium", "high", "low", "medium", "high"];

const SEGMENTS = [
  { category: "Marcenaria", keywords: ["marcenaria", "carpintaria", "moveis", "mobiliario", "madeira"] },
  { category: "Serralheria", keywords: ["serralheria", "metal", "aluminio", "esquadrias", "ferro"] },
  { category: "Vidraçaria", keywords: ["vidracaria", "vidro", "esquadrias de vidro"] },
  { category: "Salão de beleza", keywords: ["salao", "beleza", "cabelo", "barbearia", "estetica"] },
  { category: "Clínica odontológica", keywords: ["odontologia", "dentista", "clinica odontologica"] },
  { category: "Oficina mecânica", keywords: ["oficina", "mecanica", "auto", "carro"] },
  { category: "Buffet e eventos", keywords: ["buffet", "bufe", "eventos", "festas"] },
  { category: "Gráfica", keywords: ["grafica", "impressao", "comunicacao visual"] },
  { category: "Pet shop", keywords: ["pet", "banho e tosa", "veterinaria", "petshop"] },
];

const CITIES: Array<[string, string]> = [
  ["Santo André", "SP"],
  ["São Paulo", "SP"],
  ["Campinas", "SP"],
  ["São Caetano do Sul", "SP"],
  ["Curitiba", "PR"],
  ["Belo Horizonte", "MG"],
];

function buildCatalog(): DemoCompany[] {
  const list: DemoCompany[] = [];
  for (let s = 0; s < SEGMENTS.length; s++) {
    const seg = SEGMENTS[s];
    const perSegment = s < 6 ? 4 : 3;
    for (let i = 0; i < perSegment; i++) {
      const idx = s * 4 + i;
      const [city, state] = CITIES[(s + i) % CITIES.length];
      const name = `${seg.category} ${SUFFIXES[(s + i) % SUFFIXES.length]}`;
      const slug = `exemplo-${normalizeText(seg.category).replace(/\s+/g, "-")}-${i + 1}`;
      const level = LEVELS[(s * 2 + i) % LEVELS.length];
      list.push({
        externalId: `demo-${idx + 1}`,
        name,
        category: seg.category,
        city,
        state,
        country: "Brasil",
        website: level === "low" ? null : `https://www.exemplo.invalid/${slug}`,
        instagram: level === "low" ? null : `@${slug}`,
        phone: "+55 (11) 0000-0000",
        whatsapp: level === "low" ? null : "+55 (11) 0000-0000",
        email: `contato@${slug}.invalid`,
        description:
          "Empresa FICTÍCIA de demonstração do Orça Prospect. Nenhum dado aqui representa um negócio real.",
        services:
          level === "high"
            ? ["Orçamentos personalizados (demonstração)", "Atendimento via WhatsApp (demonstração)", "Catálogo de produtos (demonstração)"]
            : ["Orçamentos personalizados (demonstração)"],
        signals: {
          website: level !== "low",
          whatsapp: level !== "low",
          contactForm: level === "high",
          budgetRequests: level === "high",
          catalog: level !== "low",
          instagramActive: level !== "low",
        },
        sourceUrl: null,
        level,
      });
    }
  }
  return list;
}

let catalog: DemoCompany[] | null = null;
function getCatalog(): DemoCompany[] {
  if (!catalog) catalog = buildCatalog();
  return catalog;
}

export class DemoProvider implements DataProvider {
  id = "demo";
  label = "Modo demonstração";
  description = "Empresas fictícias geradas localmente para explorar a ferramenta.";
  envVars = ["DEMO_MODE=true"];

  configured(): boolean {
    return true;
  }

  async search(query: ProviderQuery): Promise<ProviderResult> {
    const seg = normalizeText(query.segment);
    const city = normalizeText(query.city);
    const state = normalizeText(query.state).slice(0, 2);

    let list = getCatalog();

    // filtra por segmento/palavra-chave
    const segMatched = seg
      ? list.filter(
          (c) =>
            normalizeText(c.category).includes(seg) ||
            normalizeText(c.name).includes(seg) ||
            SEGMENTS.some(
              (s) =>
                normalizeText(s.category) === normalizeText(c.category) &&
                s.keywords.some((k) => seg.includes(k) || k.includes(seg))
            )
        )
      : list;

    let notice: string | undefined;
    if (seg && segMatched.length === 0) {
      notice =
        "Modo demonstração: não há empresas fictícias deste segmento — mostrando exemplos de vários segmentos.";
      list = list.slice(0, 12);
    } else {
      list = segMatched;
    }

    // filtra por localidade
    if (city || state) {
      const local = list.filter(
        (c) =>
          (!city || normalizeText(c.city).includes(city) || city.includes(normalizeText(c.city) || "x")) &&
          (!state || normalizeText(c.state) === state)
      );
      if (local.length > 0) {
        list = local;
      } else {
        notice =
          "Modo demonstração: nenhuma empresa fictícia nesta cidade — mostrando exemplos de outras localidades.";
      }
    }

    return { companies: list.slice(0, query.limit), notice };
  }
}
