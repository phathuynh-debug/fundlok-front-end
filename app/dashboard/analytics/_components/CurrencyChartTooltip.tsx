"use client";

import type { ComponentProps } from "react";
import { ChartTooltipContent } from "@/components/ui/chart";
import { ChartTooltipRow } from "./ChartTooltipRow";

type ChartTooltipContentProps = ComponentProps<typeof ChartTooltipContent>;

// The props recharts injects into a tooltip's `content` renderer. They have to
// be forwarded by hand rather than spread: ChartTooltipContent's props are
// recharts' TooltipContentProps intersected with React's div attributes, and
// both declare `content` with incompatible types, so `{...props}` fails to
// type-check. Listing the six recharts actually supplies sidesteps the clash.
type InjectedProps = Pick<
  ChartTooltipContentProps,
  | "active"
  | "payload"
  | "label"
  | "coordinate"
  | "accessibilityLayer"
  | "activeIndex"
>;

export function CurrencyChartTooltip({
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
      formatter={(value, name, item) => (
        <ChartTooltipRow
          color={item.color}
          label={String(name)}
          value={Number(value)}
        />
      )}
    />
  );
}
