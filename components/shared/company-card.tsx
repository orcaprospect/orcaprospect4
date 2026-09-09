"use client";

import { Check, Globe, Instagram, Mail, MapPin, MessageCircle, Phone, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { hostOf } from "@/lib/utils";
import { LEAD_STATUS_LABELS } from "@/types";
import type { CompanyView } from "@/types";
import { ScoreBadge } from "./score-badge";

interface CompanyCardProps {
  company: CompanyView;
  onView: (c: CompanyView) => void;
  onSaveLead: (c: CompanyView) => void;
  onToggleFavorite: (c: CompanyView) => void;
  savingLead?: boolean;
}

/** Chip de sinal verificado (canal de contato). */
function SignalChip({
  icon: Icon,
  label,
  active,
  activeText,
}: {
  icon: typeof Globe;
  label: string;
  active: boolean;
  activeText?: string;
}) {
  if (!active) {
    return (
      <Tooltip label={`${label}: não informado por esta fonte`}>
        <span className="inline-flex cursor-default items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs text-slate-400 ring-1 ring-inset ring-slate-200">
          <Icon className="h-3.5 w-3.5" aria-hidden />
          <span className="line-through decoration-slate-300">{label}</span>
        </span>
      </Tooltip>
    );
  }
  return (
    <Tooltip label={activeText ?? `${label}: disponível`}>
      <span className="inline-flex cursor-default items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {activeText ?? label}
      </span>
    </Tooltip>
  );
}

export function CompanyCard({ company: c, onView, onSaveLead, onToggleFavorite, savingLead }: CompanyCardProps) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-slate-900" title={c.name}>
            {c.name}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
            {c.category ? <span className="truncate">{c.category}</span> : <span className="italic text-slate-400">Categoria não informada</span>}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
            <span className="truncate">
              {[c.city, c.state].filter(Boolean).join(" - ") || "Localização não informada"}
            </span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <ScoreBadge score={c.score} tier={c.tier} />
          <button
            onClick={() => onToggleFavorite(c)}
            className="rounded-lg p-1.5 text-slate-300 transition hover:bg-amber-50 hover:text-amber-500"
            aria-label={c.isFavorite ? "Remover dos favoritos" : "Salvar nos favoritos"}
          >
            <Star className={c.isFavorite ? "h-5 w-5 fill-amber-400 text-amber-400" : "h-5 w-5"} />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {c.isDemo && (
          <Badge tone="amber">DADOS DE DEMONSTRAÇÃO</Badge>
        )}
        {c.leadId && c.leadStatus && <Badge tone="indigo">Lead: {LEAD_STATUS_LABELS[c.leadStatus]}</Badge>}
        {c.signals.budgetRequests && (
          <Badge tone="sky">“Solicita orçamento”</Badge>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <SignalChip
          icon={Globe}
          label="Website"
          active={Boolean(c.website)}
          activeText={hostOf(c.website) ?? "Website disponível"}
        />
        <SignalChip icon={MessageCircle} label="WhatsApp" active={Boolean(c.whatsapp)} />
        <SignalChip icon={Instagram} label="Instagram" active={Boolean(c.instagram)} />
        <SignalChip icon={Mail} label="E-mail" active={Boolean(c.email)} />
        <SignalChip icon={Phone} label="Telefone" active={Boolean(c.phone)} />
      </div>

      {c.signals.budgetRequests && (
        <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs italic text-slate-500">
          “Solicita orçamento pelo WhatsApp”
        </p>
      )}

      <div className="mt-auto flex gap-2 pt-4">
        <Button variant="secondary" size="sm" className="flex-1" onClick={() => onView(c)}>
          Ver empresa
        </Button>
        {c.leadId ? (
          <Button variant="ghost" size="sm" className="flex-1 border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" disabled>
            <Check className="h-4 w-4" /> Lead salvo
          </Button>
        ) : (
          <Button size="sm" className="flex-1" onClick={() => onSaveLead(c)} loading={savingLead}>
            Salvar lead
          </Button>
        )}
      </div>
    </article>
  );
}
