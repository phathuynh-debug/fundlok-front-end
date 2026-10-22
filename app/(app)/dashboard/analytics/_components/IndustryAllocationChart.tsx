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
import { industryLabel } from "@/lib/industry-label";
import { SERIES_COLORS } from "./chart-colors";
import { CurrencyChartTooltip } from "./CurrencyChartTooltip";
import type { IndustryAllocation } from "./mock-analytics";

// Horizontal because the category names are words, not dates. One series, one
// hue -- industries have no natural order, so a value ramp here would double
// encode bar length as darkness and fail the categorical checks by design.
//
// The five industries are NOT five categorical colours: the repo's
// --chart-1..5 collapse at slots 4/5 (see chart-colors.ts), and identity is
// already carried by the axis labels, so no second channel is needed.
export function IndustryAllocationChart({
  allocation,
  total,
}: {
  allocation: IndustryAllocation[];
  total: number;
}) {
  const { locale, t } = useTranslations();

  const deployedLabel = t("dashboard.analytics.series.deployed");
  // The axis reads the label straight from the data, so translate it here.
  const data = allocation.map((row) => ({
    ...row,
    industry: industryLabel(row.industry, t),
  }));

  const chartConfig = {
    deployed: { label: deployedLabel, theme: SERIES_COLORS.deployed },
  } satisfies ChartConfig;

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[300px] w-full"
    >
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 84, left: 4, bottom: 4 }}
      >
        <CartesianGrid horizontal={false} />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="industry"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={104}
        />
        <ChartTooltip
          content={(props) => <CurrencyChartTooltip {...props} />}
        />
        <Bar
          dataKey="deployed"
          name={deployedLabel}
          fill="var(--color-deployed)"
          radius={[0, 4, 4, 0]}
          maxBarSize={24}
        >
          {/* Value at the tip. Five bars is few enough that every tip can carry
              its number without becoming noise, and it doubles as the readable
              alternative to hovering. */}
          <LabelList
            dataKey="deployed"
            position="right"
            offset={10}
            className="fill-foreground text-[11px] font-semibold"
            formatter={(value) =>
              `${formatCompactCurrency(Number(value), locale)} · ${Math.round((Number(value) / total) * 100)}%`
            }
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
