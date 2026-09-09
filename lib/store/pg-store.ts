/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "node:crypto";
import { Pool } from "pg";
import { normalizeLocation, normalizeName } from "../utils";
import { PG_SCHEMA_SQL } from "./pg-schema";
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

const COMPANY_COLS = `id, provider, external_id as "externalId", external_key as "externalKey",
  name, normalized_name as "normalizedName", normalized_city as "normalizedCity",
  normalized_state as "normalizedState", category, city, state, country, address, website,
  instagram, phone, whatsapp, email, description, services, signals, source_url as "sourceUrl",
  created_at as "createdAt", updated_at as "updatedAt", last_seen_at as "lastSeenAt"`;

/**
 * Armazenamento PostgreSQL / Supabase.
 *
 * Funciona com a Connection String do Supabase (DATABASE_URL) e aplica o
 * schema AUTOMATICAMENTE na primeira conexão — não é preciso rodar SQL
 * manualmente. Requer `pg` (já incluído nas dependências do projeto).
 */
export class PgStore implements Store {
  private connectionString: string;
  private pool: Pool | null = null;
  private initPromise: Promise<Pool> | null = null;

  constructor(connectionString: string) {
    this.connectionString = connectionString;
  }

  /** Conecta (uma vez por processo) e garante que o schema existe. */
  private client(): Promise<Pool> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = (async () => {
      const isSupabase = /supabase\.(co|com)|pooler\.supabase/i.test(this.connectionString);
      const pool = new Pool({
        connectionString: this.connectionString,
        ssl: isSupabase || /sslmode=require/i.test(this.connectionString)
          ? { rejectUnauthorized: false }
          : undefined,
        max: 5,
        connectionTimeoutMillis: 15000,
      });
      try {
        const reg = await pool.query<{ t: string | null }>(
          `select to_regclass('public.users') as t`
        );
        const fresh = !reg.rows[0]?.t;
        // Sempre aplica o DDL idempotente (create/alter if not exists):
        // cria as tabelas na 1ª execução e aplica migrações leves
        // (ex.: novas colunas) em bancos já existentes.
        await pool.query(PG_SCHEMA_SQL);
        if (fresh) {
          console.info("[Orça Prospect] Schema PostgreSQL criado automaticamente.");
        }
        return pool;
      } catch (error) {
        await pool.end().catch(() => {});
        this.initPromise = null;
        throw this.friendlyError(error);
      }
    })();
    return this.initPromise;
  }

  private friendlyError(error: unknown): Error {
    const e = error as { code?: string; message?: string };
    const code = e?.code ?? "";
    const msg = e?.message ?? "erro desconhecido";
    if (code === "ECONNREFUSED" || code === "ENOTFOUND" || code === "ETIMEDOUT") {
      return new Error(
        "Não foi possível conectar ao banco PostgreSQL/Supabase (host inacessível). Verifique a DATABASE_URL (host/porta) e sua conexão."
      );
    }
    if (code === "28P01" || code === "28000" || /password authentication failed/i.test(msg)) {
      return new Error(
        "Credenciais do banco incorretas (usuário/senha). Verifique a DATABASE_URL — no Supabase, copie a Connection String novamente e substitua [YOUR-PASSWORD] pela senha do projeto."
      );
    }
    if (code === "3D000") {
      return new Error("Banco de dados não encontrado. Verifique o nome do banco na DATABASE_URL.");
    }
    return new Error(`Erro de banco de dados: ${msg}`);
  }

  private async query<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
    try {
      const pool = await this.client();
      const res = await pool.query(sql, params);
      return res.rows as T[];
    } catch (error) {
      throw this.friendlyError(error);
    }
  }

  private uid(): string {
    return crypto.randomUUID();
  }

  // ---------------- users ----------------

  async getUserByEmail(email: string): Promise<UserRecord | null> {
    const rows = await this.query(
      `select id, name, email, password_hash as "passwordHash", created_at as "createdAt"
       from users where email = $1 limit 1`,
      [email.trim().toLowerCase()]
    );
    return rows[0] ?? null;
  }

  async getUserById(id: string): Promise<UserRecord | null> {
    const rows = await this.query(
      `select id, name, email, password_hash as "passwordHash", created_at as "createdAt"
       from users where id = $1 limit 1`,
      [id]
    );
    return rows[0] ?? null;
  }

  async countUsers(): Promise<number> {
    const rows = await this.query<{ n: string }>(`select count(*)::text as n from users`);
    return Number(rows[0]?.n ?? 0);
  }

  async createUser(input: { name: string; email: string; passwordHash: string }): Promise<UserRecord> {
    const rows = await this.query(
      `insert into users (id, name, email, password_hash) values ($1, $2, $3, $4)
       returning id, name, email, password_hash as "passwordHash", created_at as "createdAt"`,
      [this.uid(), input.name, input.email.trim().toLowerCase(), input.passwordHash]
    );
    return rows[0];
  }

  async updateUser(id: string, patch: UserPatch): Promise<UserRecord | null> {
    const rows = await this.query(
      `update users set
         name = coalesce($2, name),
         password_hash = coalesce($3, password_hash),
         updated_at = now()
       where id = $1
       returning id, name, email, password_hash as "passwordHash", created_at as "createdAt"`,
      [id, patch.name ?? null, patch.passwordHash ?? null]
    );
    return rows[0] ?? null;
  }

  /** Cria/atualiza o perfil local a partir de uma conta Supabase Auth (mesmo id uuid). */
  async upsertUser(input: { id: string; name: string; email: string }): Promise<UserRecord> {
    const rows = await this.query(
      `insert into users (id, name, email, password_hash)
       values ($1, $2, $3, '')
       on conflict (id) do update
         set name = excluded.name, email = excluded.email, updated_at = now()
       returning id, name, email, password_hash as "passwordHash", created_at as "createdAt"`,
      [input.id, input.name, input.email.trim().toLowerCase()]
    );
    return rows[0];
  }

  // ---------------- companies (dedupe/upsert) ----------------

  async upsertCompany(input: CompanyInput): Promise<CompanyRecord> {
    const externalKey = `${input.provider}:${input.externalId}`;
    const signals = JSON.stringify(input.signals ?? {});
    const services = JSON.stringify(input.services ?? []);
    const nName = normalizeName(input.name);
    const nCity = normalizeLocation(input.city);
    const nState = normalizeLocation(input.state);

    // 1) mesma fonte + id externo → atualiza
    let rows = await this.query(
      `update companies set
         category = coalesce($2, category), city = coalesce($3, city), state = coalesce($4, state),
         country = coalesce($5, country), address = coalesce($6, address), website = coalesce($7, website),
         instagram = coalesce($8, instagram), phone = coalesce($9, phone), whatsapp = coalesce($10, whatsapp),
         email = coalesce($11, email), description = coalesce($12, description), source_url = coalesce($13, source_url),
         signals = companies.signals || $14::jsonb,
         services = (
           select coalesce(jsonb_agg(distinct s), '[]'::jsonb)
           from jsonb_array_elements(companies.services || $15::jsonb) as s
         ),
         last_seen_at = now(), updated_at = now()
       where external_key = $1
       returning ${COMPANY_COLS}`,
      [
        externalKey, input.category ?? null, input.city ?? null, input.state ?? null,
        input.country ?? null, input.address ?? null, input.website ?? null, input.instagram ?? null,
        input.phone ?? null, input.whatsapp ?? null, input.email ?? null, input.description ?? null,
        input.sourceUrl ?? null, signals, services,
      ]
    );

    // 2) outra fonte, mesma empresa (nome+cidade+UF normalizados) → mescla
    if (!rows.length) {
      rows = await this.query(
        `update companies set
           external_key = $1, provider = $2, external_id = $3,
           category = coalesce($4, category), website = coalesce($5, website),
           instagram = coalesce($6, instagram), phone = coalesce($7, phone), whatsapp = coalesce($8, whatsapp),
           email = coalesce($9, email), source_url = coalesce($10, source_url),
           signals = companies.signals || $11::jsonb, last_seen_at = now(), updated_at = now()
         where normalized_name = $12 and normalized_city = $13 and normalized_state = $14
         returning ${COMPANY_COLS}`,
        [
          externalKey, input.provider, input.externalId, input.category ?? null, input.website ?? null,
          input.instagram ?? null, input.phone ?? null, input.whatsapp ?? null, input.email ?? null,
          input.sourceUrl ?? null, signals, nName, nCity, nState,
        ]
      );
    }

    // 3) nova empresa
    if (!rows.length) {
      rows = await this.query(
        `insert into companies
           (id, provider, external_id, external_key, name, normalized_name, normalized_city,
            normalized_state, category, city, state, country, address, website, instagram, phone,
            whatsapp, email, description, services, signals, source_url)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20::jsonb,$21::jsonb,$22)
         on conflict (external_key) do update set last_seen_at = now(), updated_at = now()
         returning ${COMPANY_COLS}`,
        [
          this.uid(), input.provider, input.externalId, externalKey, input.name, nName, nCity, nState,
          input.category ?? null, input.city ?? null, input.state ?? null, input.country ?? null,
          input.address ?? null, input.website ?? null, input.instagram ?? null, input.phone ?? null,
          input.whatsapp ?? null, input.email ?? null, input.description ?? null, services, signals,
          input.sourceUrl ?? null,
        ]
      );
    }
    return rows[0];
  }

  async getCompany(id: string): Promise<CompanyRecord | null> {
    const rows = await this.query(`select ${COMPANY_COLS} from companies where id = $1 limit 1`, [id]);
    return rows[0] ?? null;
  }

  async getCompaniesByIds(ids: string[]): Promise<CompanyRecord[]> {
    if (!ids.length) return [];
    const rows = await this.query(
      `select ${COMPANY_COLS} from companies where id = any($1::uuid[])`,
      [ids]
    );
    const byId = new Map<string, CompanyRecord>(rows.map((r) => [r.id, r]));
    return ids.map((id) => byId.get(id)).filter(Boolean) as CompanyRecord[];
  }

  // ---------------- leads ----------------

  async createLead(userId: string, companyId: string): Promise<LeadRecord> {
    const existing = await this.getLeadByUserAndCompany(userId, companyId);
    if (existing) return existing;
    const rows = await this.query(
      `insert into leads (id, user_id, company_id) values ($1,$2,$3)
       on conflict (user_id, company_id) do nothing
       returning id, user_id as "userId", company_id as "companyId", status, favorite,
                 tags, created_at as "createdAt", updated_at as "updatedAt"`,
      [this.uid(), userId, companyId]
    );
    if (rows.length) return { ...rows[0], tags: rows[0].tags ?? [] };
    return (await this.getLeadByUserAndCompany(userId, companyId))!;
  }

  async getLead(id: string, userId: string): Promise<LeadRecord | null> {
    const rows = await this.query(
      `select id, user_id as "userId", company_id as "companyId", status, favorite, tags,
              created_at as "createdAt", updated_at as "updatedAt"
       from leads where id = $1 and user_id = $2 limit 1`,
      [id, userId]
    );
    return rows[0] ? { ...rows[0], tags: rows[0].tags ?? [] } : null;
  }

  async getLeadByUserAndCompany(userId: string, companyId: string): Promise<LeadRecord | null> {
    const rows = await this.query(
      `select id, user_id as "userId", company_id as "companyId", status, favorite, tags,
              created_at as "createdAt", updated_at as "updatedAt"
       from leads where user_id = $1 and company_id = $2 limit 1`,
      [userId, companyId]
    );
    return rows[0] ? { ...rows[0], tags: rows[0].tags ?? [] } : null;
  }

  async listLeads(userId: string): Promise<LeadRecord[]> {
    const rows = await this.query(
      `select id, user_id as "userId", company_id as "companyId", status, favorite, tags,
              created_at as "createdAt", updated_at as "updatedAt"
       from leads where user_id = $1 order by updated_at desc`,
      [userId]
    );
    return rows.map((r) => ({ ...r, tags: r.tags ?? [] }));
  }

  async updateLead(id: string, userId: string, patch: LeadUpdatePatch): Promise<LeadRecord | null> {
    const lead = await this.getLead(id, userId);
    if (!lead) return null;

    let tags = lead.tags;
    if (patch.addTags?.length) {
      for (const raw of patch.addTags) {
        const tag = raw.trim().replace(/\s+/g, " ");
        if (tag && !tags.some((t) => t.toLowerCase() === tag.toLowerCase())) {
          tags = [...tags, tag];
          await this.query(
            `insert into tags (id, user_id, name) values ($1,$2,$3)
             on conflict (user_id, name) do nothing`,
            [this.uid(), userId, tag]
          );
          const tagRow = await this.query<{ id: string }>(
            `select id from tags where user_id = $1 and name = $2`,
            [userId, tag]
          );
          if (tagRow[0]) {
            await this.query(
              `insert into lead_tags (lead_id, tag_id) values ($1,$2) on conflict do nothing`,
              [id, tagRow[0].id]
            );
          }
        }
      }
    }
    if (patch.removeTags?.length) {
      const lower = new Set(patch.removeTags.map((t) => t.toLowerCase()));
      tags = tags.filter((t) => !lower.has(t.toLowerCase()));
      await this.query(
        `delete from lead_tags where lead_id = $1 and tag_id in (
           select t.id from tags t where t.user_id = $2 and lower(t.name) = any($3::text[]))`,
        [id, userId, Array.from(lower)]
      );
    }

    const rows = await this.query(
      `update leads set
         status = coalesce($3, status), favorite = coalesce($4, favorite), tags = $5::jsonb, updated_at = now()
       where id = $1 and user_id = $2
       returning id, user_id as "userId", company_id as "companyId", status, favorite, tags,
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [id, userId, patch.status ?? null, patch.favorite ?? null, JSON.stringify(tags)]
    );
    return rows[0] ? { ...rows[0], tags: rows[0].tags ?? [] } : null;
  }

  async deleteLead(id: string, userId: string): Promise<boolean> {
    const rows = await this.query(`delete from leads where id = $1 and user_id = $2 returning id`, [
      id,
      userId,
    ]);
    return rows.length > 0;
  }

  // ---------------- notes ----------------

  async addNote(userId: string, leadId: string, content: string): Promise<NoteRecord> {
    const rows = await this.query(
      `insert into notes (id, lead_id, user_id, content) values ($1,$2,$3,$4)
       returning id, lead_id as "leadId", user_id as "userId", content, created_at as "createdAt"`,
      [this.uid(), leadId, userId, content]
    );
    return rows[0];
  }

  async deleteNote(userId: string, leadId: string, noteId: string): Promise<boolean> {
    const rows = await this.query(
      `delete from notes where id = $1 and lead_id = $2 and user_id = $3 returning id`,
      [noteId, leadId, userId]
    );
    return rows.length > 0;
  }

  async listNotes(userId: string, leadId?: string): Promise<NoteRecord[]> {
    const rows = await this.query(
      `select id, lead_id as "leadId", user_id as "userId", content, created_at as "createdAt"
       from notes where user_id = $1 ${leadId ? "and lead_id = $2" : ""}
       order by created_at asc`,
      leadId ? [userId, leadId] : [userId]
    );
    return rows;
  }

  // ---------------- favorites ----------------

  async listFavorites(userId: string): Promise<FavoriteRecord[]> {
    return this.query(
      `select id, user_id as "userId", company_id as "companyId", created_at as "createdAt"
       from favorites where user_id = $1 order by created_at desc`,
      [userId]
    );
  }

  async getFavorite(userId: string, companyId: string): Promise<FavoriteRecord | null> {
    const rows = await this.query(
      `select id, user_id as "userId", company_id as "companyId", created_at as "createdAt"
       from favorites where user_id = $1 and company_id = $2 limit 1`,
      [userId, companyId]
    );
    return rows[0] ?? null;
  }

  async setFavorite(userId: string, companyId: string, favorite: boolean): Promise<FavoriteRecord> {
    if (favorite) {
      const rows = await this.query(
        `insert into favorites (id, user_id, company_id) values ($1,$2,$3)
         on conflict (user_id, company_id) do nothing
         returning id, user_id as "userId", company_id as "companyId", created_at as "createdAt"`,
        [this.uid(), userId, companyId]
      );
      return rows[0] ?? (await this.getFavorite(userId, companyId))!;
    }
    await this.query(`delete from favorites where user_id = $1 and company_id = $2`, [userId, companyId]);
    return { id: "", userId, companyId, createdAt: new Date().toISOString() };
  }

  async removeFavorite(userId: string, companyId: string): Promise<boolean> {
    const rows = await this.query(
      `delete from favorites where user_id = $1 and company_id = $2 returning id`,
      [userId, companyId]
    );
    return rows.length > 0;
  }

  // ---------------- tags ----------------

  async listTags(userId: string): Promise<TagRecord[]> {
    return this.query(
      `select id, user_id as "userId", name, created_at as "createdAt"
       from tags where user_id = $1 order by name asc`,
      [userId]
    );
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
    const rows = await this.query(
      `insert into searches (id, user_id, segment, city, state, country, provider, result_count)
       values ($1,$2,$3,$4,$5,$6,$7,$8)
       returning id, user_id as "userId", segment, city, state, country, provider,
                 result_count as "resultCount", created_at as "createdAt"`,
      [this.uid(), input.userId, input.segment, input.city, input.state, input.country, input.provider, input.resultCount]
    );
    return rows[0];
  }

  async listSearches(userId: string, limit = 10): Promise<SearchRecord[]> {
    return this.query(
      `select id, user_id as "userId", segment, city, state, country, provider,
              result_count as "resultCount", created_at as "createdAt"
       from searches where user_id = $1 order by created_at desc limit $2`,
      [userId, limit]
    );
  }

  // ---------------- LGPD ----------------

  async deleteUserData(userId: string): Promise<void> {
    await this.query(`delete from leads where user_id = $1`, [userId]); // cascade: notes/lead_tags
    await this.query(`delete from favorites where user_id = $1`, [userId]);
    await this.query(`delete from searches where user_id = $1`, [userId]);
    await this.query(`delete from tags where user_id = $1`, [userId]);
  }

  async exportUserData(userId: string): Promise<Record<string, unknown>> {
    const [user] = await this.query(
      `select name, email, created_at as "createdAt" from users where id = $1`,
      [userId]
    );
    return {
      exportedAt: new Date().toISOString(),
      user: user ?? null,
      leads: await this.query(`select * from leads where user_id = $1`, [userId]),
      notes: await this.query(`select * from notes where user_id = $1`, [userId]),
      favorites: await this.query(`select * from favorites where user_id = $1`, [userId]),
      searches: await this.query(`select * from searches where user_id = $1`, [userId]),
      tags: await this.query(`select * from tags where user_id = $1`, [userId]),
    };
  }
}
