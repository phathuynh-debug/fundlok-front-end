"use client";

import { Card } from "@/components/ui/card";
import { Banknote, Percent, Calendar, ShieldCheck } from "lucide-react";
import { m } from "framer-motion";
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
  /** The listing's minimum ticket, VND. Not shown when absent: it used to be
      derived as 1% of the amount, which disagreed with the real listing. */
  minTicketVnd?: number | null;
}

export function InvestmentKpis({
  loanAmountVnd,
  interestRatePct,
  paybackMonths,
  revenueShareRate,
  minTicketVnd,
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
    <m.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="show"
      className="grid gap-4 grid-cols-2 md:grid-cols-4"
    >
      {/* Loan Amount — spans both mobile columns: a 10-digit VND figure does
          not fit half a phone screen at a readable size. */}
      <m.div
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
            {minTicketVnd != null && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {t("dashboard.projectCard.minTicket", {
                  amount: formatCurrency(minTicketVnd, locale),
                })}
              </p>
            )}
          </div>
        </Card>
      </m.div>

      {/* Expected ROI */}
      <m.div variants={springItemVariants} className="h-full">
        <Card className="p-5 md:p-6 bg-card border flex flex-col justify-between h-full min-h-32 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Percent className="h-4 w-4" />
            <span className="text-sm font-medium">
              {t("investment.kpis.expectedRoi")}
            </span>
          </div>
          <div className="min-w-0 mt-2">
            <div className="truncate whitespace-nowrap text-2xl md:text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {displayRate !== undefined
                ? `${displayRate.toFixed(1)}%`
                : t("common.na")}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {t("dashboard.projectCard.notGuaranteed")}
            </p>
          </div>
        </Card>
      </m.div>

      {/* Est. Payback Period */}
      <m.div variants={springItemVariants} className="h-full">
        <Card className="p-5 md:p-6 bg-card border flex flex-col justify-between h-full min-h-32 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">
              {t("investment.kpis.estPaybackPeriod")}
            </span>
          </div>
          <div className="min-w-0 mt-2">
            <div className="truncate whitespace-nowrap text-2xl md:text-xl font-bold tracking-tight text-foreground">
              {displayMonths !== undefined
                ? t("investment.kpis.months", { count: displayMonths })
                : t("common.na")}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {t("dashboard.projectCard.dailyRepayment")}
            </p>
          </div>
        </Card>
      </m.div>

      {/* Revenue Share Rate */}
      <m.div variants={springItemVariants} className="h-full">
        <Card className="p-5 md:p-6 bg-card border flex flex-col justify-between h-full min-h-32 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-sm font-medium">
              {t("investment.kpis.revenueShareRate")}
            </span>
          </div>
          <div className="min-w-0 mt-2">
            <div className="truncate whitespace-nowrap text-2xl md:text-xl font-bold tracking-tight text-foreground">
              {displayRevShare ?? t("common.na")}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {dailyObligationVnd !== null
                ? `${t("investment.kpis.dailyObligation")}: ${formatCurrency(dailyObligationVnd, locale)}`
                : t("investment.kpis.ofDailyRevenue")}
            </p>
          </div>
        </Card>
      </m.div>
    </m.div>
  );
}
