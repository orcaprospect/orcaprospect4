import path from "node:path";
import { env } from "@/lib/env";
import { JsonStore } from "./json-store";
import { PgStore } from "./pg-store";
import type { Store } from "./types";

let instance: Store | null = null;

/**
 * Retorna a implementação de persistência ativa:
 * - STORE=postgres + DATABASE_URL → PostgreSQL/Supabase (requer `npm i pg`)
 * - padrão → arquivo JSON local em DATA_DIR (dev / self-host)
 */
export function getStore(): Store {
  if (instance) return instance;

  if (env.store === "postgres" && env.databaseUrl) {
    instance = new PgStore(env.databaseUrl);
    return instance;
  }
  if (env.store === "postgres" && !env.databaseUrl) {
    console.warn(
      "[Orça Prospect] STORE=postgres definido sem DATABASE_URL. Usando armazenamento JSON local."
    );
  }
  instance = new JsonStore(path.resolve(process.cwd(), env.dataDir));
  return instance;
}

export type { Store };
