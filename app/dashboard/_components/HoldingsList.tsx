"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CalendarClock } from "lucide-react";
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

  return (
    <motion.ul
      variants={staggerContainerVariants}
      initial="hidden"
      animate="show"
      className="space-y-3"
    >
      {holdings.map((holding) => {
        // `list` tier: neutral surface + colored icon, pill and left rail. A
        // tinted background per row would make six positions unreadable as a
        // set — see the industry tier table in the frontend skill.
        const chrome = getIndustryChrome(holding.industry, "list");
        const Icon = chrome.icon;

        return (
          <motion.li key={holding.id} variants={springItemVariants}>
            <div
              className={cn(
                "relative flex flex-col gap-4 overflow-hidden rounded-xl border p-4 pl-5 shadow-xs transition-shadow hover:shadow-md md:p-5 md:pl-6",
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
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      chrome.badge,
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {holding.project_name}
                    </p>
                    <p className={cn("truncate text-xs", chrome.accent)}>
                      {industryLabel(holding.industry, t)}
                    </p>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-full px-2 text-[11px] font-semibold",
                    STATUS_STYLES[holding.status],
                  )}
                >
                  {t(`dashboard.investor.holdingStatus.${holding.status}`)}
                </Badge>
              </div>

              {/* Figures. min-w-0 + truncate on every money cell: a VND figure
                  carries a non-breaking space before the ₫ and so can never
                  wrap, which otherwise forces the row wider than the page at
                  high browser zoom. */}
              <dl className="grid grid-cols-2 gap-3 border-t border-border/60 pt-3 sm:grid-cols-4">
                <div className="min-w-0">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("dashboard.investor.holdingInvested")}
                  </dt>
                  <dd className="min-w-0 truncate text-sm font-bold text-foreground">
                    {formatCurrency(holding.invested, locale)}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("dashboard.investor.holdingReturned")}
                  </dt>
                  <dd className="min-w-0 truncate text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(holding.returned, locale)}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("dashboard.investor.holdingRoi")}
                  </dt>
                  <dd className="truncate text-sm font-bold text-foreground">
                    {t("dashboard.investor.holdingRoiValue", {
                      rate: holding.expected_roi_pct.toFixed(1),
                      months: holding.term_months,
                    })}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("dashboard.investor.holdingNextPayout")}
                  </dt>
                  <dd className="flex items-center gap-1 truncate text-sm font-bold text-foreground">
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
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${holding.progress_pct}%` }}
                  />
                </div>
              </div>

              <Button
                asChild
                variant="outline"
                size="sm"
                className={cn("w-full gap-1.5", CONTROL_HOVER)}
              >
                <Link href={`/dashboard/project-details?id=${holding.id}`}>
                  {t("dashboard.investor.holdingViewDetails")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
