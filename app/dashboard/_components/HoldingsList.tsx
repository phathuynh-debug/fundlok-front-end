"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Medal, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import { industryLabel } from "@/lib/industry-label";
import { staggerContainerVariants, springItemVariants } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { CONTROL_HOVER } from "@/lib/ui-tokens";
import { dailyRepaymentAmount } from "@/lib/facility-terms";
import { getIndustryChrome } from "./sme-dashboard-config";
import {
  backstopDate,
  type Holding,
  type HoldingStatus,
} from "./mock-investor-dashboard";

// Status is a state, not an identity, so it uses the semantic tokens rather
// than an industry hue — one meaning per color channel. Emerald is reserved for
// "money is actually coming back"; amber for "needs attention, not a default";
// destructive only for the endings that cost the investor money.
const STATUS_STYLES: Record<HoldingStatus, string> = {
  FUNDING:
    "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  ACTIVE: "border-border bg-muted text-muted-foreground",
  REPAYING:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  WATCHLIST:
    "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-400",
  RELIEF:
    "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  EXTENDED:
    "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  REPAID: "border-border bg-muted text-muted-foreground",
  REPAID_EARLY:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  SETTLED_AT_BACKSTOP: "border-border bg-muted text-muted-foreground",
  WRITTEN_DOWN:
    "border-destructive/30 bg-destructive/10 text-destructive dark:text-destructive",
};

// Positions where the fixed contractual daily repayment is flowing.
// RELIEF is handled separately to show the actual reduced relief payout.
const RECEIVING_STATUSES: readonly HoldingStatus[] = [
  "ACTIVE",
  "REPAYING",
  "WATCHLIST",
  "EXTENDED",
];

export function HoldingsList({ holdings }: { holdings: Holding[] }) {
  const { locale, t } = useTranslations();

  // Ranked on the midpoint of the target range — there is no single expected
  // figure to sort on, and the midpoint keeps the ordering stable.
  const rankMap = useMemo(() => {
    const midpoint = (h: Holding) =>
      (h.target_return_pct_min + h.target_return_pct_max) / 2;
    const sorted = [...holdings].sort((a, b) => midpoint(b) - midpoint(a));
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
                    <p
                      className="truncate text-base font-bold text-foreground tracking-tight"
                      title={holding.project_name}
                    >
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
                  {isTopThree ? (
                    <Badge
                      variant="outline"
                      className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1"
                    >
                      <Medal className="h-3 w-3 text-zinc-500 shrink-0" />
                      <span>
                        {t("dashboard.investor.holdingRank", { rank })}
                      </span>
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-muted/60 text-muted-foreground text-[11px] font-medium px-2 py-0.5 rounded-full"
                    >
                      <span>
                        {t("dashboard.investor.holdingRank", { rank })}
                      </span>
                    </Badge>
                  )}

                  {/* Business score — a 0-100 reference input, not a rating */}
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                  >
                    {t("dashboard.investor.holdingScore", {
                      score: holding.score,
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
              <dl className="grid grid-cols-2 items-start gap-3 border-t border-border/60 pt-3 lg:grid-cols-4">
                <div className="min-w-0 space-y-1">
                  <dt className="stat-label">
                    {t("dashboard.investor.holdingInvested")}
                  </dt>
                  <dd className="whitespace-nowrap text-sm font-bold tabular-nums text-foreground sm:text-base">
                    {formatCurrency(holding.invested, locale)}
                  </dd>
                </div>

                <div className="min-w-0 space-y-1">
                  <dt className="stat-label">
                    {t("dashboard.investor.holdingReturned")}
                  </dt>
                  <dd className="flex items-center gap-1 whitespace-nowrap text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400 sm:text-base">
                    <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                    {formatCurrency(holding.returned, locale)}
                  </dd>
                </div>

                <div className="col-span-2 min-w-0 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 p-2.5 space-y-0.5 lg:col-span-1">
                  <dt className="stat-label text-emerald-700 dark:text-emerald-300">
                    {t("dashboard.investor.holdingRoi")}
                  </dt>
                  <dd className="break-words text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {t("dashboard.investor.holdingRoiValue", {
                      min: holding.target_return_pct_min.toFixed(1),
                      max: holding.target_return_pct_max.toFixed(1),
                      months: holding.term_months,
                    })}
                  </dd>
                  {/* A range on its own still reads as a promise without this */}
                  <p className="break-words text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    {t("dashboard.projectCard.notGuaranteed")}
                  </p>
                </div>

                <div className="col-span-2 min-w-0 space-y-1 lg:col-span-1">
                  <dt className="stat-label">
                    {t("dashboard.investor.holdingNextPayout")}
                  </dt>
                  <dd className="text-sm font-bold tabular-nums text-foreground">
                    {holding.next_payout_date ? (
                      formatDate(holding.next_payout_date, locale)
                    ) : (
                      <span className="text-muted-foreground">
                        {t("common.na")}
                      </span>
                    )}
                  </dd>
                  {/* The investor's own share of the SME's fixed daily
                      repayment — only while repayments are (or are about to
                      be) flowing. Uses the low end of the target range, and is
                      labelled a target like the yield it comes from. */}
                  {RECEIVING_STATUSES.includes(holding.status) && (
                    <p className="break-words text-xs font-semibold text-foreground">
                      {t("dashboard.investor.holdingDailyPayout", {
                        amount: formatCurrency(
                          dailyRepaymentAmount(
                            holding.invested,
                            holding.target_return_pct_min,
                            holding.term_months,
                          ),
                          locale,
                        ),
                      })}
                    </p>
                  )}
                  {/* When relief is active: show the reduced daily amount with
                      a relief qualifier, or explicitly mark relief active. */}
                  {holding.status === "RELIEF" && (
                    <p className="break-words text-xs font-semibold text-amber-700 dark:text-amber-400">
                      {holding.relief_daily_amount
                        ? t("dashboard.investor.holdingDailyPayoutRelief", {
                            amount: formatCurrency(
                              holding.relief_daily_amount,
                              locale,
                            ),
                          })
                        : t("dashboard.investor.holdingReliefActive")}
                    </p>
                  )}
                  {/* Disclosed on every position: the date at which everything
                      still outstanding falls due in full. */}
                  {holding.disbursed_at && (
                    <p className="break-words text-xs text-muted-foreground">
                      {t("dashboard.investor.holdingBackstop", {
                        date: formatDate(
                          backstopDate(
                            holding.disbursed_at,
                            holding.term_months,
                          ),
                          locale,
                        ),
                      })}
                    </p>
                  )}
                </div>
              </dl>

              {/* Repayment progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-muted-foreground">
                    {t("dashboard.investor.holdingProgress")}
                  </span>
                  <span className="font-semibold text-foreground">
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
                      // A full bar is only "good" when the money actually came
                      // back. Painting a backstop settlement or a write-down
                      // emerald would read as a successful outcome.
                      holding.status === "WRITTEN_DOWN"
                        ? "bg-destructive"
                        : holding.progress_pct === 100 &&
                            holding.status !== "SETTLED_AT_BACKSTOP"
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
