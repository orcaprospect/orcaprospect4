"use client";

import {
  Columns3,
  Download,
  Filter,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  Star,
  StickyNote,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LeadCard } from "@/components/leads/lead-card";
import { LeadModal } from "@/components/leads/lead-modal";
import { ScoreBadge } from "@/components/shared/score-badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { api, downloadFile } from "@/lib/api-client";
import { cn, normalizeText } from "@/lib/utils";
import { LEAD_STATUS_LABELS, LEAD_STATUSES } from "@/types";
import type { LeadStatus, LeadView } from "@/types";

interface FilterState {
  q: string;
  tag: string;
  favorite: boolean;
  minScore: 0 | 40 | 70;
}

const EMPTY_FILTERS: FilterState = { q: "", tag: "", favorite: false, minScore: 0 };

const COLUMN_DOTS: Record<LeadStatus, string> = {
  novo: "bg-indigo-500",
  contatado: "bg-sky-500",
  respondeu: "bg-amber-500",
  demonstracao: "bg-violet-500",
  cliente: "bg-emerald-500",
  sem_interesse: "bg-slate-400",
};

export function LeadsClient() {
  const { success, error: toastError, info } = useToast();
  const [leads, setLeads] = useState<LeadView[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<LeadStatus | null>(null);
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<LeadView | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [patchingIds, setPatchingIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await api<{ leads: LeadView[] }>("/api/leads");
      setLeads(data.leads);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Erro ao carregar leads.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!leads) return [];
    const q = normalizeText(filters.q);
    return leads.filter((l) => {
      if (filters.favorite && !l.favorite) return false;
      if (filters.tag && !l.tags.some((t) => t.toLowerCase() === filters.tag.toLowerCase())) return false;
      if (filters.minScore && l.company.score < filters.minScore) return false;
      if (q) {
        const hay = normalizeText(
          [l.company.name, l.company.category, l.company.city, l.company.state, l.tags.join(" "), l.notes.map((n) => n.content).join(" ")].join(" ")
        );
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [leads, filters]);

  const byStatus = useMemo(() => {
    const map = new Map<LeadStatus, LeadView[]>(LEAD_STATUSES.map((s) => [s, []]));
    for (const l of filtered) map.get(l.status)?.push(l);
    return map;
  }, [filtered]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    leads?.forEach((l) => l.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [leads]);

  const patchLead = async (
    id: string,
    patch: Record<string, unknown>,
    optimistic?: (l: LeadView) => LeadView
  ) => {
    const previous = leads;
    if (optimistic) {
      setLeads((prev) => prev?.map((l) => (l.id === id ? optimistic(l) : l)) ?? null);
    }
    setPatchingIds((prev) => new Set(prev).add(id));
    try {
      const data = await api<{ lead: LeadView }>(`/api/leads/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setLeads((prev) => prev?.map((l) => (l.id === id ? data.lead : l)) ?? null);
      return data.lead;
    } catch (err) {
      setLeads(previous);
      toastError(err instanceof Error ? err.message : "Erro ao atualizar lead.");
      return null;
    } finally {
      setPatchingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const moveLead = async (id: string, status: LeadStatus) => {
    const current = leads?.find((l) => l.id === id);
    if (!current || current.status === status) return;
    await patchLead(id, { status }, (l) => ({ ...l, status }));
    success(`Lead movido para “${LEAD_STATUS_LABELS[status]}”.`);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await api(`/api/leads/${deleting.id}`, { method: "DELETE" });
      setLeads((prev) => prev?.filter((l) => l.id !== deleting.id) ?? null);
      setOpenLeadId(null);
      success("Lead excluído.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Erro ao excluir lead.");
    } finally {
      setDeleteLoading(false);
      setDeleting(null);
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const ids = filtered.map((l) => l.id);
      await downloadFile(
        ids.length ? `/api/export?ids=${encodeURIComponent(ids.join(","))}` : "/api/export",
        `orca-prospect-leads-${new Date().toISOString().slice(0, 10)}.csv`
      );
      success(`${ids.length || filtered.length} lead(s) exportado(s) em CSV.`);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Erro ao exportar.");
    } finally {
      setExporting(false);
    }
  };

  const toggleFavorite = async (l: LeadView) => {
    await patchLead(l.id, { favorite: !l.favorite }, (lead) => ({ ...lead, favorite: !lead.favorite }));
    info(!l.favorite ? "Lead favoritado." : "Favorito removido.");
  };

  if (leads === null && !loadError) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
      </div>
    );
  }

  if (loadError && leads === null) {
    return (
      <EmptyState
        icon={Columns3}
        title="Não foi possível carregar os leads"
        description={loadError}
        action={
          <Button variant="secondary" onClick={() => void load()}>
            <RotateCcw className="h-4 w-4" aria-hidden /> Recarregar
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Leads</h1>
          <p className="mt-1 text-sm text-slate-500">
            Seu CRM simples: arraste os cards entre as colunas para mudar o status.
          </p>
        </div>
        <Link href="/search">
          <Button variant="secondary">
            <Plus className="h-4 w-4" aria-hidden /> Novo lead via busca
          </Button>
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <Input
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            placeholder="Pesquisar por nome, tag, nota…"
            className="pl-9"
            aria-label="Pesquisar leads"
          />
        </div>
        <Button
          variant={showFilters ? "primary" : "secondary"}
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
        >
          <Filter className="h-4 w-4" aria-hidden />
          Filtros
          {(filters.tag || filters.favorite || filters.minScore) && (
            <span className="rounded-full bg-indigo-100 px-1.5 text-xs font-semibold text-indigo-700">!</span>
          )}
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="secondary" onClick={exportCsv} loading={exporting}>
            <Download className="h-4 w-4" aria-hidden />
            Exportar
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
          {allTags.length > 0 && (
            <div className="w-48">
              <Select
                value={filters.tag}
                onChange={(e) => setFilters((f) => ({ ...f, tag: e.target.value }))}
                aria-label="Filtrar por tag"
              >
                <option value="">Todas as tags</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </div>
          )}
          <div className="w-44">
            <Select
              value={filters.minScore}
              onChange={(e) => setFilters((f) => ({ ...f, minScore: Number(e.target.value) as FilterState["minScore"] }))}
              aria-label="Score mínimo"
            >
              <option value={0}>Qualquer score</option>
              <option value={40}>Médio potencial (40+)</option>
              <option value={70}>Alto potencial (70+)</option>
            </Select>
          </div>
          <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={filters.favorite}
              onChange={(e) => setFilters((f) => ({ ...f, favorite: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <Star className="h-4 w-4 text-amber-400" aria-hidden /> Somente favoritos
          </label>
          {(filters.q || filters.tag || filters.favorite || filters.minScore) && (
            <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Limpar
            </Button>
          )}
        </div>
      )}

      {/* Kanban */}
      {filtered.length === 0 && leads && leads.length === 0 ? (
        <EmptyState
          icon={Columns3}
          title="Nenhum lead ainda"
          description="Encontre empresas na busca e clique em “Salvar lead” para começar seu pipeline."
          action={
            <Link href="/search">
              <Button>Encontrar empresas</Button>
            </Link>
          }
        />
      ) : (
        <div className="thin-scrollbar -mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
          <div className="flex min-w-max gap-4">
            {LEAD_STATUSES.map((status) => {
              const items = byStatus.get(status) ?? [];
              return (
                <section
                  key={status}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(status);
                  }}
                  onDragLeave={() => setDragOver((cur) => (cur === status ? null : cur))}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(null);
                    if (dragId) void moveLead(dragId, status);
                    setDragId(null);
                  }}
                  className={cn(
                    "flex w-[272px] shrink-0 flex-col rounded-2xl border p-3 transition sm:w-[290px]",
                    dragOver === status
                      ? "border-indigo-400 bg-indigo-50/70 ring-2 ring-indigo-200"
                      : "border-slate-200 bg-slate-100/70"
                  )}
                  aria-label={`Coluna ${LEAD_STATUS_LABELS[status]}`}
                >
                  <header className="flex items-center justify-between px-1 pb-2.5">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <span className={cn("h-2 w-2 rounded-full", COLUMN_DOTS[status])} aria-hidden />
                      {LEAD_STATUS_LABELS[status]}
                    </h2>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-inset ring-slate-200">
                      {items.length}
                    </span>
                  </header>
                  <div className="flex flex-1 flex-col gap-2.5">
                    {items.length === 0 && (
                      <p className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-400">
                        {dragOver === status ? "Solte o lead aqui" : "Arraste um lead para cá"}
                      </p>
                    )}
                    {items.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        dragging={dragId === lead.id}
                        busy={patchingIds.has(lead.id)}
                        onDragStart={() => setDragId(lead.id)}
                        onDragEnd={() => {
                          setDragId(null);
                          setDragOver(null);
                        }}
                        onOpen={() => setOpenLeadId(lead.id)}
                        onToggleFavorite={() => void toggleFavorite(lead)}
                        onStatusChange={(status) => void moveLead(lead.id, status)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}

      {filtered.length === 0 && leads && leads.length > 0 && (
        <p className="text-center text-sm text-slate-400">
          Nenhum lead corresponde aos filtros atuais.
        </p>
      )}

      {/* Modal do lead */}
      {leads && (
        <LeadModal
          lead={leads.find((l) => l.id === openLeadId) ?? null}
          onClose={() => setOpenLeadId(null)}
          onPatch={patchLead}
          onDelete={(lead) => setDeleting(lead)}
          busy={openLeadId ? patchingIds.has(openLeadId) : false}
        />
      )}

      {/* Confirmação de exclusão */}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Excluir lead"
        message={
          <>
            Excluir o lead <strong>{deleting?.company.name}</strong> e todas as suas observações? Esta
            ação não pode ser desfeita.
          </>
        }
        confirmLabel="Excluir lead"
        danger
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />

      {/* Dica mobile */}
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
        <StickyNote className="h-3.5 w-3.5" aria-hidden />
        Em telas pequenas, use o seletor de status no card para mover entre colunas.
      </p>
    </div>
  );
}
