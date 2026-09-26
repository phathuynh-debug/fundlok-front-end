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
import { industryLabel } from "@/lib/industry-label";
import { INDUSTRY_COLORS, INDUSTRY_SLICE_LIMIT } from "./industry-colors";
import { CurrencyChartTooltip } from "./CurrencyChartTooltip";
import type { IndustryAllocation } from "./mock-analytics";

// Share of the portfolio by industry. Deliberately a different QUESTION from the
// bars beside it: the bars answer "how much is in each industry" (magnitude,
// precisely comparable), this answers "how concentrated is the book" — one
// glance, part-to-whole. A donut is only honest for that reading, so the precise
// figures live in the legend and the tooltip rather than in the geometry.
//
// The hole is not decoration: it carries the total, which is the denominator
// every slice is a share of.
export function IndustrySplitChart({
  allocation,
  total,
}: {
  allocation: IndustryAllocation[];
  total: number;
}) {
  const { locale, t } = useTranslations();

  // Largest first, and anything past the palette folds into one "Other" slice —
  // a sixth industry never gets a generated hue.
  const slices = useMemo(() => {
    // Industry values are the engine's English strings; label them per locale.
    const sorted = [...allocation]
      .sort((a, b) => b.deployed - a.deployed)
      .map((item) => ({ ...item, industry: industryLabel(item.industry, t) }));
    if (sorted.length <= INDUSTRY_SLICE_LIMIT) return sorted;
    const head = sorted.slice(0, INDUSTRY_SLICE_LIMIT - 1);
    const tail = sorted.slice(INDUSTRY_SLICE_LIMIT - 1);
    return [
      ...head,
      {
        industry: t("dashboard.analytics.charts.otherIndustries"),
        deployed: tail.reduce((sum, item) => sum + item.deployed, 0),
      },
    ];
  }, [allocation, t]);

  // ChartContainer emits `--color-<key>` verbatim, so the key has to be a valid
  // CSS ident. Industry names are not: the engine's own values contain spaces
  // ("IT Services", "Retail Trade") and ampersands ("Food & Beverage"). Key on
  // the slot index and carry the name as the label.
  const sliceKey = (index: number) => `slice${index}`;

  const chartConfig = useMemo(
    () =>
      Object.fromEntries(
        slices.map((slice, index) => [
          sliceKey(index),
          {
            label: slice.industry,
            theme: INDUSTRY_COLORS[index % INDUSTRY_COLORS.length],
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
          {/* Recharts injects the tooltip props, so forward them rather than
              rendering a bare element — same shape as the other charts here.
              `nameKey` means the row reads the industry, not the series. */}
          <ChartTooltip
            cursor={false}
            content={(props) => <CurrencyChartTooltip {...props} />}
          />
          <Pie
            data={slices}
            dataKey="deployed"
            nameKey="industry"
            innerRadius="58%"
            outerRadius="88%"
            // 2px of surface between fills, per the mark spec — this is the
            // secondary encoding that keeps slices separable without colour.
            paddingAngle={2}
            strokeWidth={0}
            // Clockwise from 12 o'clock, largest slice first: the reading order
            // matches the sort order.
            startAngle={90}
            endAngle={-270}
          >
            {slices.map((slice, index) => (
              <Cell
                key={slice.industry}
                fill={`var(--color-${sliceKey(index)})`}
                aria-label={`${slice.industry}: ${formatCurrency(slice.deployed, locale)}`}
              />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>

      {/* The total sits beside the donut rather than inside it: a ten-digit VND
          figure does not fit a 128px hole at a readable size. */}
      <div className="min-w-0 flex-1 space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">
            {t("dashboard.analytics.charts.totalDeployed")}
          </p>
          <p className="text-lg font-semibold text-foreground">
            {formatCompactCurrency(total, locale)}
          </p>
        </div>

        {/* Legend, always present: identity is never colour-alone, and every
            slice is labelled with its value and share. */}
        <ul className="space-y-2">
          {slices.map((slice, index) => (
            <li
              key={slice.industry}
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
                  {slice.industry}
                </span>
              </span>
              <span className="shrink-0 font-medium text-foreground tabular-nums">
                {share(slice.deployed)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
