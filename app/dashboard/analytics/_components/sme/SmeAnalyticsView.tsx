"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { FlaskConical, PiggyBank, ShieldCheck, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { springItemVariants, staggerContainerVariants } from "@/lib/animations";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { RepaymentProgressChart } from "./RepaymentProgressChart";
import { RevenueShareChart } from "./RevenueShareChart";
import { GradeFactorsPanel } from "./GradeFactorsPanel";
import {
  deriveRepaymentSummary,
  MOCK_GRADE_FACTORS,
  MOCK_REPAYMENT_MONTHS,
  MOCK_SME_LOAN,
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

// FE-013. A borrower's screen, not the investor screen relabelled: one loan,
// what is left on it, how much of daily revenue it eats, and what moves the
// grade. Nothing here is a portfolio.
export function SmeAnalyticsView() {
  const { locale, t } = useTranslations();

  const summary = useMemo(
    () => deriveRepaymentSummary(MOCK_SME_LOAN, MOCK_REPAYMENT_MONTHS),
    [],
  );

  const overCeiling = summary.latest_revenue_share > REVENUE_SHARE_CEILING;

  const tiles = [
    {
      key: "outstanding",
      label: t("dashboard.smeAnalytics.kpi.outstanding"),
      value: formatCurrency(summary.outstanding, locale),
      hint: t("dashboard.smeAnalytics.kpi.outstandingHint", {
        percent: summary.progress_pct.toFixed(0),
      }),
      icon: Wallet,
      valueClassName: "text-foreground",
    },
    {
      key: "nextPayment",
      label: t("dashboard.smeAnalytics.kpi.nextPayment"),
      value: formatCurrency(MOCK_SME_LOAN.next_payment, locale),
      hint: t("dashboard.smeAnalytics.kpi.nextPaymentHint", {
        date: formatDate(MOCK_SME_LOAN.next_payment_date, locale),
      }),
      icon: PiggyBank,
      valueClassName: "text-foreground",
    },
    {
      key: "costOfCapital",
      label: t("dashboard.smeAnalytics.kpi.costOfCapital"),
      value: formatCurrency(summary.cost_of_capital, locale),
      hint: t("dashboard.smeAnalytics.kpi.costOfCapitalHint", {
        rate: MOCK_SME_LOAN.interest_rate_pct.toFixed(2),
        months: MOCK_SME_LOAN.term_months,
      }),
      icon: FlaskConical,
      valueClassName: "text-foreground",
    },
    {
      key: "earlySaving",
      label: t("dashboard.smeAnalytics.kpi.earlySaving"),
      value: formatCurrency(MOCK_SME_LOAN.early_repayment_saving, locale),
      hint: t("dashboard.smeAnalytics.kpi.earlySavingHint"),
      icon: ShieldCheck,
      valueClassName: "text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Repayment progress bar — the single most important number for a
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
                {formatCurrency(MOCK_SME_LOAN.total_obligation, locale)}
              </span>
            </p>
          </div>
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            {t("dashboard.smeAnalytics.progress.remaining", {
              days: MOCK_SME_LOAN.days_remaining,
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
          <motion.div
            className="h-full rounded-full bg-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${summary.progress_pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </Card>

      {/* KPI tiles */}
      <motion.div
        variants={staggerContainerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {tiles.map((tile) => (
          <motion.div key={tile.key} variants={springItemVariants}>
            <Card className="h-full p-5 gap-1.5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <tile.icon className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium">{tile.label}</span>
              </div>
              <span
                className={cn(
                  "truncate whitespace-nowrap text-xl font-bold tracking-tight",
                  tile.valueClassName,
                )}
              >
                {tile.value}
              </span>
              <span className="text-xs text-muted-foreground">{tile.hint}</span>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Affordability warning. Gate 8 is a soft gate in the engine, so this is
          a caution, not a failure — but an SME paying more than 30% of revenue
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title={t("dashboard.smeAnalytics.charts.repaymentTitle")}
          description={t("dashboard.smeAnalytics.charts.repaymentDesc")}
        >
          <RepaymentProgressChart
            months={MOCK_REPAYMENT_MONTHS}
            totalObligation={MOCK_SME_LOAN.total_obligation}
          />
        </ChartCard>

        <ChartCard
          title={t("dashboard.smeAnalytics.charts.revenueShareTitle")}
          description={t("dashboard.smeAnalytics.charts.revenueShareDesc", {
            ceiling: (REVENUE_SHARE_CEILING * 100).toFixed(0),
          })}
        >
          <RevenueShareChart months={MOCK_REPAYMENT_MONTHS} />
        </ChartCard>
      </div>

      <ChartCard
        title={t("dashboard.smeAnalytics.charts.gradeTitle")}
        description={t("dashboard.smeAnalytics.charts.gradeDesc", {
          grade: MOCK_SME_LOAN.grade.toFixed(2),
        })}
      >
        <GradeFactorsPanel
          factors={MOCK_GRADE_FACTORS}
          grade={MOCK_SME_LOAN.grade}
        />
      </ChartCard>
    </div>
  );
}
