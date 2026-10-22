"use client";

import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { weakestFactor, type ScoreFactor } from "./mock-sme-analytics";

// Why the score is what it is, and what to work on.
//
// Deliberately NOT a chart: four values with a known 0-100 scale and a fixed
// order are a meter list, and each one needs its weight and a verdict beside it.
// A bar chart of four bars would say less and take more room.
//
// The four groups are the grading engine's own roll-up (bcq 0.40, rsg 0.25,
// sector 0.25, behavioral 0.10) — an SME reading this sees the same structure
// an underwriter does.
export function ScoreFactorsPanel({
  factors,
  score,
}: {
  factors: ScoreFactor[];
  score: number;
}) {
  const { t } = useTranslations();
  const weakest = weakestFactor(factors);

  // Bands match the engine's own reading of a premium: strong is comfortably
  // above the midpoint, weak is below it, and 50 is the line gate 3 counts
  // factors against.
  const band = (score: number) =>
    score >= 70 ? "strong" : score >= 50 ? "fair" : "weak";

  const barColor = (score: number) =>
    score >= 70
      ? "bg-emerald-500"
      : score >= 50
        ? "bg-amber-500"
        : "bg-destructive";

  const textColor = (score: number) =>
    score >= 70
      ? "text-emerald-600 dark:text-emerald-400"
      : score >= 50
        ? "text-amber-600 dark:text-amber-400"
        : "text-destructive";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
        <span className="text-3xl font-bold tracking-tight text-foreground">
          {score.toFixed(1)}
        </span>
        <span className="text-sm text-muted-foreground">
          {t("dashboard.smeAnalytics.score.outOf")}
        </span>
      </div>

      <ul className="space-y-4">
        {factors.map((factor) => (
          <li key={factor.key} className="space-y-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-foreground">
                {t(`dashboard.smeAnalytics.factors.${factor.key}`)}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {t("dashboard.smeAnalytics.score.weight", {
                    percent: Math.round(factor.weight * 100),
                  })}
                </span>
              </span>
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  textColor(factor.score),
                )}
              >
                {factor.score.toFixed(1)}
                <span className="ml-2 text-xs font-normal">
                  {t(`dashboard.smeAnalytics.score.band.${band(factor.score)}`)}
                </span>
              </span>
            </div>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={Math.round(factor.score)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t(`dashboard.smeAnalytics.factors.${factor.key}`)}
            >
              <div
                className={cn("h-full rounded-full", barColor(factor.score))}
                style={{ width: `${Math.min(100, factor.score)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t(`dashboard.smeAnalytics.factorHints.${factor.key}`)}
            </p>
          </li>
        ))}
      </ul>

      {weakest && (
        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
          <p className="text-xs font-semibold text-foreground">
            {t("dashboard.smeAnalytics.score.focusTitle")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("dashboard.smeAnalytics.score.focusBody", {
              factor: t(`dashboard.smeAnalytics.factors.${weakest.key}`),
              score: weakest.score.toFixed(1),
            })}
          </p>
        </div>
      )}
    </div>
  );
}
