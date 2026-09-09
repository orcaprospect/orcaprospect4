import { matchesHighBudgetSegment } from "./segments";
import type { CompanySignals, CriterionKey, CriterionResult, ScoreResult, ScoreTier } from "@/types";

/**
 * ============================================================
 * SCORE DE POTENCIAL DE AUTOMAÇÃO (0–100)
 * ============================================================
 * O score é uma ESTIMATIVA baseada em sinais públicos disponíveis.
 * Ele NÃO afirma que a empresa possui (ou não) automação — apenas
 * mede a aderência ao perfil do OrçaAI a partir do que foi possível
 * verificar. Sinais não verificados aparecem como "não verificado".
 */

export const SCORE_DISCLAIMER =
  "Score estimado com base nos dados públicos disponíveis.";

export const SCORE_DISCLAIMER_LONG =
  "Score estimado com base nos dados públicos disponíveis. Este valor é uma estimativa de aderência ao OrçaAI e não afirma que a empresa possui ou não automação de orçamentos.";

export const TIER_LABELS: Record<ScoreTier, string> = {
  alto: "Alto potencial",
  medio: "Potencial médio",
  baixo: "Baixo potencial",
};

export const TIER_SHORT_LABELS: Record<ScoreTier, string> = {
  alto: "ALTO",
  medio: "MÉDIO",
  baixo: "BAIXO",
};

interface CriterionDef {
  key: CriterionKey;
  label: string;
  hint: string;
  points: number;
}

export const CRITERIA: CriterionDef[] = [
  { key: "whatsapp", label: "WhatsApp público", points: 20, hint: "Número de WhatsApp divulgado publicamente" },
  { key: "website", label: "Site próprio", points: 15, hint: "Site divulgado publicamente" },
  { key: "contactForm", label: "Formulário de contato", points: 15, hint: "Formulário de contato público identificado" },
  { key: "budgetRequests", label: "Sinais de solicitação de orçamento", points: 20, hint: "Sinais públicos de atendimento por orçamento (ex.: “peça seu orçamento”)" },
  { key: "catalog", label: "Catálogo de produtos/serviços", points: 10, hint: "Catálogo de produtos ou serviços divulgado" },
  { key: "instagramActive", label: "Instagram ativo", points: 10, hint: "Perfil comercial no Instagram" },
  { key: "segment", label: "Segmento com orçamentos personalizados", points: 10, hint: "Segmento com alta probabilidade de trabalhar com orçamentos personalizados" },
];

export function tierOf(score: number): ScoreTier {
  if (score >= 70) return "alto";
  if (score >= 40) return "medio";
  return "baixo";
}

export function scoreCompany(input: {
  signals?: CompanySignals | null;
  category?: string | null;
  name?: string | null;
}): ScoreResult {
  const signals: CompanySignals = input.signals ?? {};
  const breakdown: CriterionResult[] = CRITERIA.map((c) => {
    let raw: boolean | null | undefined;
    let verified: boolean;
    if (c.key === "segment") {
      const text = `${input.category ?? ""} ${input.name ?? ""}`;
      raw = matchesHighBudgetSegment(text);
      verified = Boolean(input.category);
    } else {
      raw = signals[c.key];
      verified = raw === true || raw === false;
    }
    return {
      key: c.key,
      label: c.label,
      hint: c.hint,
      points: c.points,
      earned: raw === true,
      verified,
    };
  });

  const total = breakdown.reduce((sum, b) => sum + (b.earned ? b.points : 0), 0);
  const score = Math.min(100, Math.max(0, total));
  const unverified = breakdown.filter((b) => !b.verified).map((b) => b.label);

  return { score, tier: tierOf(score), breakdown, unverified };
}

/** Texto explicativo: "Por que esta empresa pode ser um bom lead?" */
export function buildLeadPitch(input: {
  name?: string | null;
  category?: string | null;
  signals?: CompanySignals | null;
  website?: string | null;
  score: number;
  tier: ScoreTier;
}): string {
  const s: CompanySignals = input.signals ?? {};
  const parts: string[] = [];

  if (input.category) {
    parts.push(`Esta empresa atua no segmento de ${input.category.toLowerCase()}`);
  } else {
    parts.push("Esta empresa foi encontrada na sua busca");
  }
  if (s.whatsapp) parts.push("possui WhatsApp comercial divulgado publicamente");
  if (input.website) parts.push("possui site próprio");
  if (s.contactForm) parts.push("aparenta possuir formulário de contato");
  if (s.budgetRequests) parts.push("apresenta sinais públicos de atendimento baseado em solicitações de orçamento");
  if (s.catalog) parts.push("divulga catálogo de produtos/serviços");
  if (s.instagramActive) parts.push("mantém perfil comercial no Instagram");

  let text: string;
  if (parts.length === 1) {
    text = `${parts[0]}. Ainda não há sinais públicos suficientes para uma análise mais detalhada dos canais de atendimento.`;
  } else {
    text = `${parts[0]}, ${parts.slice(1).join(", ")}.`;
  }

  const tier = TIER_LABELS[input.tier];
  return `${text} Potencial estimado: ${tier.toUpperCase()} (${input.score}/100). ${SCORE_DISCLAIMER}`;
}
