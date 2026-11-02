"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { BarChart3, PieChart, TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireAuth } from "@/hooks/use-authentication";
import { useBusinessAnalytics, useMyAnalytics } from "@/hooks/use-portfolio";
import { pageTransitionProps } from "@/lib/animations";
import { useTranslations } from "@/lib/i18n";
import { AnalyticsKpiCards } from "./_components/AnalyticsKpiCards";
import { AnalyticsTableView } from "./_components/AnalyticsTableView";
import { CapitalFlowChart } from "./_components/CapitalFlowChart";
import { CapitalStatusChart } from "./_components/CapitalStatusChart";
import { IndustryAllocationChart } from "./_components/IndustryAllocationChart";
import { IndustrySplitChart } from "./_components/IndustrySplitChart";
import { MonthlyReturnsChart } from "./_components/MonthlyReturnsChart";
import { SmeAnalyticsView } from "./_components/sme/SmeAnalyticsView";
import {
  deriveKpis,
  sliceByRange,
  totalAllocated,
  type RangeKey,
} from "./_components/mock-analytics";
import type {
  CapitalStatusAllocation,
  IndustryAllocation,
  MonthlyPoint,
} from "@/services/portfolio.service";
import { CONTROL_IDLE } from "@/lib/ui-tokens";

const RANGES: RangeKey[] = ["3M", "6M", "12M"];

