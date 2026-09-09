"use client";

import { Building2, ExternalLink, Globe, Mail, MapPin, MessageCircle, Phone, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { ScoreBadge } from "@/components/shared/score-badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { TagInput } from "@/components/ui/tag-input";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";
import { SCORE_DISCLAIMER } from "@/lib/score";
import { buildLeadPitch } from "@/lib/score";
import { cn, formatDate, formatDateTime, ensureUrl, whatsappLink } from "@/lib/utils";
import { LEAD_STATUS_LABELS, LEAD_STATUSES } from "@/types";
import type { LeadStatus, LeadView } from "@/types";

interface LeadModalProps {
  lead: LeadView | null;
  onClose: () => void;
  onPatch: (id: string, patch: Record<string, unknown>, optimistic?: (l: LeadView) => LeadView) => Promise<LeadView | null>;
  onDelete: (lead: LeadView) => void;
  busy?: boolean;
}

export function LeadModal({ lead, onClose, onPatch, onDelete, busy }: LeadModalProps) {
  const { error: toastError } = useToast();
  const [note, setNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  if (!lead) return null;
  const c = lead.company;

  const addNote = async () => {
    const content = note.trim();
    if (!content) return;
    setAddingNote(true);
    const updated = await onPatch(lead.id, { newNote: content });
    setAddingNote(false);
    if (updated) setNote("");
  };

  const setTags = async (tags: string[]) => {
    const current = lead.tags;
    const addTags = tags.filter((t) => !current.includes(t));
    const removeTags = current.filter((t) => !tags.includes(t));
    await onPatch(lead.id, { addTags, removeTags }, (l) => ({ ...l, tags }));
  };

  const wa = whatsappLink(c.whatsapp);
  const site = ensureUrl(c.website);
  const pitch = buildLeadPitch({
    name: c.name,
    category: c.category,
    signals: c.signals,
    website: c.website,
    score: c.score,
    tier: c.tier,
  });

  return (
    <Modal
      open
      onClose={onClose}
      wide
      title={c.name}
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          {c.category}
          {(c.city || c.state) && (
            <span className="flex items-center gap-1">
              · <MapPin className="h-3.5 w-3.5" aria-hidden /> {[c.city, c.state].filter(Boolean).join(" - ")}
            </span>
          )}
          <span className="text-slate-400">· Lead criado em {formatDate(lead.createdAt)}</span>
        </span>
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-400">Última atualização: {formatDateTime(lead.updatedAt)}</p>
          <Button variant="danger" size="sm" onClick={() => onDelete(lead)}>
            <Trash2 className="h-4 w-4" aria-hidden /> Excluir lead
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Resumo + pitch */}
        <div className="flex flex-wrap items-center gap-2">
          <ScoreBadge score={c.score} tier={c.tier} />
          {c.isDemo && (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
              DADOS DE DEMONSTRAÇÃO
            </span>
          )}
        </div>
        <p className="rounded-2xl bg-indigo-50/70 p-3.5 text-sm leading-relaxed text-indigo-900/80 ring-1 ring-inset ring-indigo-100">
          <Building2 className="mr-1.5 inline h-4 w-4" aria-hidden />
          {pitch}
        </p>

        {/* Status + favorito */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status do lead">
            <Select
              value={lead.status}
              onChange={(e) => void onPatch(lead.id, { status: e.target.value as LeadStatus })}
              disabled={busy}
            >
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {LEAD_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Favorito">
            <Button
              variant={lead.favorite ? "primary" : "secondary"}
              className="w-full"
              onClick={() => void onPatch(lead.id, { favorite: !lead.favorite })}
              disabled={busy}
            >
              <Star className={cn("h-4 w-4", lead.favorite && "fill-amber-300 text-amber-300")} aria-hidden />
              {lead.favorite ? "Nos favoritos" : "Marcar como favorito"}
            </Button>
          </Field>
        </div>

        {/* Contatos */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Contatos comerciais</h3>
          <div className="flex flex-wrap gap-2">
            {site && (
              <a href={site} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 transition hover:border-indigo-300 hover:text-indigo-700">
                <Globe className="h-4 w-4" aria-hidden /> Site <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            )}
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700 transition hover:bg-emerald-100">
                <MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp
              </a>
            )}
            {c.phone && (
              <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 transition hover:border-indigo-300 hover:text-indigo-700">
                <Phone className="h-4 w-4" aria-hidden /> {c.phone}
              </a>
            )}
            {c.email && (
              <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 transition hover:border-indigo-300 hover:text-indigo-700">
                <Mail className="h-4 w-4" aria-hidden /> {c.email}
              </a>
            )}
            {!site && !wa && !c.phone && !c.email && (
              <p className="text-sm text-slate-400">Nenhum canal de contato disponível para esta empresa.</p>
            )}
          </div>
        </div>

        {/* Tags */}
        <Field label="Tags" hint="Enter ou vírgula para adicionar.">
          <TagInput
            value={lead.tags}
            onChange={(tags) => void setTags(tags)}
            placeholder="Ex.: whatsapp-ok, revisar, quente…"
          />
        </Field>

        {/* Observações */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Observações <span className="font-normal text-slate-400">({lead.notes.length})</span>
          </h3>
          <div className="mt-2 space-y-2">
            {lead.notes.length === 0 && (
              <p className="text-sm text-slate-400">Nenhuma observação ainda.</p>
            )}
            {lead.notes.map((n) => (
              <div key={n.id} className="rounded-xl bg-slate-50 px-3.5 py-2.5 ring-1 ring-inset ring-slate-200">
                <p className="whitespace-pre-wrap text-sm text-slate-700">{n.content}</p>
                <p className="mt-1 text-xs text-slate-400">{formatDateTime(n.createdAt)}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Registrar interação: 'liguei hoje, retornar sexta'…"
              maxLength={2000}
              className="min-h-[64px]"
              aria-label="Nova observação"
            />
            <Button onClick={addNote} loading={addingNote} className="self-end">
              Salvar
            </Button>
          </div>
        </div>

        <p className="text-xs text-slate-400">{SCORE_DISCLAIMER}</p>
      </div>
    </Modal>
  );
}
