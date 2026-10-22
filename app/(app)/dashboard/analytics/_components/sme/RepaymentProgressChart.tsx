"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
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
import { SERIES_COLORS } from "../chart-colors";
import { CurrencyChartTooltip } from "../CurrencyChartTooltip";
import { monthTickLabel } from "../mock-analytics";
import type { RepaymentMonth } from "./mock-sme-analytics";

// Cumulative repaid against the total owed. One series, not two: the obligation
// is a fixed constant over the term, so it is a reference line rather than a
// second area — drawing it as a series would imply it moves.
//
// Hue follows the entity, page-wide: the deployed/obligation orange from
// chart-colors.ts is the money the SME owes, so the line marking the total uses
// it, and the repaid area uses the teal that means money moving.
export function RepaymentProgressChart({
  months,
  totalObligation,
}: {
  months: RepaymentMonth[];
  totalObligation: number;
}) {
  const { locale, t } = useTranslations();

  const chartConfig = {
    repaid_cumulative: {
      label: t("dashboard.smeAnalytics.series.repaid"),
      theme: SERIES_COLORS.returns,
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[300px] w-full"
    >
      <AreaChart
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
          width={64}
          // Headroom above the obligation line so its label is not clipped.
          domain={[0, Math.round(totalObligation * 1.1)]}
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
        <ReferenceLine
          y={totalObligation}
          stroke={SERIES_COLORS.deployed.light}
          strokeDasharray="4 4"
          strokeWidth={1}
          label={{
            value: t("dashboard.smeAnalytics.series.totalOwed"),
            position: "insideTopRight",
            className: "fill-muted-foreground text-[11px]",
          }}
        />
        <Area
          dataKey="repaid_cumulative"
          type="monotone"
          fill="var(--color-repaid_cumulative)"
          fillOpacity={0.15}
          stroke="var(--color-repaid_cumulative)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