// Nothing yet. Module-level so their identity is stable across renders (the
// useMemos below depend on them).
const NO_POINTS: MonthlyPoint[] = [];
const NO_ALLOCATION: IndustryAllocation[] = [];
const NO_CAPITAL_STATUS: CapitalStatusAllocation[] = [];

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-xl p-5 space-y-2 shadow-xs"
          >
            <Skeleton className="h-3 w-20 rounded-sm" />
            <Skeleton className="h-7 w-28 rounded-md" />
            <Skeleton className="h-3 w-24 rounded-sm" />
          </div>
        ))}
      </div>
      <Skeleton className="h-[360px] w-full rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[360px] w-full rounded-xl" />
        <Skeleton className="h-[360px] w-full rounded-xl" />
        <Skeleton className="h-[360px] w-full rounded-xl" />
        <Skeleton className="h-[360px] w-full rounded-xl" />
      </div>
    </div>
  );
}

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
    <section className="bg-card text-card-foreground border border-border/80 rounded-2xl shadow-xs overflow-hidden">
      <div className="px-5 py-4 border-b border-border/50 bg-muted/10 space-y-0.5">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function AnalyticsClient() {
  const { user, isLoading: isAuthLoading } = useRequireAuth();
  const { t } = useTranslations();

  // FE-013: an SME gets a different screen, not this one relabelled. A borrower
  // has one loan and no portfolio, so capital-deployed / returns / allocation
  // answer nothing for them — see _components/sme/mock-sme-analytics.ts.
  const isSme = user?.role === "SME";

  // Local UI state only -- nothing here round-trips to the server.
  const [range, setRange] = useState<RangeKey>("12M");
  const [view, setView] = useState<"charts" | "table">("charts");

  // An investor's real portfolio, from their investments and the days the
  // businesses repaid them; a business's loan, from its investments and the
  // days it repaid them, on its own screen (one loan, not a portfolio).
  // Before any of that, the empty state below.
  const isInvestor = user?.role === "INVESTOR";
  const analytics = useMyAnalytics(isInvestor);
  const loan = useBusinessAnalytics(isSme);
  const facility = isSme ? (loan.data?.facility ?? null) : null;
  const data = isInvestor ? analytics.data : undefined;
  const monthly = data?.monthly ?? NO_POINTS;
  const allocation = data?.allocation ?? NO_ALLOCATION;
  const capitalStatus = data?.capital_status ?? NO_CAPITAL_STATUS;
  const points = useMemo(() => sliceByRange(monthly, range), [monthly, range]);
  const kpis = useMemo(
    () =>
      deriveKpis(points, {
        activePositions: data?.active_positions ?? 0,
        // Earnings to date over the whole series, not only the range shown.
        earned: monthly.reduce((sum, p) => sum + p.yield_monthly, 0),
      }),
    [points, monthly, data?.active_positions],
  );
  const allocationTotal = useMemo(
    () => totalAllocated(allocation),
    [allocation],
  );

  return (
    <m.div {...pageTransitionProps} className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {t(
              isSme
                ? "dashboard.smeAnalytics.title"
                : "dashboard.analytics.title",
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            {t(
              isSme
                ? "dashboard.smeAnalytics.subtitle"
                : "dashboard.analytics.subtitle",
            )}
          </p>
        </div>
      </div>

      {isAuthLoading ||
      (isInvestor && analytics.isLoading) ||
      (isSme && loan.isLoading) ? (
        <AnalyticsSkeleton />
      ) : (isSme ? facility === null : points.length === 0) ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 py-20 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
            <BarChart3 className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {t(
              isSme
                ? "dashboard.analytics.smeEmptyTitle"
                : "dashboard.analytics.emptyTitle",
            )}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {t(
              isSme
                ? "dashboard.analytics.smeEmptyDescription"
                : "dashboard.analytics.emptyDescription",
            )}
          </p>
          <Button asChild className="mt-6 px-6">
            <Link href={isSme ? "/project-application" : "/dashboard/projects"}>
              {t(
                isSme
                  ? "dashboard.analytics.smeEmptyAction"
                  : "dashboard.analytics.emptyAction",
              )}
            </Link>
          </Button>
        </div>
      ) : isSme && facility ? (
        <SmeAnalyticsView
          facility={facility}
          months={loan.data?.months ?? []}
          factors={loan.data?.score_factors ?? []}
          revenueBasis={loan.data?.revenue_basis_vnd ?? null}
        />
      ) : (
        <>
          {/* One filter row above everything it scopes -- the range applies to
                the KPIs and every chart at once, never per-card. */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200/50 dark:border-zinc-800/40 w-fit flex items-center gap-1">
              {RANGES.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRange(option)}
                  aria-pressed={range === option}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all duration-200 cursor-pointer ${
                    range === option
                      ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs border border-border/10 font-semibold"
                      : `${CONTROL_IDLE} bg-transparent border border-transparent font-medium`
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200/50 dark:border-zinc-800/40 w-fit flex items-center gap-1">
              {(
                [
                  {
                    key: "charts",
                    label: t("dashboard.analytics.view.charts"),
                    icon: PieChart,
                  },
                  {
                    key: "table",
                    label: t("dashboard.analytics.view.table"),
                    icon: TableIcon,
                  },
                ] as const
              ).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setView(key)}
                  aria-pressed={view === key}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                    view === key
                      ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs border border-border/10 font-semibold"
                      : `${CONTROL_IDLE} bg-transparent border border-transparent font-medium`
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <AnalyticsKpiCards kpis={kpis} range={range} />

          {view === "charts" ? (
            <div className="space-y-6">
              <ChartCard
                title={t("dashboard.analytics.charts.capitalFlowTitle")}
                description={t("dashboard.analytics.charts.capitalFlowDesc")}
              >
                <CapitalFlowChart points={points} />
              </ChartCard>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard
                  title={t("dashboard.analytics.charts.monthlyReturnsTitle")}
                  description={t(
                    "dashboard.analytics.charts.monthlyReturnsDesc",
                  )}
                >
                  <MonthlyReturnsChart points={points} />
                </ChartCard>

                <ChartCard
                  title={t("dashboard.analytics.charts.allocationTitle")}
                  description={t("dashboard.analytics.charts.allocationDesc")}
                >
                  <IndustryAllocationChart
                    allocation={allocation}
                    total={allocationTotal}
                  />
                </ChartCard>

                <ChartCard
                  title={t("dashboard.analytics.charts.splitTitle")}
                  description={t("dashboard.analytics.charts.splitDesc")}
                >
                  <IndustrySplitChart
                    allocation={allocation}
                    total={allocationTotal}
                  />
                </ChartCard>

                <ChartCard
                  title={t("dashboard.analytics.charts.statusTitle")}
                  description={t("dashboard.analytics.charts.statusDesc")}
                >
                  <CapitalStatusChart
                    statusAllocation={capitalStatus}
                    total={allocationTotal}
                  />
                </ChartCard>
              </div>
            </div>
          ) : (
            <AnalyticsTableView
              points={points}
              allocation={allocation}
              capitalStatus={capitalStatus}
              total={allocationTotal}
            />
          )}
        </>
      )}
    </m.div>
  );
}
