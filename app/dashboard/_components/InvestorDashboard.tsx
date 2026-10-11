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
import {
  // MOCK_HOLDINGS commented out — an investor sees the clean empty state until
  // live portfolio data exists, prompting them to invest first.
  // MOCK_HOLDINGS,
  summarizePortfolio,
  type Holding,
} from "./mock-investor-dashboard";

export function InvestorDashboard() {
  const { locale, t } = useTranslations();

  // MOCK_HOLDINGS commented out — an investor sees the clean empty state until
  // live portfolio data exists, prompting them to invest first.
  // const holdings = MOCK_HOLDINGS;
  const holdings = useMemo<Holding[]>(() => [], []);
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

      {/* Sample-data notice — only shown while there is sample data to explain */}
      {holdings.length > 0 && (
        <SampleDataNotice message={t("dashboard.investor.mockNotice")} />
      )}

      {holdings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 py-20 px-4 text-center"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
            <TrendingUp className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {t("dashboard.investor.noInvestmentsTitle")}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            {t("dashboard.investor.noInvestmentsDescription")}
          </p>
          <Button asChild className="mt-6 px-6">
            <Link href="/dashboard/projects">
              {t("dashboard.investor.browseProjects")}
            </Link>
          </Button>
        </motion.div>
      ) : (
        <>
          {/* KPI Metrics Grid with Balanced Financial Hierarchy */}
          <motion.div
            variants={staggerContainerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6"
          >
            {kpis.map((kpi, index) => {
              // Layout hierarchy:
              // Row 1: Core Financials (Total Invested, Total Returns, Weighted ROI) - 2 cols each = 6 cols
              // Row 2: Portfolio Health (Active Investments, Capital Written Down) - 3 cols each = 6 cols
              const spanClass =
                index < 3
                  ? "sm:col-span-1 xl:col-span-2"
                  : "sm:col-span-1 xl:col-span-3";

              return (
                <motion.div
                  key={kpi.key}
                  variants={springItemVariants}
                  className={spanClass}
                >
                  <Card className="h-full border bg-card transition-colors duration-200 hover:border-foreground/20 shadow-xs">
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
              );
            })}
          </motion.div>

          <motion.div
            initial={{ y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, delay: 0.2 }}
            className="space-y-4"
          >
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
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
