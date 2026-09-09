/**
 * Acesso centralizado às variáveis de ambiente (somente server-side).
 * Nenhuma chave secreta deve ser lida no navegador.
 */

function boolEnv(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === "") return fallback;
  return ["1", "true", "yes", "on", "sim"].includes(value.toLowerCase());
}

export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  nodeEnv: process.env.NODE_ENV || "development",
  sessionSecret: process.env.SESSION_SECRET || "",
  sessionSecretSet: Boolean(process.env.SESSION_SECRET),

  store: (process.env.STORE || "json").toLowerCase(),
  databaseUrl: process.env.DATABASE_URL || "",
  dataDir: process.env.DATA_DIR || ".data",

  dataProvider: (process.env.DATA_PROVIDER || "auto").toLowerCase(),
  googleKey: process.env.GOOGLE_MAPS_API_KEY || "",
  osmEnabled: boolEnv(process.env.OSM_ENABLED, true),
  demoMode: boolEnv(process.env.DEMO_MODE, false),
  customUrl: process.env.CUSTOM_PROVIDER_URL || "",
  customKey: process.env.CUSTOM_PROVIDER_API_KEY || "",
  searchMaxResults: Math.min(Math.max(Number(process.env.SEARCH_MAX_RESULTS) || 60, 10), 60),
} as const;

export type AppEnv = typeof env;
