"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { useTranslations } from "@/lib/i18n";
import { SERIES_COLORS } from "../chart-colors";
import { monthTickLabel } from "../mock-analytics";
import { PercentChartTooltip } from "./PercentChartTooltip";
import {
  REVENUE_SHARE_CEILING,
  type RepaymentMonth,
} from "./mock-sme-analytics";

// How much of each month's revenue went to repayment, against the 30% ceiling
// the grading engine's gate 8 enforces. This is the affordability question, and
// the ceiling is the whole point of the chart — so it is a labelled reference
// line, not a note under the axis.
//
// Bars above the ceiling take the status warning colour rather than the series
// hue: crossing it is a state, not another category. Status colour ships with a
// label (the reference line's own) so it never rests on colour alone.
export function RevenueShareChart({ months }: { months: RepaymentMonth[] }) {
  const { locale, t } = useTranslations();

  const chartConfig = {
    revenue_share: {
      label: t("dashboard.smeAnalytics.series.revenueShare"),
      theme: SERIES_COLORS.deployed,
    },
  } satisfies ChartConfig;

  const asPercent = (value: number) => `${Math.round(value * 100)}%`;

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[300px] w-full"
    >
      <BarChart
        accessibilityLayer
        data={months}
        margin={{ top: 24, right: 8, left: 4, bottom: 4 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          tickFormatter={(value: string) => monthTickLabel(value, locale)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={48}
          // Fixed to 0-50% so month-on-month bars stay comparable and the
          // ceiling sits in the same place every render.
          domain={[0, 0.5]}
          tickFormatter={asPercent}
        />
        <ChartTooltip
          content={(props) => (
            <PercentChartTooltip
              {...props}
              labelFormatter={(_label, payload) => {
                const month = payload?.[0]?.payload?.month as
                  string | undefined;
                if (!month) return null;
                const [year] = month.split("-");
                return `${monthTickLabel(month, locale)} ${year}`;
              }}
            />
          )}
        />
        <ReferenceLine
          y={REVENUE_SHARE_CEILING}
          stroke="var(--color-destructive)"
          strokeDasharray="4 4"
          strokeWidth={1}
          label={{
            value: t("dashboard.smeAnalytics.series.ceiling", {
              percent: (REVENUE_SHARE_CEILING * 100).toFixed(0),
            }),
            position: "insideTopRight",
            className: "fill-muted-foreground text-[11px]",
          }}
        />
        <Bar
          dataKey="revenue_share"
          name={t("dashboard.smeAnalytics.series.revenueShare")}
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
        >
          {months.map((month) => (
            <Cell
              key={month.month}
              fill={
                month.revenue_share > REVENUE_SHARE_CEILING
                  ? "var(--color-destructive)"
                  : "var(--color-revenue_share)"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
