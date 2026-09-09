import { cn } from "@/lib/utils";
import { TIER_SHORT_LABELS } from "@/lib/score";
import type { ScoreTier } from "@/types";
import { Tooltip } from "@/components/ui/tooltip";

const tierStyles: Record<ScoreTier, string> = {
  alto: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  medio: "bg-amber-50 text-amber-700 ring-amber-200",
  baixo: "bg-slate-100 text-slate-600 ring-slate-200",
};

const tierDot: Record<ScoreTier, string> = {
  alto: "bg-emerald-500",
  medio: "bg-amber-500",
  baixo: "bg-slate-400",
};

export function ScoreBadge({
  score,
  tier,
  size = "md",
}: {
  score: number;
  tier: ScoreTier;
  size?: "sm" | "md";
}) {
  const badge = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset",
        tierStyles[tier],
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", tierDot[tier])} aria-hidden />
      {score}
      <span className="opacity-70">· {TIER_SHORT_LABELS[tier]}</span>
    </span>
  );
  return (
    <Tooltip label="Potencial de automação — score estimado com base nos dados públicos disponíveis.">
      {badge}
    </Tooltip>
  );
}
