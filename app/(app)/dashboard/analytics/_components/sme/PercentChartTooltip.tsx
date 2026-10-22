"use client";

import type { ComponentProps } from "react";
import { ChartTooltipContent } from "@/components/ui/chart";

type ChartTooltipContentProps = ComponentProps<typeof ChartTooltipContent>;

// Percent sibling of CurrencyChartTooltip, and the props are forwarded by hand
// for the same reason documented there: ChartTooltipContent's props are
// recharts' TooltipContentProps intersected with React's div attributes, and
// both declare `content` with incompatible types, so `{...props}` does not
// type-check. Listing the six recharts actually injects sidesteps the clash.
type InjectedProps = Pick<
  ChartTooltipContentProps,
  | "active"
  | "payload"
  | "label"
  | "coordinate"
  | "accessibilityLayer"
  | "activeIndex"
>;

export function PercentChartTooltip({
  active,
  payload,
  label,
  coordinate,
  accessibilityLayer,
  activeIndex,
  labelFormatter,
}: InjectedProps & {
  labelFormatter?: ChartTooltipContentProps["labelFormatter"];
}) {
  return (
    <ChartTooltipContent
      active={active}
      payload={payload}
      label={label}
      coordinate={coordinate}
      accessibilityLayer={accessibilityLayer}
      activeIndex={activeIndex}
      labelFormatter={labelFormatter}
      formatter={(value) => `${Math.round(Number(value) * 100)}%`}
    />
  );
}
