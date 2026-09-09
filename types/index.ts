/**
 * Tipos de domínio compartilhados entre servidor e cliente.
 */

/** Sinais públicos utilizados no cálculo do score. `null` = não foi possível verificar. */
export interface CompanySignals {
  website?: boolean | null;
  whatsapp?: boolean | null;
  contactForm?: boolean | null;
  budgetRequests?: boolean | null;
  catalog?: boolean | null;
  instagramActive?: boolean | null;
}

/** Empresa bruta retornada por um provider. */
export interface RawCompany {
  /** Identificador único na fonte (ex.: place_id do Google, "node/123" do OSM). */
  externalId: string;
  name: string;
  category?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  address?: string | null;
  website?: string | null;
  instagram?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  description?: string | null;
  services?: string[];
  signals?: CompanySignals;
  /** URL pública da fonte (ex.: página do OpenStreetMap / Google Maps). */
  sourceUrl?: string | null;
}

export const LEAD_STATUSES = [
  "novo",
  "contatado",
  "respondeu",
  "demonstracao",
  "cliente",
  "sem_interesse",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  novo: "Novo",
  contatado: "Contatado",
  respondeu: "Respondeu",
  demonstracao: "Demonstração",
  cliente: "Cliente",
  sem_interesse: "Sem interesse",
};

export type ScoreTier = "alto" | "medio" | "baixo";

export type CriterionKey =
  | "website"
  | "whatsapp"
  | "contactForm"
  | "budgetRequests"
  | "catalog"
  | "instagramActive"
  | "segment";

export interface CriterionResult {
  key: CriterionKey;
  label: string;
  hint: string;
  points: number;
  /** Ganhou os pontos? */
  earned: boolean;
  /** O sinal foi verificado com os dados disponíveis? */
  verified: boolean;
}

export interface ScoreResult {
  score: number;
  tier: ScoreTier;
  breakdown: CriterionResult[];
  /** Critérios que não puderam ser verificados. */
  unverified: string[];
}

/** Empresa já enriquecida (score, breakdown, estado de lead/favorito) para a UI. */
export interface CompanyView {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  address: string | null;
  website: string | null;
  instagram: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  description: string | null;
  services: string[];
  signals: CompanySignals;
  sourceUrl: string | null;
  provider: string;
  providerLabel?: string;
  lastUpdatedAt: string;
  score: number;
  tier: ScoreTier;
  breakdown: CriterionResult[];
  unverified: string[];
  isFavorite?: boolean;
  leadId?: string | null;
  leadStatus?: LeadStatus | null;
  isDemo?: boolean;
}

export interface NoteView {
  id: string;
  content: string;
  createdAt: string;
}

export interface LeadView {
  id: string;
  status: LeadStatus;
  favorite: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  notes: NoteView[];
  company: CompanyView;
}

export interface SearchMeta {
  provider: string;
  providerLabel: string;
  demo: boolean;
  notice?: string;
}

export interface ProviderStatus {
  id: string;
  label: string;
  description: string;
  envVars: string[];
  configured: boolean;
  active: boolean;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}
