import path from "node:path";
import { env } from "@/lib/env";
import { JsonStore } from "./json-store";
import { PgStore } from "./pg-store";
import type { Store } from "./types";

let instance: Store | null = null;

/** URL efetiva do Postgres: aceita DATABASE_URL ou SUPABASE_DB_URL. */
export function effectiveDatabaseUrl(): string {
  return env.databaseUrl || env.supabaseDbUrl;
}

/** Parece uma Connection String Postgres? */
export function looksLikePostgresUrl(url: string | undefined): boolean {
  return /^postgres(ql)?:\/\//i.test(url ?? "");
}

/** Modo de armazenamento efetivo (para exibição na UI). */
export function storeInfo(): {
  mode: "postgres" | "json";
  databaseConfigured: boolean;
  usingSupabase: boolean;
} {
  const url = effectiveDatabaseUrl();
  const isPg = env.store === "postgres" || (looksLikePostgresUrl(url) && env.store !== "json");
  const configured = Boolean(url);
  return {
    mode: isPg && configured ? "postgres" : "json",
    databaseConfigured: configured,
    usingSupabase: /supabase/i.test(url ?? ""),
  };
}

/**
 * Retorna a implementação de persistência ativa:
 *
 * - DATABASE_URL (ou SUPABASE_DB_URL) definida → PostgreSQL/Supabase.
 *   As tabelas são criadas automaticamente na primeira conexão.
 * - Caso contrário → arquivo JSON local (dev, zero configuração).
 *
 * Para forçar o JSON mesmo com DATABASE_URL definida, use STORE=json.
 */
export function getStore(): Store {
  if (instance) return instance;

  const url = effectiveDatabaseUrl();
  const wantsPg = env.store === "postgres" || (looksLikePostgresUrl(url) && env.store !== "json");

  if (wantsPg && url) {
    instance = new PgStore(url);
    return instance;
  }
  if (wantsPg && !url) {
    console.warn(
      "[Orça Prospect] STORE=postgres definido sem DATABASE_URL. " +
        "Cole a Connection String do Supabase em DATABASE_URL. Usando JSON local por enquanto."
    );
  }
  instance = new JsonStore(path.resolve(process.cwd(), env.dataDir));
  return instance;
}

export type { Store };
