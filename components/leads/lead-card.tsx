"use client";

import { MapPin, MessageCircle, Star } from "lucide-react";
import { ScoreBadge } from "@/components/shared/score-badge";
import { Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { LEAD_STATUS_LABELS, LEAD_STATUSES } from "@/types";
import type { LeadStatus, LeadView } from "@/types";

interface LeadCardProps {
  lead: LeadView;
  dragging?: boolean;
  busy?: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onOpen: () => void;
  onToggleFavorite: () => void;
  onStatusChange: (status: LeadStatus) => void;
}

export function LeadCard({
  lead,
  dragging,
  busy,
  onDragStart,
  onDragEnd,
  onOpen,
  onToggleFavorite,
  onStatusChange,
}: LeadCardProps) {
  const c = lead.company;
  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", lead.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "group cursor-grab rounded-xl border border-slate-200 bg-white p-3 shadow-card transition active:cursor-grabbing",
        dragging && "opacity-50 ring-2 ring-indigo-300",
        busy && "opacity-70",
        "hover:shadow-card-hover"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          onClick={onOpen}
          className="min-w-0 flex-1 text-left"
          aria-label={`Abrir lead ${c.name}`}
        >
          <h3 className="truncate text-sm font-semibold text-slate-900">{c.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
            {c.category && <span className="truncate">{c.category}</span>}
            {(c.city || c.state) && (
              <span className="flex min-w-0 items-center gap-0.5">
                {c.category && " · "}
                <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">{[c.city, c.state].filter(Boolean).join(" - ")}</span>
              </span>
            )}
          </p>
        </button>
        <button
          onClick={onToggleFavorite}
          className="rounded-md p-1 text-slate-300 transition hover:bg-amber-50 hover:text-amber-500"
          aria-label={lead.favorite ? "Remover dos favoritos" : "Favoritar lead"}
        >
          <Star className={cn("h-4 w-4", lead.favorite && "fill-amber-400 text-amber-400")} />
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <ScoreBadge score={c.score} tier={c.tier} size="sm" />
        {c.whatsapp && (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
            title="WhatsApp disponível"
          >
            <MessageCircle className="h-3 w-3" aria-hidden /> WhatsApp
          </span>
        )}
        {lead.tags.slice(0, 2).map((t) => (
          <span
            key={t}
            className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700"
          >
            {t}
          </span>
        ))}
        {lead.tags.length > 2 && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            +{lead.tags.length - 2}
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        <Select
          value={lead.status}
          onChange={(e) => onStatusChange(e.target.value as LeadStatus)}
          className="!py-1.5 text-xs"
          aria-label={`Status de ${c.name}`}
        >
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {LEAD_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
        {lead.notes.length > 0 && (
          <span
            className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500"
            title={`${lead.notes.length} observação(ões)`}
          >
            {lead.notes.length} nota{lead.notes.length > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </article>
  );
}
