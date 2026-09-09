"use client";

import {
  AlertCircle,
  Building2,
  Database,
  Filter,
  Info,
  Mail,
  RotateCcw,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CompanyCard } from "@/components/shared/company-card";
import { CompanyModal } from "@/components/shared/company-modal";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { SkeletonCards } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";
import { cn, hasContact } from "@/lib/utils";
import type { CompanyView, LeadView, ProviderStatus } from "@/types";

const PAGE_SIZE = 12;

interface SearchResponse {
  status: "ok" | "unconfigured";
  provider?: { id: string; label: string; demo: boolean };
  results?: CompanyView[];
  notice?: string | null;
  message?: string;
  providers?: ProviderStatus[];
  disclaimer?: string;
}

interface Filters {
  minScore: 0 | 40 | 70;
  website: boolean;
  whatsapp: boolean;
  instagram: boolean;
  email: boolean;
  phone: boolean;
}

const EMPTY_FILTERS: Filters = { minScore: 0, website: false, whatsapp: false, instagram: false, email: false, phone: false };

export function SearchClient() {
  const { success, error: toastError, info } = useToast();
  const router = useRouter();
  const sp = useSearchParams();

  const [form, setForm] = useState({
    segment: sp.get("segment") ?? "",
    city: sp.get("city") ?? "",
    state: sp.get("state") ?? "",
  });
  const [results, setResults] = useState<CompanyView[] | null>(null);
  const [meta, setMeta] = useState<SearchResponse["provider"] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [unconfigured, setUnconfigured] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<CompanyView | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const ranFor = useRef<string>("");

  const runSearch = useCallback(
    async (q: { segment: string; city: string; state: string }) => {
      setLoading(true);
      setError(null);
      setUnconfigured(null);
      setNotice(null);
      setPage(1);
      try {
        const data = await api<SearchResponse>("/api/search", {
          method: "POST",
          body: JSON.stringify(q),
        });
        if (data.status === "unconfigured") {
          setUnconfigured(data.message ?? "Fonte de dados não configurada.");
          setResults(null);
          setMeta(null);
          return;
        }
        setResults(data.results ?? []);
        setMeta(data.provider ?? null);
        setNotice(data.notice ?? null);
      } catch (err) {
        setResults(null);
        setMeta(null);
        setError(err instanceof Error ? err.message : "Erro inesperado na busca.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Executa busca automática ao chegar com ?segment=... (dashboard/histórico)
  useEffect(() => {
    const key = sp.toString();
    const segment = sp.get("segment");
    if (segment && key && key !== ranFor.current) {
      ranFor.current = key;
      const q = {
        segment,
        city: sp.get("city") ?? "",
        state: sp.get("state") ?? "",
      };
      setForm(q);
      void runSearch(q);
    }
  }, [sp, runSearch]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qs = new URLSearchParams();
    if (form.segment.trim()) qs.set("segment", form.segment.trim());
    if (form.city.trim()) qs.set("city", form.city.trim());
    if (form.state.trim()) qs.set("state", form.state.trim());
    ranFor.current = qs.toString();
    router.replace(qs.toString() ? `/search?${qs.toString()}` : "/search", { scroll: false });
    void runSearch(form);
  };

  const filtered = useMemo(() => {
    if (!results) return [];
    return results.filter((c) => {
      if (filters.minScore && c.score < filters.minScore) return false;
      if (filters.website && !c.website) return false;
      if (filters.whatsapp && !c.whatsapp) return false;
      if (filters.instagram && !c.instagram) return false;
      if (filters.email && !c.email) return false;
      if (filters.phone && !c.phone) return false;
      return true;
    });
  }, [results, filters]);

  useEffect(() => setPage(1), [filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => {
    if (!results) return null;
    return [
      { label: "Empresas encontradas", value: results.length, icon: Building2, tone: "indigo" as const },
      { label: "Leads de alto potencial", value: results.filter((c) => c.score >= 70).length, icon: Sparkles, tone: "emerald" as const },
      { label: "Favoritos", value: results.filter((c) => c.isFavorite).length, icon: Star, tone: "amber" as const },
      { label: "Contatos disponíveis", value: results.filter(hasContact).length, icon: Mail, tone: "sky" as const },
    ];
  }, [results]);

  const updateCompany = (id: string, patch: Partial<CompanyView>) => {
    setResults((prev) => prev?.map((c) => (c.id === id ? { ...c, ...patch } : c)) ?? null);
    setViewing((v) => (v && v.id === id ? { ...v, ...patch } : v));
  };

  const saveLead = async (c: CompanyView) => {
    setSavingId(c.id);
    try {
      const res = await api<{ already: boolean; leadId: string; status: LeadView["status"] }>(
        "/api/leads",
        { method: "POST", body: JSON.stringify({ companyId: c.id }) }
      );
      updateCompany(c.id, { leadId: res.leadId, leadStatus: res.status });
      success(res.already ? "Este lead já estava salvo." : "Lead salvo no status “Novo”.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Erro ao salvar lead.");
    } finally {
      setSavingId(null);
    }
  };

  const toggleFavorite = async (c: CompanyView) => {
    try {
      const res = await api<{ favorite: boolean }>("/api/favorites", {
        method: "POST",
        body: JSON.stringify({ companyId: c.id }),
      });
      updateCompany(c.id, { isFavorite: res.favorite });
      info(res.favorite ? "Salvo nos favoritos." : "Removido dos favoritos.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Erro ao favoritar.");
    }
  };

  const activeFilterCount =
    (filters.minScore ? 1 : 0) +
    Number(filters.website) +
    Number(filters.whatsapp) +
    Number(filters.instagram) +
    Number(filters.email) +
    Number(filters.phone);

  const toggle = (key: keyof Omit<Filters, "minScore">) =>
    setFilters((f) => ({ ...f, [key]: !f[key] }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="max-w-2xl text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Encontre empresas que precisam automatizar seus orçamentos
        </h1>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">
          Descubra potenciais clientes para o OrçaAI com filtros inteligentes.
        </p>
      </div>

      {/* Barra de pesquisa */}
      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5"
      >
        <div className="grid gap-4 lg:grid-cols-4">
          <Field label="Segmento ou palavra-chave" className="lg:col-span-2">
            <Input
              value={form.segment}
              onChange={(e) => setForm((f) => ({ ...f, segment: e.target.value }))}
              placeholder='Ex.: "Marcenaria", "Clínica odontológica"'
              maxLength={80}
              required
            />
          </Field>
          <Field label="Cidade">
            <Input
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              placeholder="Santo André"
              maxLength={80}
            />
          </Field>
          <Field label="Estado" hint="UF (ex.: SP)">
            <Input
              value={form.state}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
              placeholder="SP"
              maxLength={40}
            />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button type="submit" loading={loading} className="sm:min-w-[190px]">
            <Search className="h-4 w-4" aria-hidden />
            Encontrar empresas
          </Button>
          <span className="text-xs text-slate-400">
            Usamos apenas APIs autorizadas — sem scraping invasivo.
          </span>
        </div>
      </form>

      {/* Banner: fonte não configurada */}
      {unconfigured && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <Database className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
          <div className="flex-1 text-sm text-amber-800">
            <p className="font-semibold">{unconfigured}</p>
            <p className="mt-1 text-amber-700">
              Você pode ativar o modo demonstração (<code className="rounded bg-amber-100 px-1">DEMO_MODE=true</code>),
              configurar o Google Places ou habilitar o OpenStreetMap. Veja como em{" "}
              <Link href="/settings" className="font-semibold underline">
                Configurações → Fonte de dados
              </Link>
              .
            </p>
          </div>
        </div>
      )}

      {/* Banner: erro */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" aria-hidden />
          <div className="flex-1 text-sm text-rose-700">
            <p className="font-semibold">Não foi possível concluir a busca.</p>
            <p className="mt-0.5">{error}</p>
            <button
              onClick={() => void runSearch(form)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-100"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Tentar novamente
            </button>
          </div>
        </div>
      )}

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-card sm:p-4">
              <s.icon
                className={cn(
                  "h-5 w-5",
                  s.tone === "indigo" && "text-indigo-500",
                  s.tone === "emerald" && "text-emerald-500",
                  s.tone === "amber" && "text-amber-500",
                  s.tone === "sky" && "text-sky-500"
                )}
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">{s.value}</p>
                <p className="truncate text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      {results && results.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 sm:px-5"
            aria-expanded={showFilters}
          >
            <span className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" aria-hidden />
              Filtros
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                  {activeFilterCount}
                </span>
              )}
            </span>
            <span className="text-xs text-slate-400">{showFilters ? "ocultar" : "mostrar"}</span>
          </button>
          {showFilters && (
            <div className="flex flex-wrap items-end gap-x-5 gap-y-3 border-t border-slate-100 px-4 py-4 sm:px-5">
              <div className="w-40">
                <Select
                  value={filters.minScore}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, minScore: Number(e.target.value) as Filters["minScore"] }))
                  }
                  aria-label="Score mínimo"
                >
                  <option value={0}>Qualquer score</option>
                  <option value={40}>Potencial médio (40+)</option>
                  <option value={70}>Alto potencial (70+)</option>
                </Select>
              </div>
              {(
                [
                  ["website", "Possui website"],
                  ["whatsapp", "Possui WhatsApp"],
                  ["instagram", "Possui Instagram"],
                  ["email", "Possui e-mail"],
                  ["phone", "Possui telefone"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex cursor-pointer select-none items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={filters[key]}
                    onChange={() => toggle(key)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  {label}
                </label>
              ))}
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Limpar filtros
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Aviso da fonte */}
      {meta?.demo && results && results.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
          <p className="text-sm text-amber-800">
            <strong>DADOS DE DEMONSTRAÇÃO</strong> — empresas fictícias geradas localmente para você
            explorar a ferramenta. Nenhum resultado representa um negócio real. Configure uma fonte
            real em <Link href="/settings" className="font-semibold underline">Configurações</Link>.
          </p>
        </div>
      )}
      {!meta?.demo && notice && results && results.length > 0 && (
        <p className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden /> {notice}
        </p>
      )}

      {/* Estados de conteúdo */}
      {loading && <SkeletonCards count={6} />}

      {!loading && results && filtered.length === 0 && (
        <EmptyState
          icon={Search}
          title={
            results.length === 0
              ? "Nenhuma empresa encontrada"
              : "Nenhuma empresa corresponde aos filtros"
          }
          description={
            results.length === 0
              ? "Tente outro segmento, amplie a localização ou ajuste a palavra-chave."
              : "Remova alguns filtros para ver mais resultados."
          }
          action={
            <Button variant="secondary" onClick={() => setFilters(EMPTY_FILTERS)}>
              <RotateCcw className="h-4 w-4" aria-hidden /> Limpar filtros
            </Button>
          }
        />
      )}

      {!loading && pageItems.length > 0 && (
        <>
          <p className="text-sm text-slate-500">
            Mostrando <strong>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</strong> de{" "}
            <strong>{filtered.length}</strong> empresas
            {meta && <> · Fonte: <strong>{meta.label}</strong></>}. Score estimado com base nos dados
            públicos disponíveis.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pageItems.map((c) => (
              <CompanyCard
                key={c.id}
                company={c}
                onView={setViewing}
                onSaveLead={saveLead}
                onToggleFavorite={toggleFavorite}
                savingLead={savingId === c.id}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      {/* Estado inicial */}
      {!loading && !results && !error && !unconfigured && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center sm:p-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
            <Search className="h-6 w-6" aria-hidden />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Faça sua primeira busca
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Informe um segmento e a localização. Exemplos de segmentos com muitos orçamentos
            personalizados:
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {["Marcenaria", "Serralheria", "Vidraçaria", "Salão de beleza", "Clínica odontológica"].map(
              (s) => (
                <button
                  key={s}
                  onClick={() => {
                    setForm((f) => ({ ...f, segment: s, city: f.city || "Santo André", state: f.state || "SP" }));
                  }}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-sm text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  {s}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Modal de detalhe */}
      <CompanyModal
        company={viewing}
        onClose={() => setViewing(null)}
        onSaveLead={saveLead}
        onToggleFavorite={toggleFavorite}
        savingLead={viewing ? savingId === viewing.id : false}
      />
    </div>
  );
}
