"use client";

import { Card } from "@/components/ui/card";
import { Banknote, Percent, Calendar, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format-currency";
import { dailyRepaymentAmount } from "@/lib/facility-terms";
import { staggerContainerVariants, springItemVariants } from "@/lib/animations";

interface InvestmentKpisProps {
  /** VND, unformatted. Formatted here so the figure follows the UI locale
      instead of arriving as a pre-baked string. */
  loanAmountVnd?: number;
  /** All-in annual rate, e.g. 10.2 for 10.2%. */
  interestRatePct?: number;
  /** Loan term in months; rendered per locale. */
  paybackMonths?: number;
  revenueShareRate?: string;
}

export function InvestmentKpis({
  loanAmountVnd,
  interestRatePct,
  paybackMonths,
  revenueShareRate,
}: InvestmentKpisProps) {
  const { locale, t } = useTranslations();

  // If no loan data is passed at all, use the coherent mock set for demo previews.
  // When a real project provides an amount but contract terms (rate, duration)
  // are still pending, do not mix real principal with mock terms.
  const isDemo =
    loanAmountVnd === undefined &&
    interestRatePct === undefined &&
    paybackMonths === undefined &&
    revenueShareRate === undefined;

  const displayAmount = isDemo ? 800_000_000 : loanAmountVnd;
  const displayRate = isDemo ? 10.2 : interestRatePct;
  const displayMonths = isDemo ? 6 : paybackMonths;
  const displayRevShare = isDemo ? "8.5%" : revenueShareRate;

  // What the SME pays across the whole loan each business day — only derived
  // when amount, rate and term are all present so figures strictly reconcile.
  const dailyObligationVnd =
    displayAmount !== undefined &&
    displayRate !== undefined &&
    displayMonths !== undefined
      ? dailyRepaymentAmount(displayAmount, displayRate, displayMonths)
      : null;

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="show"
      className="grid gap-4 grid-cols-2 md:grid-cols-4"
    >
      {/* Loan Amount — spans both mobile columns: a 10-digit VND figure does
          not fit half a phone screen at a readable size. */}
      <motion.div
        variants={springItemVariants}
        className="col-span-2 md:col-span-1 h-full"
      >
        <Card className="p-5 md:p-6 bg-card border flex flex-col justify-between h-full min-h-32 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Banknote className="h-4 w-4" />
            <span className="text-sm font-medium">
              {t("investment.kpis.loanAmount")}
            </span>
          </div>
          {/* whitespace-nowrap: never break a money figure across lines.
              The responsive scale keeps ten digits inside the card at every
              breakpoint; min-w-0 + truncate is the last-resort guard so a
              longer value clips at the card edge rather than overflowing it. */}
          <div className="min-w-0 mt-2">
            <div className="truncate whitespace-nowrap text-2xl md:text-xl font-bold tracking-tight text-foreground">
              {displayAmount !== undefined
                ? formatCurrency(displayAmount, locale)
                : t("common.na")}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Expected ROI */}
      <motion.div variants={springItemVariants} className="h-full">
        <Card className="p-5 md:p-6 bg-card border flex flex-col justify-between h-full min-h-32 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Percent className="h-4 w-4" />
            <span className="text-sm font-medium">
              {t("investment.kpis.expectedRoi")}
            </span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-emerald-600 mt-2">
            {displayRate !== undefined
              ? `${displayRate.toFixed(1)}%`
              : t("common.na")}
          </div>
        </Card>
      </motion.div>

      {/* Est. Payback Period */}
      <motion.div variants={springItemVariants} className="h-full">
        <Card className="p-5 md:p-6 bg-card border flex flex-col justify-between h-full min-h-32 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">
              {t("investment.kpis.estPaybackPeriod")}
            </span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-foreground mt-2">
            {displayMonths !== undefined
              ? t("investment.kpis.months", { count: displayMonths })
              : t("common.na")}
          </div>
        </Card>
      </motion.div>

      {/* Revenue Share Rate */}
      <motion.div variants={springItemVariants} className="h-full">
        <Card className="p-5 md:p-6 bg-card border flex flex-col justify-between h-full min-h-32 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-sm font-medium">
              {t("investment.kpis.revenueShareRate")}
            </span>
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight text-foreground mt-1">
              {displayRevShare ?? t("common.na")}
            </div>
            {displayRevShare && (
              <span className="text-xs text-muted-foreground block mt-1">
                {t("investment.kpis.ofDailyRevenue")}
              </span>
            )}
          </div>
          {/* The % is the share of revenue; this is the fixed amount it comes
              to each business day. */}
          <div className="mt-3 min-w-0 border-t border-border pt-3">
            <span className="text-xs font-medium text-muted-foreground block">
              {t("investment.kpis.dailyObligation")}
            </span>
            <div className="truncate whitespace-nowrap text-base font-bold text-foreground">
              {dailyObligationVnd !== null
                ? formatCurrency(dailyObligationVnd, locale)
                : t("common.na")}
            </div>
            {dailyObligationVnd !== null && (
              <span className="text-xs text-muted-foreground block">
                {t("investment.kpis.perBusinessDay")}
              </span>
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
