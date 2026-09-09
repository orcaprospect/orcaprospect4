/**
 * Configuração do Supabase Auth (contas).
 * Lê process.env diretamente para poder ser usada também no middleware (edge).
 */
export function supabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || "";
}

export function supabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
}

/** URL + Anon Key definidas? → contas gerenciadas pelo Supabase Auth. */
export function supabaseAuthConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseAnonKey());
}

export type AuthMode = "supabase" | "local";

/** Modo de autenticação em uso. */
export function authMode(): AuthMode {
  return supabaseAuthConfigured() ? "supabase" : "local";
}
