"use client";

import { Check, Database, Download, Info, KeyRound, ShieldCheck, Trash2, User, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { api, downloadFile } from "@/lib/api-client";
import type { ProviderStatus } from "@/types";

interface SettingsProps {
  user: { name: string; email: string };
  providers: ProviderStatus[];
  config: {
    authMode: "supabase" | "local";
    storeMode: "postgres" | "json";
    usingSupabase: boolean;
    databaseConfigured: boolean;
    demoMode: boolean;
    osmEnabled: boolean;
    googleConfigured: boolean;
    customConfigured: boolean;
    sessionSecretSet: boolean;
    supabaseUrlSet: boolean;
    supabaseAnonKeySet: boolean;
    supabaseServiceKeySet: boolean;
  };
}

export function SettingsClient({ user, providers, config }: SettingsProps) {
  const { success, error: toastError, info } = useToast();

  // perfil
  const [name, setName] = useState(user.name);
  const [savingName, setSavingName] = useState(false);

  // senha
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // dados
  const [wipeOpen, setWipeOpen] = useState(false);
  const [wiping, setWiping] = useState(false);
  const [exporting, setExporting] = useState(false);

  const saveName = async () => {
    setSavingName(true);
    try {
      await api("/api/account", { method: "PATCH", body: JSON.stringify({ name }) });
      success("Perfil atualizado. Recarregando…");
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Erro ao salvar perfil.");
    } finally {
      setSavingName(false);
    }
  };

  const savePassword = async () => {
    setSavingPassword(true);
    try {
      await api("/api/account", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      success("Senha alterada com sucesso.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Erro ao alterar senha.");
    } finally {
      setSavingPassword(false);
    }
  };

  const exportData = async () => {
    setExporting(true);
    try {
      await downloadFile("/api/account/export", "orca-prospect-meus-dados.json");
      success("Download iniciado.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Erro ao exportar dados.");
    } finally {
      setExporting(false);
    }
  };

  const wipeData = async () => {
    setWiping(true);
    try {
      await api("/api/account/data", { method: "DELETE" });
      setWipeOpen(false);
      success("Todos os seus dados de prospecção foram apagados.");
      setTimeout(() => window.location.reload(), 900);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Erro ao apagar dados.");
    } finally {
      setWiping(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Configurações</h1>
        <p className="mt-1 text-sm text-slate-500">Perfil, fonte de dados e privacidade.</p>
      </div>

      {config.demoMode && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">Modo demonstração ativo</p>
          <p className="mt-1">
            As buscas retornam <strong>empresas fictícias</strong> claramente identificadas
            (“DADOS DE DEMONSTRAÇÃO”). Para dados reais, configure <code className="rounded bg-amber-100 px-1">DEMO_MODE=false</code>{" "}
            e uma fonte (Google Places, OpenStreetMap ou provider customizado) no arquivo{" "}
            <code className="rounded bg-amber-100 px-1">.env.local</code>.
          </p>
        </div>
      )}

      {/* Perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" aria-hidden /> Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome">
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
            </Field>
            <Field label="E-mail" hint="O e-mail de acesso não pode ser alterado no MVP.">
              <Input value={user.email} disabled />
            </Field>
          </div>
          <Button onClick={saveName} loading={savingName} disabled={name.trim().length < 2 || name === user.name}>
            Salvar perfil
          </Button>
        </CardContent>
      </Card>

      {/* Senha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-slate-400" aria-hidden /> Alterar senha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Senha atual">
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Field>
            <Field label="Nova senha" hint="Mínimo de 8 caracteres.">
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                autoComplete="new-password"
              />
            </Field>
          </div>
          <Button
            onClick={savePassword}
            loading={savingPassword}
            disabled={newPassword.length < 8 || !currentPassword}
          >
            Alterar senha
          </Button>
        </CardContent>
      </Card>

      {/* Fonte de dados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-4 w-4 text-slate-400" aria-hidden /> Fonte de dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="divide-y divide-slate-100">
            {providers.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    {p.label}
                    {p.active && <Badge tone="indigo">ativa</Badge>}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{p.description}</p>
                  <p className="mt-1 font-mono text-[11px] text-slate-400">{p.envVars.join(" · ")}</p>
                </div>
                <span
                  className={
                    p.configured
                      ? "inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200"
                      : "inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-inset ring-slate-200"
                  }
                >
                  {p.configured ? <Check className="h-3.5 w-3.5" aria-hidden /> : <X className="h-3.5 w-3.5" aria-hidden />}
                  {p.configured ? "Configurada" : "Não configurada"}
                </span>
              </li>
            ))}
          </ul>
          <div className="rounded-xl bg-slate-50 p-3.5 ring-1 ring-inset ring-slate-200">
            <p className="text-xs font-semibold text-slate-600">Exemplo de configuração (.env.local):</p>
            <pre className="mt-2 overflow-x-auto whitespace-pre text-[11px] leading-relaxed text-slate-600">
{`# Google Places (dados reais, requer chave)
GOOGLE_MAPS_API_KEY=sua-chave
DEMO_MODE=false

# ou OpenStreetMap (gratuito, sem chave)
OSM_ENABLED=true
DEMO_MODE=false

# ou modo demonstração (empresas fictícias)
DEMO_MODE=true`}
            </pre>
            <p className="mt-2 text-[11px] text-slate-400">
              Reinicie o servidor (<code>npm run dev</code>) após alterar variáveis.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Privacidade / LGPD */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-slate-400" aria-hidden /> Privacidade e dados (LGPD)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-600">
            Seus dados de prospecção (leads, favoritos, notas, tags e pesquisas) são seus. Você pode
            exportá-los a qualquer momento (portabilidade) ou apagá-los definitivamente (direito de
            eliminação). A senha é armazenada apenas como hash criptográfico.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={exportData} loading={exporting}>
              <Download className="h-4 w-4" aria-hidden /> Exportar meus dados (JSON)
            </Button>
            <Button variant="danger" onClick={() => setWipeOpen(true)}>
              <Trash2 className="h-4 w-4" aria-hidden /> Apagar meus dados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Banco de dados e ambiente */}
      <Card>
        <CardHeader>
          <CardTitle>Banco de dados e ambiente</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2.5 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              {config.databaseConfigured ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
              ) : (
                <X className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              )}
              <span>
                <strong>Banco de dados:</strong>{" "}
                {config.databaseConfigured ? (
                  <>
                    PostgreSQL {config.usingSupabase ? "(Supabase)" : ""} conectado via{" "}
                    <code className="rounded bg-slate-100 px-1">DATABASE_URL</code>. As tabelas são
                    criadas automaticamente na primeira execução.
                  </>
                ) : (
                  <>
                    Arquivo JSON local (<code className="rounded bg-slate-100 px-1">.data</code>) —
                    funciona para uso no computador. Para deploy (Vercel), configure o Supabase em{" "}
                    <code className="rounded bg-slate-100 px-1">DATABASE_URL</code> (veja o README,
                    seção “Supabase passo a passo”).
                  </>
                )}
              </span>
            </li>
            <li className="flex items-start gap-2">
              {config.sessionSecretSet ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
              ) : (
                <X className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
              )}
              <span>
                SESSION_SECRET {config.sessionSecretSet ? "configurado" : "não definido (obrigatório em produção — gere com openssl rand -hex 32)"}
              </span>
            </li>
            <li className="flex items-start gap-2">
              {config.authMode === "supabase" ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" aria-hidden />
              ) : (
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              )}
              <span>
                <strong>Contas (login):</strong>{" "}
                {config.authMode === "supabase"
                  ? "Supabase Auth ativo — as contas (sua e do seu sócio) ficam hospedadas no Supabase, via NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY. Cada pessoa cria a própria conta na tela de login."
                  : "modo local — contas salvas no banco do próprio app. Para contas na nuvem do Supabase (ideal para você + sócio), defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (README, seção 10)."}
                {config.supabaseServiceKeySet
                  ? " SUPABASE_SERVICE_ROLE_KEY presente (não é usada pelo app)."
                  : ""}
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={wipeOpen}
        title="Apagar todos os meus dados"
        message="Todos os leads, favoritos, observações, tags e pesquisas serão excluídos definitivamente. Esta ação não pode ser desfeita."
        confirmLabel="Apagar tudo"
        cancelLabel="Manter meus dados"
        danger
        loading={wiping}
        onConfirm={wipeData}
        onCancel={() => setWipeOpen(false)}
      />
    </div>
  );
}
