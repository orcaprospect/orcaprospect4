import type {
  CompanySignals,
  LeadStatus,
  RawCompany,
} from "@/types";

/** Input para criar/atualizar empresa (vem de um provider). */
export interface CompanyInput extends RawCompany {
  provider: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface CompanyRecord {
  id: string;
  /** Chave única: `${provider}:${externalId}` — evita duplicatas por fonte. */
  externalKey: string;
  provider: string;
  externalId: string;
  name: string;
  /** Nome normalizado (sem acento/pontuação) para dedup entre fontes. */
  normalizedName: string;
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
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string;
}

export interface LeadRecord {
  id: string;
  userId: string;
  companyId: string;
  status: LeadStatus;
  favorite: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteRecord {
  id: string;
  userId: string;
  companyId: string;
  createdAt: string;
}

export interface NoteRecord {
  id: string;
  leadId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface TagRecord {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
}

export interface SearchRecord {
  id: string;
  userId: string;
  segment: string;
  city: string;
  state: string;
  country: string;
  provider: string;
  resultCount: number;
  createdAt: string;
}

export interface LeadUpdatePatch {
  status?: LeadStatus;
  favorite?: boolean;
  addTags?: string[];
  removeTags?: string[];
}

export interface UserPatch {
  name?: string;
  passwordHash?: string;
}

/**
 * Camada de persistência. Implementações:
 * - JsonStore  — arquivo JSON local (padrão, zero configuração, dev/self-host)
 * - PgStore    — PostgreSQL / Supabase (STORE=postgres + DATABASE_URL)
 */
export interface Store {
  // users
  getUserByEmail(email: string): Promise<UserRecord | null>;
  getUserById(id: string): Promise<UserRecord | null>;
  countUsers(): Promise<number>;
  createUser(input: { name: string; email: string; passwordHash: string }): Promise<UserRecord>;
  updateUser(id: string, patch: UserPatch): Promise<UserRecord | null>;
  /** Cria/atualiza o perfil local a partir de uma conta Supabase Auth (mesmo id uuid). */
  upsertUser(input: { id: string; name: string; email: string }): Promise<UserRecord>;

  // companies (dedupe + upsert)
  upsertCompany(input: CompanyInput): Promise<CompanyRecord>;
  getCompany(id: string): Promise<CompanyRecord | null>;
  getCompaniesByIds(ids: string[]): Promise<CompanyRecord[]>;

  // leads
  createLead(userId: string, companyId: string): Promise<LeadRecord>;
  getLead(id: string, userId: string): Promise<LeadRecord | null>;
  getLeadByUserAndCompany(userId: string, companyId: string): Promise<LeadRecord | null>;
  listLeads(userId: string): Promise<LeadRecord[]>;
  updateLead(id: string, userId: string, patch: LeadUpdatePatch): Promise<LeadRecord | null>;
  deleteLead(id: string, userId: string): Promise<boolean>;

  // notes
  addNote(userId: string, leadId: string, content: string): Promise<NoteRecord>;
  deleteNote(userId: string, leadId: string, noteId: string): Promise<boolean>;
  listNotes(userId: string, leadId?: string): Promise<NoteRecord[]>;

  // favorites
  listFavorites(userId: string): Promise<FavoriteRecord[]>;
  getFavorite(userId: string, companyId: string): Promise<FavoriteRecord | null>;
  setFavorite(userId: string, companyId: string, favorite: boolean): Promise<FavoriteRecord>;
  removeFavorite(userId: string, companyId: string): Promise<boolean>;

  // tags (dicionário do usuário)
  listTags(userId: string): Promise<TagRecord[]>;

  // searches (histórico)
  addSearch(input: {
    userId: string;
    segment: string;
    city: string;
    state: string;
    country: string;
    provider: string;
    resultCount: number;
  }): Promise<SearchRecord>;
  listSearches(userId: string, limit?: number): Promise<SearchRecord[]>;

  // LGPD
  deleteUserData(userId: string): Promise<void>;
  exportUserData(userId: string): Promise<Record<string, unknown>>;
}
