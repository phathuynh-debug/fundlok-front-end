"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format-currency";
import { useTranslations } from "@/lib/i18n";
import {
  monthTickLabel,
  type IndustryAllocation,
  type MonthlyPoint,
} from "./mock-analytics";

// The table twin of the three charts. Every value plotted above is readable
// here without hovering anything, which is what keeps the tooltips an
// enhancement rather than the only way to get at the numbers.
export function AnalyticsTableView({
  points,
  allocation,
  total,
}: {
  points: MonthlyPoint[];
  allocation: IndustryAllocation[];
  total: number;
}) {
  const { t, locale } = useTranslations();

  return (
    <div className="space-y-6">
      <section className="bg-card text-card-foreground border border-border rounded-xl shadow-xs overflow-hidden">
        <h3 className="px-5 pt-5 pb-3 text-sm font-semibold">
          {t("dashboard.analytics.charts.capitalFlowTitle")}
        </h3>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-mono text-[10px] uppercase tracking-wider">
                {t("dashboard.analytics.table.month")}
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-right">
                {t("dashboard.analytics.series.deployed")}
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-right">
                {t("dashboard.analytics.series.returns")}
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-right">
                {t("dashboard.analytics.series.monthlyReturns")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {points.map((point) => {
              const [year] = point.month.split("-");
              return (
                <TableRow key={point.month}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {monthTickLabel(point.month, locale)} {year}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums whitespace-nowrap">
                    {formatCurrency(point.deployed_cumulative, locale)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums whitespace-nowrap">
                    {formatCurrency(point.returns_cumulative, locale)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums whitespace-nowrap">
                    {formatCurrency(point.returns_monthly, locale)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </section>

      <section className="bg-card text-card-foreground border border-border rounded-xl shadow-xs overflow-hidden">
        <h3 className="px-5 pt-5 pb-3 text-sm font-semibold">
          {t("dashboard.analytics.charts.allocationTitle")}
        </h3>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-mono text-[10px] uppercase tracking-wider">
                {t("dashboard.analytics.table.industry")}
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-right">
                {t("dashboard.analytics.series.deployed")}
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-right">
                {t("dashboard.analytics.table.share")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allocation.map((row) => (
              <TableRow key={row.industry}>
                <TableCell className="text-sm font-medium whitespace-nowrap">
                  {row.industry}
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums whitespace-nowrap">
                  {formatCurrency(row.deployed, locale)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums whitespace-nowrap">
                  {((row.deployed / total) * 100).toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
