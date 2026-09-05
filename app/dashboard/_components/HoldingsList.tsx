"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarClock,
  Medal,
  Sparkles,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import { industryLabel } from "@/lib/industry-label";
import { staggerContainerVariants, springItemVariants } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { CONTROL_HOVER } from "@/lib/ui-tokens";
import { getIndustryChrome } from "./sme-dashboard-config";
import type { Holding, HoldingStatus } from "./mock-investor-dashboard";

// Status is a state, not an identity, so it uses the semantic tokens rather
// than an industry hue — one meaning per color channel. Emerald is reserved for
// "money is actually coming back".
const STATUS_STYLES: Record<HoldingStatus, string> = {
  FUNDING:
    "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  ACTIVE: "border-border bg-muted text-muted-foreground",
  REPAYING:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  COMPLETED: "border-border bg-muted text-muted-foreground",
};

export function HoldingsList({ holdings }: { holdings: Holding[] }) {
  const { locale, t } = useTranslations();

  // Dynamic ranking based on expected ROI descending
  const rankMap = useMemo(() => {
    const sorted = [...holdings].sort(
      (a, b) => b.expected_roi_pct - a.expected_roi_pct,
    );
    const map = new Map<string, number>();
    sorted.forEach((h, idx) => map.set(h.id, idx + 1));
    return map;
  }, [holdings]);

  return (
    <motion.ul
      variants={staggerContainerVariants}
      initial="hidden"
      animate="show"
      className="space-y-3"
    >
      {holdings.map((holding) => {
        // `list` tier: neutral surface + colored icon, pill and left rail.
        const chrome = getIndustryChrome(holding.industry, "list");
        const Icon = chrome.icon;
        const rank = rankMap.get(holding.id) ?? 1;
        const isTopYield = rank === 1;
        const isTopThree = rank <= 3;

        return (
          <motion.li key={holding.id} variants={springItemVariants}>
            <div
              className={cn(
                "group/card relative flex flex-col gap-4 overflow-hidden rounded-xl border p-4 pl-5 shadow-xs transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-emerald-500/40 md:p-5 md:pl-6",
                chrome.surface,
              )}
            >
              {/* 2px identity rail */}
              <span
                aria-hidden="true"
                className={cn("absolute inset-y-0 left-0 w-0.5", chrome.rail)}
              />

              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover/card:scale-105",
                      chrome.badge,
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-foreground tracking-tight">
                      {holding.project_name}
                    </p>
                    <p
                      className={cn(
                        "truncate text-xs font-medium",
                        chrome.accent,
                      )}
                    >
                      {industryLabel(holding.industry, t)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Ranking Badge */}
                  {isTopYield ? (
                    <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                      <Trophy className="h-3 w-3 text-amber-500 shrink-0" />
                      <span>
                        {t("dashboard.investor.holdingTopYield", { rank })}
                      </span>
                    </Badge>
                  ) : isTopThree ? (
                    <Badge
                      variant="outline"
                      className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"
                    >
                      <Medal className="h-3 w-3 text-zinc-500 shrink-0" />
                      <span>
                        {t("dashboard.investor.holdingRank", { rank })}
                      </span>
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-muted/60 text-muted-foreground font-mono text-[11px] font-medium px-2 py-0.5 rounded-full"
                    >
                      <span>
                        {t("dashboard.investor.holdingRank", { rank })}
                      </span>
                    </Badge>
                  )}

                  {/* Credit Grade Badge */}
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                  >
                    {t("dashboard.investor.holdingGrade", {
                      grade: holding.grade ?? "A+",
                    })}
                  </Badge>

                  {/* Status Badge */}
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full px-2.5 text-[11px] font-semibold",
                      STATUS_STYLES[holding.status],
                    )}
                  >
                    {t(`dashboard.investor.holdingStatus.${holding.status}`)}
                  </Badge>
                </div>
              </div>

              {/* Figures with attractive styling & standout Expected ROI */}
              <dl className="grid grid-cols-2 gap-3 border-t border-border/60 pt-3 sm:grid-cols-4 items-center">
                <div className="min-w-0 space-y-1">
                  <dt className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                    {t("dashboard.investor.holdingInvested")}
                  </dt>
                  <dd className="min-w-0 truncate text-base font-extrabold text-foreground font-mono">
                    {formatCurrency(holding.invested, locale)}
                  </dd>
                </div>

                <div className="min-w-0 space-y-1">
                  <dt className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                    {t("dashboard.investor.holdingReturned")}
                  </dt>
                  <dd className="min-w-0 truncate text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                    {formatCurrency(holding.returned, locale)}
                  </dd>
                </div>

                <div className="min-w-0 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 p-2.5 space-y-0.5">
                  <dt className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-emerald-500 shrink-0" />
                    {t("dashboard.investor.holdingRoi")}
                  </dt>
                  <dd className="truncate text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {t("dashboard.investor.holdingRoiValue", {
                      rate: holding.expected_roi_pct.toFixed(1),
                      months: holding.term_months,
                    })}
                  </dd>
                </div>

                <div className="min-w-0 space-y-1">
                  <dt className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                    {t("dashboard.investor.holdingNextPayout")}
                  </dt>
                  <dd className="flex items-center gap-1.5 truncate text-sm font-bold text-foreground">
                    {holding.next_payout_date ? (
                      <>
                        <CalendarClock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {formatDate(holding.next_payout_date, locale)}
                      </>
                    ) : (
                      <span className="text-muted-foreground">
                        {t("common.na")}
                      </span>
                    )}
                  </dd>
                </div>
              </dl>

              {/* Repayment progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-muted-foreground">
                    {t("dashboard.investor.holdingProgress")}
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    {holding.progress_pct}%
                  </span>
                </div>
                <div
                  className="h-2 w-full overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={holding.progress_pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={t("dashboard.investor.holdingProgress")}
                >
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      holding.progress_pct === 100
                        ? "bg-emerald-500"
                        : "bg-primary",
                    )}
                    style={{ width: `${holding.progress_pct}%` }}
                  />
                </div>
              </div>

              <Button
                asChild
                variant="outline"
                size="sm"
                className={cn(
                  "w-full gap-1.5 font-semibold group-hover/card:bg-muted transition-colors duration-200",
                  CONTROL_HOVER,
                )}
              >
                <Link href={`/dashboard/project-details?id=${holding.id}`}>
                  <span>{t("dashboard.investor.holdingViewDetails")}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/card:translate-x-1" />
                </Link>
              </Button>
            </div>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
