import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { normalizeLocation, normalizeName } from "../utils";
import type {
  CompanyInput,
  CompanyRecord,
  FavoriteRecord,
  LeadRecord,
  LeadUpdatePatch,
  NoteRecord,
  SearchRecord,
  Store,
  TagRecord,
  UserPatch,
  UserRecord,
} from "./types";

/**
 * Armazenamento em arquivo JSON (padrão, zero configuração).
 * Ideal para desenvolvimento e self-hosting em um único processo.
 * Para produção escalável use STORE=postgres (lib/store/pg-store.ts).
 */

interface DbShape {
  version: number;
  users: UserRecord[];
  companies: CompanyRecord[];
  leads: LeadRecord[];
  favorites: FavoriteRecord[];
  notes: NoteRecord[];
  tags: TagRecord[];
  searches: SearchRecord[];
}

function emptyDb(): DbShape {
  return {
    version: 1,
    users: [],
    companies: [],
    leads: [],
    favorites: [],
    notes: [],
    tags: [],
    searches: [],
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

function uid(): string {
  return crypto.randomUUID();
}

export class JsonStore implements Store {
  private db: DbShape;
  private file: string;

  constructor(dataDir: string) {
    const dir = path.resolve(process.cwd(), dataDir);
    fs.mkdirSync(dir, { recursive: true });
    this.file = path.join(dir, "orca-prospect.json");
    this.db = this.load();
  }

  private load(): DbShape {
    try {
      const raw = fs.readFileSync(this.file, "utf8");
      const parsed = JSON.parse(raw) as Partial<DbShape>;
      return { ...emptyDb(), ...parsed };
    } catch {
      return emptyDb();
    }
  }

  private save(): void {
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.db, null, 2), "utf8");
    fs.renameSync(tmp, this.file);
  }

  // ---------------- users ----------------

  async getUserByEmail(email: string): Promise<UserRecord | null> {
    const e = email.trim().toLowerCase();
    return this.db.users.find((u) => u.email === e) ?? null;
  }

  async getUserById(id: string): Promise<UserRecord | null> {
    return this.db.users.find((u) => u.id === id) ?? null;
  }

  async createUser(input: { name: string; email: string; passwordHash: string }): Promise<UserRecord> {
    const user: UserRecord = {
      id: uid(),
      name: input.name,
      email: input.email.trim().toLowerCase(),
      passwordHash: input.passwordHash,
      createdAt: nowIso(),
    };
    this.db.users.push(user);
    this.save();
    return user;
  }

  async updateUser(id: string, patch: UserPatch): Promise<UserRecord | null> {
    const user = this.db.users.find((u) => u.id === id);
    if (!user) return null;
    if (patch.name !== undefined) user.name = patch.name;
    if (patch.passwordHash !== undefined) user.passwordHash = patch.passwordHash;
    this.save();
    return user;
  }

  // ---------------- companies (dedupe/upsert) ----------------

  async upsertCompany(input: CompanyInput): Promise<CompanyRecord> {
    const ts = nowIso();
    const externalKey = `${input.provider}:${input.externalId}`;

    let rec =
      this.db.companies.find((c) => c.externalKey === externalKey) ?? null;

    // Deduplicação entre fontes: mesmo nome normalizado + mesma cidade/UF.
    if (!rec) {
      const nn = normalizeName(input.name);
      const nCity = normalizeLocation(input.city);
      const nState = normalizeLocation(input.state);
      rec =
        this.db.companies.find(
          (c) =>
            c.normalizedName === nn &&
            normalizeLocation(c.city) === nCity &&
            normalizeLocation(c.state) === nState
        ) ?? null;
    }

    if (rec) {
      const updates: Partial<CompanyRecord> = {};
      const incoming: Record<string, unknown> = {
        category: input.category,
        city: input.city,
        state: input.state,
        country: input.country,
        address: input.address,
        website: input.website,
        instagram: input.instagram,
        phone: input.phone,
        whatsapp: input.whatsapp,
        email: input.email,
        description: input.description,
        sourceUrl: input.sourceUrl,
      };
      let changed = false;
      for (const [k, v] of Object.entries(incoming)) {
        const current = (rec as unknown as Record<string, unknown>)[k];
        if (v != null && v !== "" && current !== v) {
          updates[k as keyof CompanyRecord] = v as never;
          changed = true;
        }
      }
      if (input.signals && Object.keys(input.signals).length) {
        rec.signals = { ...rec.signals, ...input.signals };
        changed = true;
      }
      if (input.services?.length) {
        const merged = Array.from(new Set([...(rec.services ?? []), ...input.services]));
        if (merged.length !== rec.services.length) {
          rec.services = merged;
          changed = true;
        }
      }
      Object.assign(rec, updates);
      rec.lastSeenAt = ts;
      if (changed) rec.updatedAt = ts;
      this.save();
      return rec;
    }

    const created: CompanyRecord = {
      id: uid(),
      externalKey,
      provider: input.provider,
      externalId: input.externalId,
      name: input.name,
      normalizedName: normalizeName(input.name),
      category: input.category ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      country: input.country ?? null,
      address: input.address ?? null,
      website: input.website ?? null,
      instagram: input.instagram ?? null,
      phone: input.phone ?? null,
      whatsapp: input.whatsapp ?? null,
      email: input.email ?? null,
      description: input.description ?? null,
      services: input.services ?? [],
      signals: input.signals ?? {},
      sourceUrl: input.sourceUrl ?? null,
      createdAt: ts,
      updatedAt: ts,
      lastSeenAt: ts,
    };
    this.db.companies.push(created);
    this.save();
    return created;
  }

  async getCompany(id: string): Promise<CompanyRecord | null> {
    return this.db.companies.find((c) => c.id === id) ?? null;
  }

  async getCompaniesByIds(ids: string[]): Promise<CompanyRecord[]> {
    const set = new Set(ids);
    return this.db.companies.filter((c) => set.has(c.id));
  }

  // ---------------- leads ----------------

  async createLead(userId: string, companyId: string): Promise<LeadRecord> {
    const existing = this.getLeadByUserAndCompanySync(userId, companyId);
    if (existing) return existing;
    const ts = nowIso();
    const lead: LeadRecord = {
      id: uid(),
      userId,
      companyId,
      status: "novo",
      favorite: false,
      tags: [],
      createdAt: ts,
      updatedAt: ts,
    };
    this.db.leads.push(lead);
    this.save();
    return lead;
  }

  private getLeadByUserAndCompanySync(userId: string, companyId: string): LeadRecord | null {
    return (
      this.db.leads.find((l) => l.userId === userId && l.companyId === companyId) ?? null
    );
  }

  async getLead(id: string, userId: string): Promise<LeadRecord | null> {
    return this.db.leads.find((l) => l.id === id && l.userId === userId) ?? null;
  }

  async getLeadByUserAndCompany(userId: string, companyId: string): Promise<LeadRecord | null> {
    return this.getLeadByUserAndCompanySync(userId, companyId);
  }

  async listLeads(userId: string): Promise<LeadRecord[]> {
    return this.db.leads
      .filter((l) => l.userId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async updateLead(id: string, userId: string, patch: LeadUpdatePatch): Promise<LeadRecord | null> {
    const lead = this.db.leads.find((l) => l.id === id && l.userId === userId);
    if (!lead) return null;
    if (patch.status) lead.status = patch.status;
    if (patch.favorite !== undefined) lead.favorite = patch.favorite;
    if (patch.addTags?.length) {
      for (const raw of patch.addTags) {
        const tag = raw.trim().replace(/\s+/g, " ");
        if (tag && !lead.tags.some((t) => t.toLowerCase() === tag.toLowerCase())) {
          lead.tags.push(tag);
          this.upsertTagSync(userId, tag);
        }
      }
    }
    if (patch.removeTags?.length) {
      const remove = new Set(patch.removeTags.map((t) => t.toLowerCase()));
      lead.tags = lead.tags.filter((t) => !remove.has(t.toLowerCase()));
    }
    lead.updatedAt = nowIso();
    this.save();
    return lead;
  }

  async deleteLead(id: string, userId: string): Promise<boolean> {
    const before = this.db.leads.length;
    this.db.leads = this.db.leads.filter((l) => l.id !== id || l.userId !== userId);
    this.db.notes = this.db.notes.filter((n) => n.leadId !== id || n.userId !== userId);
    if (this.db.leads.length !== before) {
      this.save();
      return true;
    }
    return false;
  }

  // ---------------- notes ----------------

  async addNote(userId: string, leadId: string, content: string): Promise<NoteRecord> {
    const note: NoteRecord = {
      id: uid(),
      leadId,
      userId,
      content,
      createdAt: nowIso(),
    };
    this.db.notes.push(note);
    this.save();
    return note;
  }

  async deleteNote(userId: string, leadId: string, noteId: string): Promise<boolean> {
    const before = this.db.notes.length;
    this.db.notes = this.db.notes.filter(
      (n) => !(n.id === noteId && n.leadId === leadId && n.userId === userId)
    );
    if (this.db.notes.length !== before) {
      this.save();
      return true;
    }
    return false;
  }

  async listNotes(userId: string, leadId?: string): Promise<NoteRecord[]> {
    return this.db.notes
      .filter((n) => n.userId === userId && (!leadId || n.leadId === leadId))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  // ---------------- favorites ----------------

  async listFavorites(userId: string): Promise<FavoriteRecord[]> {
    return this.db.favorites
      .filter((f) => f.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getFavorite(userId: string, companyId: string): Promise<FavoriteRecord | null> {
    return (
      this.db.favorites.find((f) => f.userId === userId && f.companyId === companyId) ?? null
    );
  }

  async setFavorite(userId: string, companyId: string, favorite: boolean): Promise<FavoriteRecord> {
    const existing = this.db.favorites.find(
      (f) => f.userId === userId && f.companyId === companyId
    );
    if (favorite) {
      if (existing) return existing;
      const rec: FavoriteRecord = { id: uid(), userId, companyId, createdAt: nowIso() };
      this.db.favorites.push(rec);
      this.save();
      return rec;
    }
    this.db.favorites = this.db.favorites.filter(
      (f) => !(f.userId === userId && f.companyId === companyId)
    );
    this.save();
    return { id: "", userId, companyId, createdAt: nowIso() };
  }

  async removeFavorite(userId: string, companyId: string): Promise<boolean> {
    const before = this.db.favorites.length;
    this.db.favorites = this.db.favorites.filter(
      (f) => !(f.userId === userId && f.companyId === companyId)
    );
    if (this.db.favorites.length !== before) {
      this.save();
      return true;
    }
    return false;
  }

  // ---------------- tags ----------------

  private upsertTagSync(userId: string, name: string): void {
    const exists = this.db.tags.some(
      (t) => t.userId === userId && t.name.toLowerCase() === name.toLowerCase()
    );
    if (!exists) {
      this.db.tags.push({ id: uid(), userId, name, createdAt: nowIso() });
    }
  }

  async listTags(userId: string): Promise<TagRecord[]> {
    return this.db.tags
      .filter((t) => t.userId === userId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // ---------------- searches ----------------

  async addSearch(input: {
    userId: string;
    segment: string;
    city: string;
    state: string;
    country: string;
    provider: string;
    resultCount: number;
  }): Promise<SearchRecord> {
    const rec: SearchRecord = { id: uid(), createdAt: nowIso(), ...input };
    this.db.searches.push(rec);
    // mantém apenas os 100 registros mais recentes por usuário
    const mine = this.db.searches
      .filter((s) => s.userId === input.userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (mine.length > 100) {
      const cutoff = new Set(mine.slice(100).map((s) => s.id));
      this.db.searches = this.db.searches.filter((s) => !cutoff.has(s.id));
    }
    this.save();
    return rec;
  }

  async listSearches(userId: string, limit = 10): Promise<SearchRecord[]> {
    return this.db.searches
      .filter((s) => s.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  // ---------------- LGPD ----------------

  async deleteUserData(userId: string): Promise<void> {
    this.db.leads = this.db.leads.filter((l) => l.userId !== userId);
    this.db.notes = this.db.notes.filter((n) => n.userId !== userId);
    this.db.favorites = this.db.favorites.filter((f) => f.userId !== userId);
    this.db.searches = this.db.searches.filter((s) => s.userId !== userId);
    this.db.tags = this.db.tags.filter((t) => t.userId !== userId);
    this.save();
  }

  async exportUserData(userId: string): Promise<Record<string, unknown>> {
    const user = this.db.users.find((u) => u.id === userId);
    const leadIds = new Set(this.db.leads.filter((l) => l.userId === userId).map((l) => l.companyId));
    return {
      exportedAt: nowIso(),
      user: user ? { name: user.name, email: user.email, createdAt: user.createdAt } : null,
      leads: this.db.leads.filter((l) => l.userId === userId),
      notes: this.db.notes.filter((n) => n.userId === userId),
      favorites: this.db.favorites.filter((f) => f.userId === userId),
      searches: this.db.searches.filter((s) => s.userId === userId),
      tags: this.db.tags.filter((t) => t.userId === userId),
      companies: this.db.companies.filter((c) => leadIds.has(c.id)),
    };
  }
}
