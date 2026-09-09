"use client";

import { Loader2, RotateCcw, Star, UserPlus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CompanyCard } from "@/components/shared/company-card";
import { CompanyModal } from "@/components/shared/company-modal";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";
import type { CompanyView, LeadStatus } from "@/types";

interface FavoriteItem {
  favoriteId: string;
  createdAt: string;
  company: CompanyView;
}

export function FavoritesClient() {
  const { success, error: toastError, info } = useToast();
  const [items, setItems] = useState<FavoriteItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<CompanyView | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await api<{ favorites: FavoriteItem[] }>("/api/favorites");
      setItems(data.favorites);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Erro ao carregar favoritos.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveLead = async (c: CompanyView) => {
    setSavingId(c.id);
    try {
      const res = await api<{ already: boolean; leadId: string; status: LeadStatus }>("/api/leads", {
        method: "POST",
        body: JSON.stringify({ companyId: c.id }),
      });
      setItems((prev) =>
        prev?.map((i) =>
          i.company.id === c.id
            ? { ...i, company: { ...i.company, leadId: res.leadId, leadStatus: res.status } }
            : i
        ) ?? null
      );
      setViewing((v) => (v && v.id === c.id ? { ...v, leadId: res.leadId, leadStatus: res.status } : v));
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
        body: JSON.stringify({ companyId: c.id, favorite: false }),
      });
      if (!res.favorite) {
        setItems((prev) => prev?.filter((i) => i.company.id !== c.id) ?? null);
        setViewing((v) => (v && v.id === c.id ? null : v));
        info("Removido dos favoritos.");
      }
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Erro ao remover favorito.");
    }
  };

  if (items === null && !loadError) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
      </div>
    );
  }

  if (loadError && items === null) {
    return (
      <EmptyState
        icon={Star}
        title="Não foi possível carregar"
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Meus leads</h1>
        <p className="mt-1 text-sm text-slate-500">
          Empresas que você salvou como favoritas. Transforme-as em leads para acompanhar no CRM.
        </p>
      </div>

      {items && items.length === 0 && (
        <EmptyState
          icon={Star}
          title="Nenhum favorito ainda"
          description="Toque na estrela de uma empresa nos resultados de busca para salvá-la aqui."
          action={
            <Link href="/search">
              <Button>Encontrar empresas</Button>
            </Link>
          }
        />
      )}

      {items && items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <CompanyCard
              key={item.favoriteId}
              company={item.company}
              onView={setViewing}
              onSaveLead={saveLead}
              onToggleFavorite={toggleFavorite}
              savingLead={savingId === item.company.id}
            />
          ))}
        </div>
      )}

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
