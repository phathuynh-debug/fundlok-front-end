"use client";

import { formatCurrency } from "@/lib/format-currency";

// One row inside a chart tooltip. ChartTooltipContent's own `formatter` hook
// replaces the entire row, so this rebuilds the parts worth keeping: the colour
// swatch that ties the row to its mark, the series name, and the value -- with
// the value formatted as currency rather than the default bare number.
//
// tabular-nums is correct here: tooltip values sit in an aligned column. It is
// deliberately NOT used on the stat tiles, where the numbers stand alone.
export function ChartTooltipRow({
  color,
  label,
  value,
}: {
  color?: string;
  label: string;
  value: number;
}) {
  return (
    <>
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <div className="flex flex-1 items-center justify-between gap-3 leading-none">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground font-mono font-medium tabular-nums">
          {formatCurrency(value, "USD", 0)}
        </span>
      </div>
    </>
  );
}
