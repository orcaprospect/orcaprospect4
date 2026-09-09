import { Database, LogOut, RefreshCw } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/layout/logo";
import { buttonClasses } from "@/components/ui/button";
import { env } from "@/lib/env";
import { storeInfo } from "@/lib/store";

export const metadata: Metadata = { title: "Banco de dados indisponível" };
export const dynamic = "force-dynamic";

/**
 * Página amigável exibida quando o armazenamento (PostgreSQL/Supabase ou
 * arquivo local) falha — substitui a tela genérica de erro para falhas
 * de infraestrutura, com o checklist de correção.
 */
export default function DatabaseErrorPage({
  searchParams,
}: {
  searchParams: { msg?: string; hint?: string };
}) {
  const db = storeInfo();
  const msg = (searchParams.msg ?? "").slice(0, 300);
  const hint = (searchParams.hint ?? "").slice(0, 500);

  const checks: Array<[boolean | string, string]> = [
    [
      db.databaseConfigured,
      db.databaseConfigured
        ? "DATABASE_URL está definida ✓ — verifique se a senha foi substituída (sem [YOUR-PASSWORD]) e se caracteres especiais estão codificados (@ → %40)."
        : "DATABASE_URL NÃO está definida. No seu computador o modo arquivo funciona; em deploy (Vercel) é obrigatório configurar o Supabase (README, seção 10).",
    ],
    [
      env.store !== "postgres" || db.databaseConfigured,
      env.store === "postgres"
        ? "STORE=postgres — a DATABASE_URL precisa estar correta e o banco acessível."
        : "STORE=json — os dados gravam em arquivos locais (DATA_DIR); confira permissões da pasta.",
    ],
    [
      env.sessionSecretSet || env.nodeEnv !== "production",
      env.sessionSecretSet
        ? "SESSION_SECRET definido ✓"
        : "SESSION_SECRET não definido — em produção gere com: openssl rand -hex 32",
    ],
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="mb-6 flex justify-center">
          <LogoMark className="h-10 w-10" />
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
            <Database className="h-6 w-6" aria-hidden />
          </span>
          <h1 className="mt-4 text-xl font-bold text-slate-900 sm:text-2xl">
            Não foi possível acessar o banco de dados
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Sua conta está OK — o problema é a conexão com o armazenamento
            {db.usingSupabase ? " (Supabase)" : ""}. Veja o checklist abaixo.
          </p>

          {msg && (
            <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 ring-1 ring-inset ring-rose-200">
              {msg}
            </p>
          )}
          {hint && (
            <p className="mt-2 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900 ring-1 ring-inset ring-amber-200">
              <strong>Como corrigir:</strong> {hint}
            </p>
          )}

          <ul className="mt-5 space-y-3">
            {checks.map(([ok, text], i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                <span
                  className={
                    ok
                      ? "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700"
                      : "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700"
                  }
                  aria-hidden
                >
                  {ok ? "✓" : "!"}
                </span>
                {text}
              </li>
            ))}
          </ul>

          <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
            Passo a passo completo do Supabase (onde clicar, as 3 credenciais):
            README.md → seção 10. Após corrigir o <code>.env.local</code>, reinicie
            com <code>npm run dev</code> (ou faça Redeploy na Vercel).
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/dashboard" className={buttonClasses("primary")}>
              <RefreshCw className="h-4 w-4" aria-hidden /> Tentar novamente
            </Link>
            <Link href="/logout" className={buttonClasses("secondary")}>
              <LogOut className="h-4 w-4" aria-hidden /> Sair
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
