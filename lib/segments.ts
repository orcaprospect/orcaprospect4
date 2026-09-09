import { normalizeText } from "./utils";

/**
 * Segmentos com alta probabilidade de trabalharem com orçamentos
 * personalizados (critério de score: +10 pontos).
 */
export const HIGH_BUDGET_SEGMENT_KEYWORDS = [
  "marcenaria",
  "serralheria",
  "vidracaria",
  "vidro",
  "esquadrias",
  "moveis",
  "mobiliario",
  "moveis planejados",
  "marmoraria",
  "arquitetura",
  "design de interiores",
  "construcao",
  "reforma",
  "engenharia",
  "pintura",
  "paisagismo",
  "jardinagem",
  "piscina",
  "salao de beleza",
  "salao",
  "beleza",
  "barbearia",
  "estetica",
  "odontologia",
  "dentista",
  "clinica",
  "veterinaria",
  "pet shop",
  "buffet",
  "bufe",
  "eventos",
  "festas",
  "grafica",
  "impressao",
  "personalizados",
  "brindes",
  "oficina",
  "mecanica",
  "funilaria",
  "auto eletrica",
  "confeitaria",
  "doces",
  "bolos",
  "costura",
  "atelier",
  "fotografia",
  "papelaria",
];

/** Verifica se um texto (categoria/nome) é de segmento com alta chance de orçamento. */
export function matchesHighBudgetSegment(text: string | null | undefined): boolean {
  const t = normalizeText(text);
  if (!t) return false;
  return HIGH_BUDGET_SEGMENT_KEYWORDS.some((k) => t.includes(k));
}

/**
 * Mapeia termos de segmento (pt-BR) para tags do OpenStreetMap.
 * Usado pelo OpenStreetMapProvider para montar consultas Overpass.
 */
export const OSM_SEGMENT_TAGS: Record<
  string,
  { craft?: string[]; shop?: string[]; amenity?: string[]; office?: string[]; leisure?: string[]; healthcare?: string[] }
> = {
  marcenaria: { craft: ["carpenter", "joiner"], shop: ["furniture"] },
  carpintaria: { craft: ["carpenter", "joiner"] },
  moveis: { shop: ["furniture"] },
  mobiliario: { shop: ["furniture"] },
  serralheria: { craft: ["metal_construction", "blacksmith"] },
  esquadrias: { craft: ["window_construction", "metal_construction"] },
  vidracaria: { shop: ["glaziery"], craft: ["window_construction"] },
  marmoraria: { craft: ["stonemason"] },
  "salao de beleza": { shop: ["hairdresser", "beauty"] },
  beleza: { shop: ["beauty", "hairdresser"] },
  barbearia: { shop: ["hairdresser"] },
  estetica: { shop: ["beauty", "massage"] },
  odontologia: { amenity: ["dentist"], healthcare: ["dentist"] },
  dentista: { amenity: ["dentist"], healthcare: ["dentist"] },
  clinica: { amenity: ["clinic", "doctors"], healthcare: ["doctor"] },
  veterinaria: { amenity: ["veterinary"] },
  "pet shop": { shop: ["pet", "pet_grooming"] },
  academia: { leisure: ["fitness_centre"] },
  oficina: { shop: ["car_repair"] },
  mecanica: { shop: ["car_repair"] },
  grafica: { shop: ["copyshop"], craft: ["printer", "jeweller"] },
  impressao: { shop: ["copyshop"], craft: ["printer"] },
  confeitaria: { shop: ["pastry", "confectionery"] },
  doces: { shop: ["confectionery", "pastry"] },
  piscina: { shop: ["swimming_pool"] },
  paisagismo: { shop: ["garden_centre"] },
  jardinagem: { shop: ["garden_centre"] },
  floricultura: { shop: ["florist"] },
  farmacia: { shop: ["chemist"] },
  imobiliaria: { office: ["estate_agent"] },
  advocacia: { office: ["lawyer"] },
  contabilidade: { office: ["accountant"] },
  "auto eletrica": { shop: ["car_repair", "car_parts"] },
  funilaria: { shop: ["car_repair"] },
  "loja de alimentos": { shop: ["supermarket", "greengrocer"] },
  restaurante: { amenity: ["restaurant"] },
  cafe: { amenity: ["cafe"] },
};

/** Rótulos pt-BR para tags OSM (categoria exibida nos cards). */
export const OSM_TAG_LABELS: Record<string, string> = {
  "craft=carpenter": "Marcenaria",
  "craft=joiner": "Marcenaria",
  "craft=metal_construction": "Serralheria",
  "craft=blacksmith": "Serralheria",
  "craft=window_construction": "Esquadrias / Vidraçaria",
  "craft=stonemason": "Marmoraria",
  "craft=printer": "Gráfica",
  "shop=furniture": "Móveis",
  "shop=glaziery": "Vidraçaria",
  "shop=hairdresser": "Salão de beleza / Barbearia",
  "shop=beauty": "Estética",
  "shop=massage": "Estética",
  "shop=car_repair": "Oficina mecânica",
  "shop=car_parts": "Autopeças",
  "shop=pet": "Pet shop",
  "shop=pet_grooming": "Banho e tosa",
  "shop=copyshop": "Gráfica",
  "shop=pastry": "Confeitaria",
  "shop=confectionery": "Doces e bolos",
  "shop=swimming_pool": "Piscinas",
  "shop=garden_centre": "Paisagismo / Jardinagem",
  "shop=florist": "Floricultura",
  "shop=chemist": "Farmácia",
  "amenity=dentist": "Clínica odontológica",
  "healthcare=dentist": "Clínica odontológica",
  "amenity=clinic": "Clínica",
  "amenity=doctors": "Consultório",
  "healthcare=doctor": "Consultório",
  "amenity=veterinary": "Clínica veterinária",
  "amenity=restaurant": "Restaurante",
  "amenity=cafe": "Cafeteria",
  "leisure=fitness_centre": "Academia",
  "office=estate_agent": "Imobiliária",
  "office=lawyer": "Advocacia",
  "office=accountant": "Contabilidade",
};

/** Encontra tags OSM relevantes para o termo pesquisado. */
export function findOsmTags(segment: string):
  | { craft?: string[]; shop?: string[]; amenity?: string[]; office?: string[]; leisure?: string[]; healthcare?: string[] }
  | null {
  const t = normalizeText(segment);
  if (!t) return null;
  for (const [key, tags] of Object.entries(OSM_SEGMENT_TAGS)) {
    if (t === key || t.includes(key)) return tags;
  }
  return null;
}

/** Rótulo de categoria a partir das tags OSM do elemento. */
export function osmCategoryLabel(tags: Record<string, string>): string | null {
  const keys = ["craft", "shop", "amenity", "office", "leisure", "healthcare"];
  for (const k of keys) {
    const v = tags[k];
    if (!v) continue;
    const label = OSM_TAG_LABELS[`${k}=${v}`];
    if (label) return label;
  }
  return null;
}
