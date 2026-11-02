"use client";

import { useMemo } from "react";
import { m } from "framer-motion";
import {
  FlaskConical,
  PiggyBank,
  ShieldAlert,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { springItemVariants, staggerContainerVariants } from "@/lib/animations";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type {
  RepaymentMonth,
  ScoreFactor,
  SmeFacility,
} from "@/services/portfolio.service";
import { RepaymentProgressChart } from "./RepaymentProgressChart";
import { RevenueShareChart } from "./RevenueShareChart";
import { ScoreFactorsPanel } from "./ScoreFactorsPanel";
import {
  deriveRepaymentSummary,
  REVENUE_SHARE_CEILING,
} from "./mock-sme-analytics";

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card text-card-foreground border border-border rounded-xl shadow-xs p-5 space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

// FE-013. A borrower's screen, not the investor screen relabelled: one loan
// (the sum of its investments, each repaying on its own), what is left on it,
// how much of its revenue it takes, and what makes up the business score.
// Nothing here is a portfolio. The revenue share needs the revenue the loan
// was sized on, and the score panel a locked score: each is left out without.
export function SmeAnalyticsView({
  facility,
  months,
  factors,
  revenueBasis,
}: {
  facility: SmeFacility;
  months: RepaymentMonth[];
  factors: ScoreFactor[];
  /** The average monthly revenue the loan was sized on; null without one. */
  revenueBasis: number | null;
}) {
  const { locale, t } = useTranslations();

  const summary = useMemo(
    () => deriveRepaymentSummary(facility, months),
    [facility, months],
  );

  const overCeiling =
    revenueBasis !== null &&
    summary.latest_revenue_share > REVENUE_SHARE_CEILING;

  const tiles = [
    {
      key: "outstanding",
      label: t("dashboard.smeAnalytics.kpi.outstanding"),
      value: formatCurrency(summary.outstanding, locale),
      hint: t("dashboard.smeAnalytics.kpi.outstandingHint", {
        percent: summary.progress_pct.toFixed(0),
      }),
      icon: Wallet,
    },
    {
      // The unit of repayment is the business day, not the month. Showing a
      // monthly "next payment" describes a product we do not sell.
      key: "dailyRepayment",
      label: t("dashboard.smeAnalytics.kpi.dailyRepayment"),
      value: formatCurrency(facility.target_daily, locale),
      hint: t("dashboard.smeAnalytics.kpi.dailyRepaymentHint", {
        total: formatCurrency(facility.current_period_total, locale),
        date: formatDate(facility.current_period_end_date, locale),
      }),
      icon: PiggyBank,
    },
    {
      // The SME has known this date since signing; the screen should not be
      // the place they find out it exists.
      key: "backstop",
      label: t("dashboard.smeAnalytics.kpi.backstop"),
      value: formatDate(summary.backstop_date, locale),
      hint: t("dashboard.smeAnalytics.kpi.backstopHint"),
      icon: ShieldAlert,
    },
    {
      key: "costOfCapital",
      label: t("dashboard.smeAnalytics.kpi.costOfCapital"),
      value: formatCurrency(summary.cost_of_capital, locale),
      hint: t("dashboard.smeAnalytics.kpi.costOfCapitalHint", {
        rate: facility.interest_rate_pct.toFixed(2),
        months: facility.term_months,
      }),
      icon: FlaskConical,
    },
    {
      // Handbook §5.9: the total is fixed at approval and settling early
      // clears what is left with no rebate — "no prepayment penalty", never
      // "pay early, pay less". The tile shows what closing today costs.
      key: "earlyPayoff",
      label: t("dashboard.smeAnalytics.kpi.earlyPayoff"),
      value: formatCurrency(summary.outstanding, locale),
      hint: t("dashboard.smeAnalytics.kpi.earlyPayoffHint"),
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="space-y-6" data-testid="sme-analytics">
      {/* Repayment progress — the single most important number for a
          borrower, so it leads and is not buried in a chart. */}
      <Card className="p-5 gap-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.smeAnalytics.progress.label")}
            </p>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {formatCurrency(summary.repaid, locale)}
              <span className="text-sm font-medium text-muted-foreground">
                {" / "}
                {formatCurrency(facility.total_obligation, locale)}
              </span>
            </p>
          </div>
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            {t("dashboard.smeAnalytics.progress.remaining", {
              days: facility.days_remaining,
            })}
          </p>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={Math.round(summary.progress_pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t("dashboard.smeAnalytics.progress.label")}
        >
          <m.div
            className="h-full rounded-full bg-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${summary.progress_pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </Card>

      <m.div
        variants={staggerContainerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4"
      >
        {tiles.map((tile) => (
          <m.div key={tile.key} variants={springItemVariants}>
            <Card className="h-full p-5 gap-1.5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <tile.icon className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium">{tile.label}</span>
              </div>
              <span
                className={cn(
                  "truncate whitespace-nowrap text-xl font-bold tracking-tight text-foreground",
                )}
              >
                {tile.value}
              </span>
              <span className="text-xs text-muted-foreground">{tile.hint}</span>
            </Card>
          </m.div>
        ))}
      </m.div>

      {/* Affordability. Gate 8 is a soft gate in the engine, so this is a
          caution, not a failure — but an SME paying more than 30% of revenue
          should hear it plainly. */}
      {overCeiling && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
          <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            {t("dashboard.smeAnalytics.overCeiling", {
              percent: (summary.latest_revenue_share * 100).toFixed(0),
              ceiling: (REVENUE_SHARE_CEILING * 100).toFixed(0),
            })}
          </p>
        </div>
      )}

      <div
        className={cn(
          "grid grid-cols-1 gap-6",
          revenueBasis !== null && "lg:grid-cols-2",
        )}
      >
        <ChartCard
          title={t("dashboard.smeAnalytics.charts.repaymentTitle")}
          description={t("dashboard.smeAnalytics.charts.repaymentDesc")}
        >
          <RepaymentProgressChart
            months={months}
            totalObligation={facility.total_obligation}
          />
        </ChartCard>

        {revenueBasis !== null && (
          <ChartCard
            title={t("dashboard.smeAnalytics.charts.revenueShareTitle")}
            description={t("dashboard.smeAnalytics.charts.revenueShareDesc", {
              ceiling: (REVENUE_SHARE_CEILING * 100).toFixed(0),
            })}
          >
            <RevenueShareChart months={months} />
          </ChartCard>
        )}
      </div>

      {facility.score !== null && factors.length > 0 && (
        <ChartCard
          title={t("dashboard.smeAnalytics.charts.scoreTitle")}
          description={t("dashboard.smeAnalytics.charts.scoreDesc", {
            score: facility.score.toFixed(2),
          })}
        >
          <ScoreFactorsPanel factors={factors} score={facility.score} />
        </ChartCard>
      )}
    </div>
  );
}
