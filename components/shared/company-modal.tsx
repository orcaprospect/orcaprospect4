"use client";

import {
  Building2,
  Check,
  ExternalLink,
  Globe,
  HelpCircle,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Star,
  Tag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Tooltip } from "@/components/ui/tooltip";
import {
  SCORE_DISCLAIMER_LONG,
  TIER_LABELS,
  buildLeadPitch,
} from "@/lib/score";
import { ensureUrl, formatDateTime, hostOf, whatsappLink } from "@/lib/utils";
import { LEAD_STATUS_LABELS } from "@/types";
import type { CompanyView } from "@/types";
import { ScoreBadge } from "./score-badge";

interface CompanyModalProps {
  company: CompanyView | null;
  onClose: () => void;
  onSaveLead: (c: CompanyView) => void;
  onToggleFavorite: (c: CompanyView) => void;
  savingLead?: boolean;
}

function InfoRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Globe;
  label: string;
  value: string | null;
  href?: string | null;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
        <dd className="break-words text-sm text-slate-800">
          {value ? (
            href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                {value}
                <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            ) : (
              value
            )
          ) : (
            <span className="text-slate-400">Não informado por esta fonte</span>
          )}
        </dd>
      </div>
    </div>
  );
}

export function CompanyModal({ company: c, onClose, onSaveLead, onToggleFavorite, savingLead }: CompanyModalProps) {
  if (!c) return null;

  const pitch = buildLeadPitch({
    name: c.name,
    category: c.category,
    signals: c.signals,
    website: c.website,
    score: c.score,
    tier: c.tier,
  });
  const wa = whatsappLink(c.whatsapp);
  const site = ensureUrl(c.website);
  const insta = ensureUrl(c.instagram) ?? (c.instagram ? `https://instagram.com/${c.instagram.replace(/^@/, "")}` : null);

  return (
    <Modal
      open
      onClose={onClose}
      wide
      title={c.name}
      subtitle={
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {c.category && <span>{c.category}</span>}
          {(c.city || c.state) && (
            <span className="flex items-center gap-1">
              · <MapPin className="h-3.5 w-3.5" aria-hidden /> {c.city}
              {c.state ? ` - ${c.state}` : ""}
            </span>
          )}
        </span>
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-400">
            Última atualização dos dados: {formatDateTime(c.lastUpdatedAt)}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => onToggleFavorite(c)}>
              <Star className={c.isFavorite ? "h-4 w-4 fill-amber-400 text-amber-400" : "h-4 w-4"} />
              {c.isFavorite ? "Nos favoritos" : "Favoritar"}
            </Button>
            {c.leadId ? (
              <Button variant="ghost" size="sm" className="border border-emerald-200 bg-emerald-50 text-emerald-700" disabled>
                <Check className="h-4 w-4" /> Lead salvo ({c.leadStatus ? LEAD_STATUS_LABELS[c.leadStatus] : "Novo"})
              </Button>
            ) : (
              <Button size="sm" onClick={() => onSaveLead(c)} loading={savingLead}>
                Salvar lead
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <ScoreBadge score={c.score} tier={c.tier} />
          <Badge tone="slate">{TIER_LABELS[c.tier]}</Badge>
          {c.isDemo && <Badge tone="amber">DADOS DE DEMONSTRAÇÃO</Badge>}
          <span className="text-xs text-slate-400">Fonte: {c.providerLabel ?? c.provider}</span>
        </div>

        {/* Por que esta empresa pode ser um bom lead? */}
        <section className="rounded-2xl bg-indigo-50/70 p-4 ring-1 ring-inset ring-indigo-100">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-indigo-900">
            <Building2 className="h-4 w-4" aria-hidden />
            Por que esta empresa pode ser um bom lead?
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-indigo-900/80">{pitch}</p>
        </section>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Dados da empresa */}
          <section>
            <h3 className="text-sm font-semibold text-slate-900">Dados da empresa</h3>
            <dl className="mt-1 divide-y divide-slate-100">
              <InfoRow icon={Globe} label="Website" value={site ? hostOf(site) : null} href={site} />
              <InfoRow
                icon={MessageCircle}
                label="WhatsApp comercial"
                value={c.whatsapp}
                href={wa}
              />
              <InfoRow icon={Phone} label="Telefone comercial" value={c.phone} />
              <InfoRow icon={Mail} label="E-mail empresarial" value={c.email} href={c.email ? `mailto:${c.email}` : null} />
              <InfoRow icon={Instagram} label="Instagram" value={c.instagram ?? null} href={insta} />
              <InfoRow
                icon={MapPin}
                label="Localização"
                value={[c.address, c.city, c.state, c.country].filter(Boolean).join(" · ") || null}
              />
              {c.sourceUrl && (
                <InfoRow icon={ExternalLink} label="Ver na fonte" value={c.providerLabel ?? c.provider} href={c.sourceUrl} />
              )}
            </dl>
            {c.description && (
              <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">{c.description}</p>
            )}
            {c.services.length > 0 && (
              <div className="mt-3">
                <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <Tag className="h-3.5 w-3.5" aria-hidden /> Serviços
                </h4>
                <ul className="mt-1.5 space-y-1">
                  {c.services.map((s) => (
                    <li key={s} className="text-sm text-slate-600">• {s}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Score detalhado */}
          <section>
            <h3 className="text-sm font-semibold text-slate-900">
              Potencial de automação <span className="font-normal text-slate-400">({c.score}/100)</span>
            </h3>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={
                  c.tier === "alto"
                    ? "h-full rounded-full bg-emerald-500"
                    : c.tier === "medio"
                      ? "h-full rounded-full bg-amber-500"
                      : "h-full rounded-full bg-slate-300"
                }
                style={{ width: `${c.score}%` }}
              />
            </div>
            <ul className="mt-3 space-y-1.5">
              {c.breakdown.map((b) => (
                <li key={b.key} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    {b.earned ? (
                      <Check className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                    ) : b.verified ? (
                      <span className="inline-block h-4 w-4 shrink-0 rounded-full border border-slate-300" aria-hidden />
                    ) : (
                      <Tooltip label="Não foi possível verificar com os dados disponíveis">
                        <HelpCircle className="h-4 w-4 shrink-0 cursor-default text-slate-300" aria-hidden />
                      </Tooltip>
                    )}
                    <Tooltip label={b.hint}>
                      <span className={b.earned ? "text-slate-700" : "text-slate-400"}>{b.label}</span>
                    </Tooltip>
                  </span>
                  <span className={b.earned ? "font-medium text-emerald-700" : "text-slate-400"}>
                    {b.earned ? `+${b.points}` : b.verified ? "0" : "n/v"}
                  </span>
                </li>
              ))}
            </ul>
            {c.unverified.length > 0 && (
              <p className="mt-3 text-xs text-slate-400">
                Não verificado por esta fonte: {c.unverified.join(", ")}.
              </p>
            )}
            <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500">
              {SCORE_DISCLAIMER_LONG}
            </p>
          </section>
        </div>
      </div>
    </Modal>
  );
}
