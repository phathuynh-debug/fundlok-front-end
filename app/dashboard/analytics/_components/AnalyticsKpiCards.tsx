"use client";

import { motion } from "framer-motion";
import { Briefcase, Coins, Percent, TrendingUp } from "lucide-react";
import { springItemVariants, staggerContainerVariants } from "@/lib/animations";
import { formatCurrency } from "@/lib/format-currency";
import { useTranslations } from "@/lib/i18n";
import { TruncatedFigure } from "@/components/truncated-figure";
import type { AnalyticsKpis, RangeKey } from "./mock-analytics";

export function AnalyticsKpiCards({
  kpis,
  range,
}: {
  kpis: AnalyticsKpis;
  range: RangeKey;
}) {
  const { locale, t } = useTranslations();
  const rangeLabel = t(`dashboard.analytics.range.${range}`);

  // Stat tile contract: label, value, and a delta named against the period the
  // filter is showing. Values keep proportional figures -- tabular-nums is for
  // columns that align vertically, not standalone display numbers.
  const tiles = [
    {
      key: "deployed",
      label: t("dashboard.analytics.kpi.deployed"),
      value: formatCurrency(kpis.deployed, locale),
      delta: t("dashboard.analytics.kpi.deltaIn", {
        amount: formatCurrency(kpis.deployedInRange, locale),
        range: rangeLabel,
      }),
      icon: Coins,
      valueClassName: "text-foreground",
    },
    {
      key: "returns",
      label: t("dashboard.analytics.kpi.returns"),
      value: formatCurrency(kpis.returns, locale),
      delta: t("dashboard.analytics.kpi.deltaIn", {
        amount: formatCurrency(kpis.returnsInRange, locale),
        range: rangeLabel,
      }),
      icon: TrendingUp,
      valueClassName: "text-emerald-600 dark:text-emerald-400",
    },
    {
      key: "roi",
      label: t("dashboard.analytics.kpi.roi"),
      value: `${kpis.roi.toFixed(1)}%`,
      delta: t("dashboard.analytics.kpi.roiHint"),
      icon: Percent,
      valueClassName: "text-foreground",
    },
    {
      key: "positions",
      label: t("dashboard.analytics.kpi.positions"),
      value: String(kpis.activePositions),
      delta: t("dashboard.analytics.kpi.positionsHint"),
      icon: Briefcase,
      valueClassName: "text-foreground",
    },
  ];

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
    >
      {tiles.map((tile) => (
        <motion.div
          key={tile.key}
          variants={springItemVariants}
          className="min-w-0 bg-card text-card-foreground border border-border rounded-xl shadow-xs p-5 space-y-1"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase font-mono tracking-wider">
              {tile.label}
            </span>
            <tile.icon
              className="h-4 w-4 text-muted-foreground/70 shrink-0"
              aria-hidden="true"
            />
          </div>
          {/* A VND figure is 15-16 characters and Intl puts a NON-BREAKING
              space before the ₫, so the string can never wrap. Left alone it
              sets a 192px min-content width on the card (measured in Geist at the
              old text-2xl/900), the grid refuses to
              shrink below it, and at 125% browser zoom the whole page becomes
              wider than the viewport -- which is what clipped the ₫ here and
              cut the last table column off screen. min-w-0 + truncate lets the
              card shrink; the smaller step keeps the figure whole in practice. */}
          <TruncatedFigure
            value={tile.value}
            className={`text-xl font-black ${tile.valueClassName}`}
          />
          <p className="text-xs text-muted-foreground">{tile.delta}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
