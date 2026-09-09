import { ArrowRight, Building2, Clock, Columns3, Search, Sparkles, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { getSessionUser } from "@/lib/auth";
import { scoreCompany } from "@/lib/score";
import { getStore, isStoreError } from "@/lib/store";
import { LEAD_STATUS_LABELS } from "@/types";
import type { LeadStatus } from "@/types";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const store = getStore();
  let leads, favorites, searches;
  try {
    [leads, favorites, searches] = await Promise.all([
      store.listLeads(user.id),
      store.listFavorites(user.id),
      store.listSearches(user.id, 6),
    ]);
  } catch (error) {
    if (isStoreError(error)) {
      const params = new URLSearchParams({ msg: error.message });
      if (error.hint) params.set("hint", error.hint);
      redirect(`/database-error?${params.toString()}`);
    }
    throw error;
  }

  const companies = leads.length
    ? await store.getCompaniesByIds(leads.map((l) => l.companyId))
    : [];
  const companyById = new Map(companies.map((c) => [c.id, c]));
  const highPotential = leads.filter((l) => {
    const c = companyById.get(l.companyId);
    if (!c) return false;
    return scoreCompany({ signals: c.signals, category: c.category, name: c.name }).score >= 70;
  }).length;

  const byStatus = new Map<LeadStatus, number>();
  for (const l of leads) {
    byStatus.set(l.status, (byStatus.get(l.status) ?? 0) + 1);
  }
  const maxStatus = Math.max(1, ...byStatus.values());

  const firstName = user.name.split(/\s+/)[0];
  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Olá, {firstName} 👋
        </h1>
        <p className="mt-1 text-sm capitalize text-slate-500">{today}</p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Leads salvos" value={leads.length} icon={Columns3} tone="indigo" />
        <StatCard label="Favoritos" value={favorites.length} icon={Star} tone="amber" />
        <StatCard label="Alto potencial" value={highPotential} icon={Sparkles} tone="emerald" sub="Score 70+ entre seus leads" />
        <StatCard label="Pesquisas recentes" value={searches.length} icon={Search} tone="sky" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Busca rápida */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Encontrar empresas</CardTitle>
          </CardHeader>
          <CardContent>
            <form action="/search" method="get" className="space-y-4">
              <Field label="Segmento ou palavra-chave">
                <Input
                  name="segment"
                  placeholder='Ex.: "Marcenaria", "Serralheria", "Clínica odontológica"'
                  maxLength={80}
                  required
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Cidade">
                  <Input name="city" placeholder="Santo André" maxLength={80} />
                </Field>
                <Field label="Estado" hint="UF (ex.: SP) ou nome do estado">
                  <Input name="state" placeholder="SP" maxLength={40} />
                </Field>
              </div>
              <Button type="submit" className="w-full sm:w-auto">
                <Search className="h-4 w-4" aria-hidden />
                Encontrar empresas
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Pipeline */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Pipeline de leads</CardTitle>
            <Link href="/leads" className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
              Ver CRM
            </Link>
          </CardHeader>
          <CardContent>
            {leads.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                Nenhum lead ainda — salve empresas a partir da busca.
              </p>
            ) : (
              <ul className="space-y-3">
                {(Object.keys(LEAD_STATUS_LABELS) as LeadStatus[]).map((status) => {
                  const count = byStatus.get(status) ?? 0;
                  return (
                    <li key={status} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 text-sm text-slate-600">
                        {LEAD_STATUS_LABELS[status]}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{ width: `${(count / maxStatus) * 100}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-sm font-semibold text-slate-800">{count}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Pesquisas recentes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pesquisas recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {searches.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="Nenhuma pesquisa ainda"
                description="Suas buscas aparecerão aqui para repetir rapidamente."
                className="border-0 bg-transparent py-6"
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {searches.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/search?segment=${encodeURIComponent(s.segment)}&city=${encodeURIComponent(s.city)}&state=${encodeURIComponent(s.state)}`}
                      className="flex items-center justify-between gap-2 py-2.5 text-sm transition hover:text-indigo-700"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                        <span className="truncate font-medium text-slate-700">{s.segment}</span>
                        <span className="truncate text-slate-400">
                          {[s.city, s.state].filter(Boolean).join(", ")}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-slate-400">{s.resultCount} resultados</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Comece por aqui */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>{leads.length === 0 ? "Comece por aqui" : "Dicas de prospecção"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              <li className="flex gap-3 text-sm text-slate-600">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">1</span>
                <span>
                  Busque por um segmento que costuma trabalhar com orçamentos personalizados
                  (marcenaria, serralheria, vidraçaria, estética…).
                </span>
              </li>
              <li className="flex gap-3 text-sm text-slate-600">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">2</span>
                <span>
                  Priorize empresas com <strong>score alto</strong> e canais de contato disponíveis
                  (WhatsApp, site, e-mail).
                </span>
              </li>
              <li className="flex gap-3 text-sm text-slate-600">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">3</span>
                <span>Salve como lead, organize por status e tags, e contate manualmente — sem disparos automáticos.</span>
              </li>
            </ol>
            <Link href="/search" className={buttonClasses("secondary", "md", "mt-6")}>
              <Building2 className="h-4 w-4" aria-hidden />
              Encontrar empresas
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
