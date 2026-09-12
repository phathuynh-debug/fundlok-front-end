"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Layers,
  TrendingUp,
  TrendingDown,
  Banknote,
  Percent,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTranslations } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format-currency";
import {
  pageTransitionProps,
  fadeInUpProps,
  staggerContainerVariants,
  springItemVariants,
} from "@/lib/animations";
import { TruncatedFigure } from "@/components/truncated-figure";
import { HoldingsList } from "./HoldingsList";
import { SampleDataNotice } from "./SampleDataNotice";
import { MOCK_HOLDINGS, summarizePortfolio } from "./mock-investor-dashboard";

export function InvestorDashboard() {
  const { locale, t } = useTranslations();

  // Sample data until a portfolio API exists — see mock-investor-dashboard.ts.
  // Shaped as "fetch then summarize" so swapping MOCK_HOLDINGS for a hook is a
  // one-line change and the summary logic survives untouched.
  const holdings = MOCK_HOLDINGS;
  const summary = useMemo(() => summarizePortfolio(holdings), [holdings]);

  // `caption` carries the qualifier a figure cannot be shown without — a
  // target range needs "not guaranteed", a loss figure needs who bears it.
  const kpis: {
    key: string;
    label: string;
    value: string;
    caption?: string;
    icon: LucideIcon;
    iconClassName: string;
  }[] = [
    {
      key: "totalInvested",
      label: t("dashboard.investor.totalInvested"),
      value: formatCurrency(summary.total_invested, locale),
      icon: Banknote,
      iconClassName: "text-blue-500",
    },
    {
      key: "activeInvestments",
      label: t("dashboard.investor.activeInvestments"),
      value: String(summary.active_count),
      icon: Layers,
      iconClassName: "text-emerald-500",
    },
    {
      key: "totalReturns",
      label: t("dashboard.investor.totalReturns"),
      value: formatCurrency(summary.total_returns, locale),
      icon: TrendingUp,
      iconClassName: "text-purple-500",
    },
    {
      key: "weightedRoi",
      label: t("dashboard.investor.weightedRoi"),
      // A range, not a point figure, and captioned as a target — a single
      // headline percent on a portfolio reads as what the portfolio pays.
      value: t("dashboard.investor.weightedRoiValue", {
        min: summary.weighted_target_min_pct.toFixed(1),
        max: summary.weighted_target_max_pct.toFixed(1),
      }),
      caption: t("dashboard.projectCard.notGuaranteed"),
      icon: Percent,
      iconClassName: "text-amber-500",
    },
    {
      // Sits beside the returns figure on purpose: "total returned" alone
      // implies every position returns something.
      key: "capitalWrittenDown",
      label: t("dashboard.investor.capitalWrittenDown"),
      value: formatCurrency(summary.capital_written_down, locale),
      caption: t("dashboard.investor.investorBearsLoss"),
      icon: TrendingDown,
      iconClassName: "text-destructive",
    },
  ];

  return (
    <motion.div
      {...pageTransitionProps}
      className="flex-1 space-y-6 md:space-y-8 p-4 md:p-8 pt-6"
    >
      {/* Header */}
      <motion.div {...fadeInUpProps}>
        <h2 className="text-3xl font-bold tracking-tight">
          {t("dashboard.investor.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          {t("dashboard.investor.subtitle")}
        </p>
      </motion.div>

      <SampleDataNotice message={t("dashboard.investor.mockNotice")} />

      {/* KPI Metrics Grid with Staggered Entrance Animation.
          Four across only from xl: at 125% browser zoom a four-column grid
          leaves ~170px per card, and a VND figure needs 160px+ and cannot wrap
          (Intl puts a non-breaking space before the ₫). */}
      <motion.div
        variants={staggerContainerVariants}
        initial="hidden"
        animate="show"
        // Stays at four across even though there are now five KPIs: a VND
        // figure cannot wrap, and a fifth column narrows every card enough to
        // clip it. The fifth tile wraps to a second row instead.
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {kpis.map((kpi) => (
          <motion.div key={kpi.key} variants={springItemVariants}>
            <Card className="h-full hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="min-w-0 space-y-1">
                <div className="flex min-w-0 items-center gap-2">
                  <kpi.icon
                    className={`h-6 w-6 shrink-0 ${kpi.iconClassName}`}
                  />
                  <TruncatedFigure
                    value={kpi.value}
                    className="text-2xl font-bold"
                  />
                </div>
                {kpi.caption && (
                  <p className="text-[11px] leading-snug text-muted-foreground">
                    {kpi.caption}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Holdings, or the real empty state when there are none. The empty
          branch is kept live: it is what a genuinely new investor sees once
          this reads from the API. */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="space-y-4"
      >
        {holdings.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-lg border border-dashed flex flex-col items-center justify-center p-6">
            <TrendingUp className="h-10 w-10 text-muted-foreground/60 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t("dashboard.investor.noInvestmentsTitle")}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {t("dashboard.investor.noInvestmentsDescription")}
            </p>
            <Button asChild className="px-6">
              <Link href="/dashboard/projects">
                {t("dashboard.investor.browseProjects")}
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-foreground">
                {t("dashboard.investor.holdingsTitle", {
                  count: holdings.length,
                })}
              </h3>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/projects">
                  {t("dashboard.investor.browseProjects")}
                </Link>
              </Button>
            </div>
            <HoldingsList holdings={holdings} />
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
