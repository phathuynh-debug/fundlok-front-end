"use client";

import { Card } from "@/components/ui/card";
import { Banknote, Percent, Calendar, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format-currency";
import { staggerContainerVariants, springItemVariants } from "@/lib/animations";

interface InvestmentKpisProps {
  /** VND, unformatted. Formatted here so the figure follows the UI locale
      instead of arriving as a pre-baked string. */
  loanAmountVnd?: number;
  expectedRoi?: string;
  /** Loan term in months; rendered per locale. */
  paybackMonths?: number;
  revenueShareRate?: string;
}

export function InvestmentKpis({
  // Mock fallback while the page has no real loan attached: 1.25bn VND sits
  // inside the engine's 200M-5bn range, so it reads as a plausible loan.
  loanAmountVnd = 1_250_000_000,
  expectedRoi = "10.2%",
  // 12, not an arbitrary number: the grading engine only accepts 3/6/9/12
  // (LOAN_DURATIONS_MONTHS), so a 10-month fallback showed investors a term the
  // platform cannot actually originate.
  paybackMonths = 12,
  revenueShareRate = "8.5%",
}: InvestmentKpisProps) {
  const { locale, t } = useTranslations();

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
              {formatCurrency(loanAmountVnd, locale)}
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
            {expectedRoi}
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
            {t("investment.kpis.months", { count: paybackMonths })}
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
              {revenueShareRate}
            </div>
            <span className="text-xs text-muted-foreground block mt-1">
              {t("investment.kpis.ofDailyRevenue")}
            </span>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
