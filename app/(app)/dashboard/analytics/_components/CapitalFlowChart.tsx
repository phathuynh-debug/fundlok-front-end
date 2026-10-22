"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCompactCurrency } from "@/lib/format-currency";
import { useTranslations } from "@/lib/i18n";
import { SERIES_COLORS } from "./chart-colors";
import { CurrencyChartTooltip } from "./CurrencyChartTooltip";
import { monthTickLabel, type MonthlyPoint } from "./mock-analytics";

// Both series are VND on one scale -- never a second y-axis, which would invent
// a relationship between two differently-scaled measures.
//
// GROUPED bars, not stacked. Stacking asserts the segments are parts of one
// whole, and these are not: returns are not a subset of deployed capital, so a
// stack would draw a combined total that means nothing. Side-by-side pairs put
// the two figures on a shared baseline, which is what "how much of what I put
// out has come back" actually asks -- and a height comparison at a common
// baseline is read far more accurately than the gap between two lines.
export function CapitalFlowChart({ points }: { points: MonthlyPoint[] }) {
  const { t, locale } = useTranslations();

  const deployedLabel = t("dashboard.analytics.series.deployed");
  const returnsLabel = t("dashboard.analytics.series.returns");

  const chartConfig = {
    deployed_cumulative: {
      label: deployedLabel,
      theme: SERIES_COLORS.deployed,
    },
    returns_cumulative: { label: returnsLabel, theme: SERIES_COLORS.returns },
  } satisfies ChartConfig;

  const lastIndex = points.length - 1;

  // Direct-label the latest pair only. A value on every bar is noise; the axis
  // and the tooltip carry the rest, and the number a reader actually wants off
  // this chart is where the two series stand today.
  //
  // Carried as fields on the row rather than filtered inside a LabelList
  // `content`: recharts only renders a label where the dataKey has a value, so
  // leaving them undefined elsewhere is all the selectivity needed.
  const chartData = points.map((point, i) => ({
    ...point,
    deployed_label:
      i === lastIndex
        ? formatCompactCurrency(point.deployed_cumulative, locale)
        : undefined,
    returns_label:
      i === lastIndex
        ? formatCompactCurrency(point.returns_cumulative, locale)
        : undefined,
  }));

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[300px] w-full"
    >
      <BarChart
        accessibilityLayer
        data={chartData}
        margin={{ top: 24, right: 8, left: 4, bottom: 4 }}
        // Pairs read as pairs: bars within a month nearly touch, and the gap
        // between months is wide enough that the grouping is unambiguous.
        barGap={2}
        barCategoryGap="22%"
      >
        {/* Solid hairline grid, horizontal only -- never dashed. */}
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
          width={56}
          tickFormatter={(value: number) =>
            formatCompactCurrency(value, locale)
          }
        />
        <ChartTooltip
          content={(props) => (
            <CurrencyChartTooltip
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
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="deployed_cumulative"
          name={deployedLabel}
          fill="var(--color-deployed_cumulative)"
          // 4px rounded cap, square at the baseline -- matches the by-month
          // chart, so the two cards read as one family.
          radius={[4, 4, 0, 0]}
          maxBarSize={18}
        >
          <LabelList
            dataKey="deployed_label"
            position="top"
            offset={8}
            className="fill-foreground text-[11px] font-semibold"
          />
        </Bar>
        <Bar
          dataKey="returns_cumulative"
          name={returnsLabel}
          fill="var(--color-returns_cumulative)"
          radius={[4, 4, 0, 0]}
          maxBarSize={18}
        >
          <LabelList
            dataKey="returns_label"
            position="top"
            offset={8}
            className="fill-foreground text-[11px] font-semibold"
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
