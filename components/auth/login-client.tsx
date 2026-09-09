"use client";

import { ArrowRight, MailCheck, Rocket, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";

type Mode = "login" | "register";

interface LoginClientProps {
  demoMode: boolean;
  authMode: "supabase" | "local";
}

export function LoginClient({ demoMode, authMode }: LoginClientProps) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";

  const [mode, setMode] = useState<Mode>("login");
  const [firstAccess, setFirstAccess] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  // Primeiro acesso: se ainda não existe nenhum usuário, abre direto
  // em "Criar conta" com uma orientação visível.
  useEffect(() => {
    let active = true;
    api<{ hasUsers: boolean }>("/api/auth/status")
      .then((s) => {
        if (!active) return;
        if (!s.hasUsers) {
          setFirstAccess(true);
          setMode("register");
        }
      })
      .catch(() => {
        // sem informação: mantém a aba Entrar
      });
    return () => {
      active = false;
    };
  }, []);

  const go = () => {
    router.replace(next);
    router.refresh();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "register") {
        await api("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        });
      } else {
        await api("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
      }
      go();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async () => {
    setError(null);
    setDemoLoading(true);
    try {
      await api("/api/auth/demo", { method: "POST" });
      go();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado. Tente novamente.");
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900">
            ← Voltar ao site
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {mode === "login" ? "Entrar no Orça Prospect" : "Criar sua conta"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {mode === "login"
                ? "Acesse seu painel de prospecção."
                : "Comece a organizar seus leads do OrçaAI."}
            </p>

            {/* Alternar modo */}
            <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1" role="tablist">
              {(["login", "register"] as Mode[]).map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => {
                    setMode(m);
                    setError(null);
                  }}
                  className={
                    mode === m
                      ? "rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm"
                      : "rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700"
                  }
                >
                  {m === "login" ? "Entrar" : "Criar conta"}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="mt-5 space-y-4">
              {mode === "register" && (
                <Field label="Nome">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    maxLength={80}
                    required
                    autoComplete="name"
                  />
                </Field>
              )}
              <Field label="E-mail">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@empresa.com.br"
                  maxLength={120}
                  required
                  autoComplete="email"
                />
              </Field>
              <Field
                label="Senha"
                hint={mode === "register" ? "Mínimo de 8 caracteres." : undefined}
              >
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  maxLength={100}
                  required
                  minLength={mode === "register" ? 8 : undefined}
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                />
              </Field>

              {error && (
                <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" loading={loading}>
                {mode === "login" ? "Entrar" : "Criar conta"}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </form>

            {demoMode && authMode === "local" && (
              <>
                <div className="my-5 flex items-center gap-3">
                  <span className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs uppercase tracking-wide text-slate-400">ou</span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
                <Button variant="secondary" className="w-full" onClick={demoLogin} loading={demoLoading}>
                  <Sparkles className="h-4 w-4 text-amber-500" aria-hidden />
                  Entrar com conta de demonstração
                </Button>
                <p className="mt-2 text-center text-xs text-slate-400">
                  Conta local para testar com dados de demonstração.
                </p>
              </>
            )}
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">
            Ao continuar você concorda com nossa{" "}
            <Link href="/privacidade" className="underline hover:text-slate-600">
              política de privacidade
            </Link>
            . Não enviamos mensagens automáticas às empresas.
          </p>
        </div>
      </main>
    </div>
  );
}
