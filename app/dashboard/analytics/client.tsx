"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart3, FlaskConical, PieChart, TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireAuth } from "@/hooks/use-authentication";
import { pageTransitionProps } from "@/lib/animations";
import { useTranslations } from "@/lib/i18n";
import { DashboardHeader } from "../_components/DashboardHeader";
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
  MOCK_ALLOCATION,
  MOCK_CAPITAL_STATUS,
  MOCK_MONTHLY,
  sliceByRange,
  totalAllocated,
  type RangeKey,
} from "./_components/mock-analytics";
import { CONTROL_IDLE } from "@/lib/ui-tokens";

const RANGES: RangeKey[] = ["3M", "6M", "12M"];

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
    <section className="bg-card text-card-foreground border border-border rounded-xl shadow-xs p-5 space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
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

  const points = useMemo(() => sliceByRange(MOCK_MONTHLY, range), [range]);
  const kpis = useMemo(() => deriveKpis(points), [points]);
  const allocationTotal = useMemo(() => totalAllocated(MOCK_ALLOCATION), []);

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />

      <motion.div
        {...pageTransitionProps}
        className="flex-1 space-y-6 md:space-y-8 p-4 md:p-8 pt-6"
      >
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

        {/* Sample-data notice */}
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
          <FlaskConical className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            {t(
              isSme
                ? "dashboard.smeAnalytics.mockNotice"
                : "dashboard.analytics.mockNotice",
            )}
          </p>
        </div>

        {isAuthLoading ? (
          <AnalyticsSkeleton />
        ) : points.length === 0 ? (
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
              <Link
                href={
                  isSme ? "/dashboard/loan-application" : "/dashboard/projects"
                }
              >
                {t(
                  isSme
                    ? "dashboard.analytics.smeEmptyAction"
                    : "dashboard.analytics.emptyAction",
                )}
              </Link>
            </Button>
          </div>
        ) : isSme ? (
          <SmeAnalyticsView />
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
                    className={`px-3 py-2 rounded-lg text-xs font-semibold uppercase transition-all duration-200 cursor-pointer ${
                      range === option
                        ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs border border-border/10"
                        : `${CONTROL_IDLE} bg-transparent border border-transparent`
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
                      label: t("dashboard.analytics.views.charts"),
                      icon: PieChart,
                    },
                    {
                      key: "table",
                      label: t("dashboard.analytics.views.table"),
                      icon: TableIcon,
                    },
                  ] as const
                ).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setView(key)}
                    aria-pressed={view === key}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold uppercase transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                      view === key
                        ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs border border-border/10"
                        : `${CONTROL_IDLE} bg-transparent border border-transparent`
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
                      allocation={MOCK_ALLOCATION}
                      total={allocationTotal}
                    />
                  </ChartCard>

                  <ChartCard
                    title={t("dashboard.analytics.charts.splitTitle")}
                    description={t("dashboard.analytics.charts.splitDesc")}
                  >
                    <IndustrySplitChart
                      allocation={MOCK_ALLOCATION}
                      total={allocationTotal}
                    />
                  </ChartCard>

                  <ChartCard
                    title={t("dashboard.analytics.charts.statusTitle")}
                    description={t("dashboard.analytics.charts.statusDesc")}
                  >
                    <CapitalStatusChart
                      statusAllocation={MOCK_CAPITAL_STATUS}
                      total={allocationTotal}
                    />
                  </ChartCard>
                </div>
              </div>
            ) : (
              <AnalyticsTableView
                points={points}
                allocation={MOCK_ALLOCATION}
                capitalStatus={MOCK_CAPITAL_STATUS}
                total={allocationTotal}
              />
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
