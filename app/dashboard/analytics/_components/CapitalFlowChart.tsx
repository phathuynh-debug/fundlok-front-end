"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
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

  // Direct-label only the endpoint of each line. A value on every point is
  // noise; the axis and the tooltip carry the rest. The dot gets a 2px ring in
  // the surface colour so it stays readable where it crosses the line, and the
  // label wears a text token -- never the series colour, which is illegible as
  // text at this size.
  const renderEndPoint = (key: "deployed_cumulative" | "returns_cumulative") =>
    // Named rather than anonymous: recharts treats this as a component, and an
    // arrow returned from a factory trips react/display-name.
    function EndPointDot(props: {
      cx?: number;
      cy?: number;
      index?: number;
      payload?: MonthlyPoint;
    }) {
      const { cx, cy, index, payload } = props;

      if (index !== lastIndex || cx == null || cy == null || !payload) {
        return <g key={`empty-${key}-${index}`} />;
      }

      return (
        <g key={`end-${key}`}>
          <circle
            cx={cx}
            cy={cy}
            r={4}
            fill={`var(--color-${key})`}
            stroke="var(--card)"
            strokeWidth={2}
          />
          <text
            x={cx + 10}
            y={cy}
            dominantBaseline="middle"
            className="fill-foreground text-[11px] font-semibold"
          >
            {formatCompactCurrency(payload[key], locale)}
          </text>
        </g>
      );
    };

  const endPointDeployed = renderEndPoint("deployed_cumulative");
  const endPointReturns = renderEndPoint("returns_cumulative");

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[300px] w-full"
    >
      <LineChart
        accessibilityLayer
        data={points}
        margin={{ top: 12, right: 60, left: 4, bottom: 4 }}
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
        <Line
          dataKey="deployed_cumulative"
          name={deployedLabel}
          type="monotone"
          stroke="var(--color-deployed_cumulative)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          dot={endPointDeployed}
          activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }}
        />
        <Line
          dataKey="returns_cumulative"
          name={returnsLabel}
          type="monotone"
          stroke="var(--color-returns_cumulative)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          dot={endPointReturns}
          activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }}
        />
      </LineChart>
    </ChartContainer>
  );
}
