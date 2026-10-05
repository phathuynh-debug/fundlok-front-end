"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrency, formatCompactCurrency } from "@/lib/format-currency";
import { useTranslations } from "@/lib/i18n";
import { CurrencyChartTooltip } from "./CurrencyChartTooltip";
import type { CapitalStatusAllocation } from "./mock-analytics";

const STATUS_COLORS = [
  { light: "#2a78d6", dark: "#3987e5" }, // blue for Active
  { light: "#eda100", dark: "#c98500" }, // amber for In Repayment
  { light: "#009689", dark: "#00ab9d" }, // teal for Fully Repaid
] as const;

export function CapitalStatusChart({
  statusAllocation,
  total,
}: {
  statusAllocation: CapitalStatusAllocation[];
  total: number;
}) {
  const { locale, t } = useTranslations();

  const slices = useMemo(
    () =>
      statusAllocation.map((item) => ({
        ...item,
        label: t(`dashboard.analytics.charts.status.${item.statusKey}`),
      })),
    [statusAllocation, t],
  );

  const sliceKey = (index: number) => `statusSlice${index}`;

  const chartConfig = useMemo(
    () =>
      Object.fromEntries(
        slices.map((slice, index) => [
          sliceKey(index),
          {
            label: slice.label,
            theme: STATUS_COLORS[index % STATUS_COLORS.length],
          },
        ]),
      ) satisfies ChartConfig,
    [slices],
  );

  const share = (value: number) =>
    total === 0 ? 0 : Math.round((value / total) * 100);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square h-[220px] w-[220px] shrink-0"
      >
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={(props) => <CurrencyChartTooltip {...props} />}
          />
          <Pie
            data={slices}
            dataKey="amount"
            nameKey="label"
            innerRadius="58%"
            outerRadius="88%"
            paddingAngle={2}
            strokeWidth={0}
            startAngle={90}
            endAngle={-270}
          >
            {slices.map((slice, index) => (
              <Cell
                key={slice.statusKey}
                fill={`var(--color-${sliceKey(index)})`}
                aria-label={`${slice.label}: ${formatCurrency(slice.amount, locale)}`}
              />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>

      <div className="min-w-0 flex-1 space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">
            {t("dashboard.analytics.charts.totalDeployed")}
          </p>
          <p className="text-lg font-semibold text-foreground">
            {formatCompactCurrency(total, locale)}
          </p>
        </div>

        <ul className="space-y-2">
          {slices.map((slice, index) => (
            <li
              key={slice.statusKey}
              className="flex items-start justify-between gap-3 text-xs"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden="true"
                  className="mt-0.5 size-2.5 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: `var(--color-${sliceKey(index)})`,
                  }}
                />
                <span className="break-words text-muted-foreground">
                  {slice.label}
                </span>
              </span>
              <span className="shrink-0 font-medium text-foreground tabular-nums">
                {share(slice.amount)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
