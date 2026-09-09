import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAnonKey, supabaseUrl } from "./config";

/**
 * Cliente Supabase para Route Handlers e Server Components (Next 14).
 * A sessão vive em cookies httpOnly gerenciados pelo Supabase Auth.
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options?: CookieOptions }[]
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Chamado de um Server Component (cookies somente leitura).
          // O refresh de tokens é feito no middleware.
        }
      },
    },
  });
}
