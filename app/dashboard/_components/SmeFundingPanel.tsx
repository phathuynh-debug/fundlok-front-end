"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Banknote,
  CalendarClock,
  Landmark,
  ShieldAlert,
  Users,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TruncatedFigure } from "@/components/truncated-figure";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getIndustryChrome } from "./sme-dashboard-config";
import { SampleDataNotice } from "./SampleDataNotice";
import {
  MOCK_REPAYMENT_PERIODS,
  MOCK_SME_FUNDING,
  periodTotal,
  summarizeFunding,
  type RepaymentPeriodStatus,
} from "./mock-sme-funding";

// Collected periods recede and the current one is emphasised. Relief gets its
// own amber treatment — it is neither a success nor a failure, it is the
// facility doing what it promised when revenue came in short.
const STATUS_STYLES: Record<RepaymentPeriodStatus, string> = {
  SETTLED: "border-border bg-muted text-muted-foreground",
  RELIEF_APPLIED:
    "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  CURRENT: "border-primary/20 bg-primary/10 text-primary",
  UPCOMING: "border-border bg-muted text-muted-foreground",
};

export function SmeFundingPanel({ industry }: { industry?: string | null }) {
  const { locale, t } = useTranslations();

  const funding = MOCK_SME_FUNDING;
  const periods = MOCK_REPAYMENT_PERIODS;
  const summary = useMemo(
    () => summarizeFunding(funding, periods),
    [funding, periods],
  );

  // `inline` tier — icon/text color only. The hero card above already wears the
  // full industry treatment; a second tinted surface would compete with it.
  const accent = getIndustryChrome(industry, "inline").accent;

  const stats = [
    {
      key: "outstanding",
      label: t("dashboard.smeFunding.outstanding"),
      value: formatCurrency(summary.outstanding, locale),
      icon: Landmark,
    },
    {
      key: "repaid",
      label: t("dashboard.smeFunding.repaid"),
      value: formatCurrency(summary.repaid, locale),
      icon: Banknote,
    },
    {
      // The daily amount IS the repayment — not a monthly instalment.
      key: "dailyAmount",
      label: t("dashboard.smeFunding.dailyAmount"),
      value: formatCurrency(
        summary.current?.daily_amount ?? funding.daily_amount,
        locale,
      ),
      hint: t("dashboard.smeFunding.perBusinessDay"),
      note: t("dashboard.smeFunding.ofDailyRevenue", {
        percent: Math.round(funding.revenue_share * 100),
      }),
      icon: CalendarClock,
    },
    {
      key: "rate",
      label: t("dashboard.smeFunding.rate"),
      value: t("dashboard.smeFunding.rateValue", {
        rate: funding.interest_rate_pct.toFixed(1),
        score: funding.score,
      }),
      hint: t("dashboard.smeFunding.allInRate"),
      icon: Zap,
      // Rate and score are two facts in one string: wrap, never clip.
      wraps: true,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15 }}
      className="space-y-4"
    >
      <SampleDataNotice message={t("dashboard.smeFunding.mockNotice")} />

      <Card className="gap-0 p-5 md:p-6">
        <div className="flex flex-col gap-1 pb-5">
          <h3 className="text-base font-semibold text-foreground">
            {t("dashboard.smeFunding.title")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.smeFunding.subtitle")}
          </p>
        </div>

        {/* Funding progress against the ask */}
        <div className="space-y-2 border-t border-border pt-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="stat-label">{t("dashboard.smeFunding.raised")}</p>
              {/* Deliberately wraps instead of truncating: this line carries
                  two separate facts (raised and target), and clipping it would
                  hide one of them behind an ellipsis with no way to see it.
                  Wrapping loses nothing. */}
              <p className="text-xl font-bold text-foreground">
                {formatCurrency(funding.funded, locale)}
                <span className="ml-1.5 text-sm font-medium text-muted-foreground">
                  {t("dashboard.smeFunding.ofTarget", {
                    target: formatCurrency(funding.requested, locale),
                  })}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Users className={cn("h-4 w-4", accent)} />
                {t("dashboard.smeFunding.investors", {
                  count: funding.investor_count,
                })}
              </span>
              <span className="font-bold text-foreground">
                {summary.funded_pct}%
              </span>
            </div>
          </div>
          <div
            className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={summary.funded_pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t("dashboard.smeFunding.raised")}
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${summary.funded_pct}%` }}
            />
          </div>
        </div>

        {/* Money summary. Two across on small screens, four only from xl — a
            VND figure cannot wrap, so four narrow columns clip it at zoom. */}
        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-5 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.key} className="min-w-0">
              <dt className="stat-label flex items-start gap-1.5">
                <stat.icon className="mt-px h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0 break-words">{stat.label}</span>
              </dt>
              <dd className="mt-1 min-w-0">
                {stat.wraps ? (
                  <span className="block break-words text-lg font-bold tabular-nums text-foreground">
                    {stat.value}
                  </span>
                ) : (
                  <TruncatedFigure
                    value={stat.value}
                    className="text-lg font-bold tabular-nums text-foreground"
                  />
                )}
              </dd>
              {stat.hint && (
                <p className="break-words text-xs text-muted-foreground">
                  {stat.hint}
                </p>
              )}
              {stat.note && (
                // Wraps rather than truncating: clipping would hide the %.
                <p className="text-xs font-semibold text-foreground">
                  {stat.note}
                </p>
              )}
            </div>
          ))}
        </dl>

        {/* The two facts an SME is entitled to know from the day they sign:
            what the total is (and that it only goes up if the term stretches),
            and the date at which anything still outstanding falls due in full. */}
        <dl className="mt-5 grid grid-cols-1 gap-4 border-t border-border pt-5 sm:grid-cols-2">
          <div className="min-w-0">
            <dt className="stat-label">
              {t("dashboard.smeFunding.totalRepayable")}
            </dt>
            <dd className="mt-1 min-w-0">
              <TruncatedFigure
                value={formatCurrency(summary.total_repayable, locale)}
                className="text-lg font-bold tabular-nums text-foreground"
              />
            </dd>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("dashboard.smeFunding.fixedAtSigning")}
            </p>
            {summary.extra_interest > 0 && (
              <p className="mt-0.5 text-xs font-semibold text-foreground">
                {t("dashboard.smeFunding.stretchNote", {
                  amount: formatCurrency(summary.extra_interest, locale),
                  days: summary.extra_business_days,
                })}
              </p>
            )}
          </div>
          <div className="min-w-0">
            <dt className="stat-label flex items-start gap-1.5">
              <ShieldAlert className="mt-px h-3.5 w-3.5 shrink-0" />
              {t("dashboard.smeFunding.backstopDate")}
            </dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-foreground">
              {summary.backstop_date
                ? formatDate(summary.backstop_date, locale)
                : t("common.na")}
            </dd>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("dashboard.smeFunding.backstopHint")}
            </p>
          </div>
        </dl>

        {/* Repayment periods — each one a run of business days at a fixed
            daily amount, with the true-up applied at the end of it. */}
        <div className="mt-5 border-t border-border pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
            <h4 className="text-sm font-semibold text-foreground">
              {t("dashboard.smeFunding.scheduleTitle")}
            </h4>
            <span className="text-xs text-muted-foreground">
              {t("dashboard.smeFunding.scheduleProgress", {
                done: summary.settled_count,
                total: summary.total_count,
              })}
            </span>
          </div>

          <ul className="divide-y divide-border border-t border-border">
            {periods.map((period) => (
              <li
                key={period.number}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                    {period.number}
                  </span>
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium tabular-nums text-foreground">
                      {t("dashboard.smeFunding.periodRange", {
                        start: formatDate(period.start_date, locale),
                        end: formatDate(period.end_date, locale),
                      })}
                    </p>
                    <p className="break-words text-xs text-muted-foreground">
                      {t("dashboard.smeFunding.perDay", {
                        amount: formatCurrency(period.daily_amount, locale),
                        days: period.business_days,
                      })}
                    </p>
                    {/* Says out loud that relief moved DOWN and what it cost:
                        nothing off the total, only more time. */}
                    {period.contractual_daily_amount && (
                      <p className="break-words text-xs text-amber-700 dark:text-amber-400">
                        {t("dashboard.smeFunding.reliefApplied", {
                          from: formatCurrency(
                            period.contractual_daily_amount,
                            locale,
                          ),
                        })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Wraps: the Vietnamese status labels are long enough to
                    push the badge past the card edge on a phone. */}
                <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 pl-10 sm:pl-0">
                  <span className="whitespace-nowrap text-sm font-bold tabular-nums text-foreground">
                    {formatCurrency(periodTotal(period), locale)}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "max-w-full whitespace-normal rounded-full px-2 text-left text-[11px] font-semibold",
                      STATUS_STYLES[period.status],
                    )}
                  >
                    {t(`dashboard.smeFunding.status.${period.status}`)}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>

          {/* Early settlement is "no penalty", never a discount. Saying so here
              is cheaper than an SME discovering it at settlement. */}
          <p className="pt-3 text-xs text-muted-foreground">
            {t("dashboard.smeFunding.earlyRepaymentNote")}
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
