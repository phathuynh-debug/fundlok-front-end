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
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCompactCurrency } from "@/lib/format-currency";
import { useTranslations } from "@/lib/i18n";
import { SERIES_COLORS } from "./chart-colors";
import { CurrencyChartTooltip } from "./CurrencyChartTooltip";
import { monthTickLabel, type MonthlyPoint } from "./mock-analytics";

// One series, so every column wears the same hue -- colouring them by value
// would spend the identity channel re-encoding what column height already
// shows. No legend either: the card title names what is plotted.
//
// The column is TOTAL money returned -- principal + yield -- not the yield on
// its own. Plotting yield alone invited the reading that a month's whole
// instalment was profit, which overstates earnings by an order of magnitude
// here; the label says "Total returned" so the bar cannot be mistaken for it.
export function MonthlyReturnsChart({ points }: { points: MonthlyPoint[] }) {
  const { t, locale } = useTranslations();

  const returnsLabel = t("dashboard.analytics.series.totalReturned");

  const chartConfig = {
    total_returned: { label: returnsLabel, theme: SERIES_COLORS.returns },
  } satisfies ChartConfig;

  // Label the peak only. The axis carries the rest, and a number on every cap
  // reads as clutter.
  //
  // Carried as a field on the row rather than filtered inside a custom
  // LabelList `content`: recharts only renders a label where the dataKey has a
  // value, so leaving it undefined elsewhere is all the selectivity needed.
  // Summed here rather than read off a precomputed field, so the chart states
  // what it plots. The two components are what a repayment actually is.
  const totalReturned = (point: MonthlyPoint) =>
    point.principal_monthly + point.yield_monthly;

  const peakIndex = points.reduce(
    (best, point, i) =>
      totalReturned(point) > totalReturned(points[best]) ? i : best,
    0,
  );

  const chartData = points.map((point, i) => ({
    ...point,
    total_returned: totalReturned(point),
    peak_label:
      i === peakIndex
        ? formatCompactCurrency(totalReturned(point), locale)
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
        <Bar
          dataKey="total_returned"
          name={returnsLabel}
          fill="var(--color-total_returned)"
          // 4px rounded cap, square at the baseline; capped thickness so the
          // band keeps some air rather than being filled edge to edge.
          radius={[4, 4, 0, 0]}
          maxBarSize={24}
        >
          <LabelList
            dataKey="peak_label"
            position="top"
            offset={10}
            className="fill-foreground text-[11px] font-semibold"
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
