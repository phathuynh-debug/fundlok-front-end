"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ActiveTableFiltersBar,
  InteractiveTableHead,
  compareSortableValues,
  isColumnFilterActive,
  type ColumnFilterOption,
  type ColumnFiltersState,
  type SortState,
} from "@/components/ui/interactive-table-head";
import { formatCurrency } from "@/lib/format-currency";
import { useTranslations } from "@/lib/i18n";
import { industryLabel } from "@/lib/industry-label";
import {
  monthTickLabel,
  type CapitalStatusAllocation,
  type IndustryAllocation,
  type MonthlyPoint,
} from "./mock-analytics";

// The table twin of the charts. Every value plotted above is readable
// here without hovering anything, which is what keeps the tooltips an
// enhancement rather than the only way to get at the numbers.
export function AnalyticsTableView({
  points,
  allocation,
  capitalStatus,
  total,
}: {
  points: MonthlyPoint[];
  allocation: IndustryAllocation[];
  capitalStatus: CapitalStatusAllocation[];
  total: number;
}) {
  const { t, locale } = useTranslations();

  // --- 1. Capital Flow Table state ---
  const [flowSort, setFlowSort] = React.useState<SortState | null>(null);
  const [flowFilters, setFlowFilters] = React.useState<ColumnFiltersState>({});

  const flowColumns = React.useMemo(
    () => [
      { key: "month", header: t("dashboard.analytics.table.month") },
      { key: "deployed", header: t("dashboard.analytics.series.deployed") },
      { key: "returns", header: t("dashboard.analytics.series.returns") },
      {
        key: "monthlyReturns",
        header: t("dashboard.analytics.series.monthlyReturns"),
      },
    ],
    [t],
  );

  const displayedPoints = React.useMemo(() => {
    let result = points;
    const monthQuery =
      typeof flowFilters.month === "string" ? flowFilters.month.trim() : "";
    if (monthQuery) {
      result = result.filter((point) => {
        const [year] = point.month.split("-");
        const label = `${monthTickLabel(point.month, locale)} ${year}`;
        return (
          label.toLowerCase().includes(monthQuery.toLowerCase()) ||
          point.month.toLowerCase().includes(monthQuery.toLowerCase())
        );
      });
    }
    if (flowSort) {
      result = [...result].sort((a, b) => {
        switch (flowSort.key) {
          case "month":
            return compareSortableValues(
              a.month,
              b.month,
              flowSort.direction,
              locale,
            );
          case "deployed":
            return compareSortableValues(
              a.deployed_cumulative,
              b.deployed_cumulative,
              flowSort.direction,
              locale,
            );
          case "returns":
            return compareSortableValues(
              a.returns_cumulative,
              b.returns_cumulative,
              flowSort.direction,
              locale,
            );
          case "monthlyReturns":
            return compareSortableValues(
              a.returns_monthly,
              b.returns_monthly,
              flowSort.direction,
              locale,
            );
          default:
            return 0;
        }
      });
    }
    return result;
  }, [points, flowFilters, flowSort, locale]);

  // --- 2. Industry Allocation Table state ---
  const [allocSort, setAllocSort] = React.useState<SortState | null>(null);
  const [allocFilters, setAllocFilters] = React.useState<ColumnFiltersState>(
    {},
  );

  const allocColumns = React.useMemo(
    () => [
      { key: "industry", header: t("dashboard.analytics.table.industry") },
      { key: "deployed", header: t("dashboard.analytics.series.deployed") },
      { key: "share", header: t("dashboard.analytics.table.share") },
    ],
    [t],
  );

  const industryOptions = React.useMemo<ColumnFilterOption[]>(
    () =>
      allocation.map((row) => {
        const label = industryLabel(row.industry, t);
        return { value: label, label, count: 1 };
      }),
    [allocation, t],
  );

  const displayedAllocation = React.useMemo(() => {
    let result = allocation;
    const selectedIndustries = Array.isArray(allocFilters.industry)
      ? allocFilters.industry
      : [];
    if (selectedIndustries.length > 0) {
      result = result.filter((row) =>
        selectedIndustries.includes(industryLabel(row.industry, t)),
      );
    }
    if (allocSort) {
      result = [...result].sort((a, b) => {
        switch (allocSort.key) {
          case "industry":
            return compareSortableValues(
              industryLabel(a.industry, t),
              industryLabel(b.industry, t),
              allocSort.direction,
              locale,
            );
          case "deployed":
          case "share":
            return compareSortableValues(
              a.deployed,
              b.deployed,
              allocSort.direction,
              locale,
            );
          default:
            return 0;
        }
      });
    }
    return result;
  }, [allocation, allocFilters, allocSort, locale, t]);

  // --- 3. Capital Status Table state ---
  const [statusSort, setStatusSort] = React.useState<SortState | null>(null);
  const [statusFilters, setStatusFilters] = React.useState<ColumnFiltersState>(
    {},
  );

  const statusColumns = React.useMemo(
    () => [
      { key: "status", header: t("dashboard.analytics.table.status") },
      { key: "deployed", header: t("dashboard.analytics.series.deployed") },
      { key: "share", header: t("dashboard.analytics.table.share") },
    ],
    [t],
  );

  const capitalStatusOptions = React.useMemo<ColumnFilterOption[]>(
    () =>
      capitalStatus.map((row) => {
        const label = t(`dashboard.analytics.charts.status.${row.statusKey}`);
        return { value: label, label, count: 1 };
      }),
    [capitalStatus, t],
  );

  const displayedCapitalStatus = React.useMemo(() => {
    let result = capitalStatus;
    const selectedStatuses = Array.isArray(statusFilters.status)
      ? statusFilters.status
      : [];
    if (selectedStatuses.length > 0) {
      result = result.filter((row) =>
        selectedStatuses.includes(
          t(`dashboard.analytics.charts.status.${row.statusKey}`),
        ),
      );
    }
    if (statusSort) {
      result = [...result].sort((a, b) => {
        switch (statusSort.key) {
          case "status":
            return compareSortableValues(
              t(`dashboard.analytics.charts.status.${a.statusKey}`),
              t(`dashboard.analytics.charts.status.${b.statusKey}`),
              statusSort.direction,
              locale,
            );
          case "deployed":
          case "share":
            return compareSortableValues(
              a.amount,
              b.amount,
              statusSort.direction,
              locale,
            );
          default:
            return 0;
        }
      });
    }
    return result;
  }, [capitalStatus, statusFilters, statusSort, locale, t]);

  return (
    <div className="space-y-6">
      <section className="bg-card text-card-foreground border border-border rounded-xl shadow-xs overflow-hidden">
        <h3 className="px-5 pt-5 pb-3 text-sm font-semibold">
          {t("dashboard.analytics.charts.capitalFlowTitle")}
        </h3>
        <ActiveTableFiltersBar
          columns={flowColumns}
          sortState={flowSort}
          columnFilters={flowFilters}
          onClearSort={() => setFlowSort(null)}
          onClearFilter={(key) =>
            setFlowFilters((prev) => {
              const next = { ...prev };
              delete next[key];
              return next;
            })
          }
          onResetAll={() => {
            setFlowSort(null);
            setFlowFilters({});
          }}
        />
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <InteractiveTableHead
                columnKey="month"
                header={t("dashboard.analytics.table.month")}
                headClassName="text-xs font-semibold uppercase tracking-wider"
                sortState={flowSort}
                onSortChange={setFlowSort}
                filterType="text"
                filterValue={flowFilters.month}
                onFilterChange={(next) =>
                  setFlowFilters((prev) => {
                    const copy = { ...prev };
                    if (!isColumnFilterActive(next)) delete copy.month;
                    else if (next) copy.month = next;
                    return copy;
                  })
                }
              />
              <InteractiveTableHead
                columnKey="deployed"
                header={t("dashboard.analytics.series.deployed")}
                headClassName="text-xs font-semibold uppercase tracking-wider text-right"
                sortState={flowSort}
                onSortChange={setFlowSort}
                filterable={false}
              />
              <InteractiveTableHead
                columnKey="returns"
                header={t("dashboard.analytics.series.returns")}
                headClassName="text-xs font-semibold uppercase tracking-wider text-right"
                sortState={flowSort}
                onSortChange={setFlowSort}
                filterable={false}
              />
              <InteractiveTableHead
                columnKey="monthlyReturns"
                header={t("dashboard.analytics.series.monthlyReturns")}
                headClassName="text-xs font-semibold uppercase tracking-wider text-right"
                sortState={flowSort}
                onSortChange={setFlowSort}
                filterable={false}
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedPoints.map((point) => {
              const [year] = point.month.split("-");
              return (
                <TableRow key={point.month}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {monthTickLabel(point.month, locale)} {year}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium tabular-nums whitespace-nowrap">
                    {formatCurrency(point.deployed_cumulative, locale)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium tabular-nums whitespace-nowrap">
                    {formatCurrency(point.returns_cumulative, locale)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium tabular-nums whitespace-nowrap">
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
        <ActiveTableFiltersBar
          columns={allocColumns}
          sortState={allocSort}
          columnFilters={allocFilters}
          onClearSort={() => setAllocSort(null)}
          onClearFilter={(key) =>
            setAllocFilters((prev) => {
              const next = { ...prev };
              delete next[key];
              return next;
            })
          }
          onResetAll={() => {
            setAllocSort(null);
            setAllocFilters({});
          }}
        />
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <InteractiveTableHead
                columnKey="industry"
                header={t("dashboard.analytics.table.industry")}
                headClassName="text-xs font-semibold uppercase tracking-wider"
                sortState={allocSort}
                onSortChange={setAllocSort}
                filterType="select"
                filterValue={allocFilters.industry}
                filterOptions={industryOptions}
                onFilterChange={(next) =>
                  setAllocFilters((prev) => {
                    const copy = { ...prev };
                    if (!isColumnFilterActive(next)) delete copy.industry;
                    else if (next) copy.industry = next;
                    return copy;
                  })
                }
              />
              <InteractiveTableHead
                columnKey="deployed"
                header={t("dashboard.analytics.series.deployed")}
                headClassName="text-xs font-semibold uppercase tracking-wider text-right"
                sortState={allocSort}
                onSortChange={setAllocSort}
                filterable={false}
              />
              <InteractiveTableHead
                columnKey="share"
                header={t("dashboard.analytics.table.share")}
                headClassName="text-xs font-semibold uppercase tracking-wider text-right"
                sortState={allocSort}
                onSortChange={setAllocSort}
                filterable={false}
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedAllocation.map((row) => (
              <TableRow key={row.industry}>
                <TableCell className="text-sm font-medium whitespace-nowrap">
                  {industryLabel(row.industry, t)}
                </TableCell>
                <TableCell className="text-right text-sm font-medium tabular-nums whitespace-nowrap">
                  {formatCurrency(row.deployed, locale)}
                </TableCell>
                <TableCell className="text-right text-sm font-medium tabular-nums whitespace-nowrap">
                  {((row.deployed / total) * 100).toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="bg-card text-card-foreground border border-border rounded-xl shadow-xs overflow-hidden">
        <h3 className="px-5 pt-5 pb-3 text-sm font-semibold">
          {t("dashboard.analytics.charts.capitalStatusTitle")}
        </h3>
        <ActiveTableFiltersBar
          columns={statusColumns}
          sortState={statusSort}
          columnFilters={statusFilters}
          onClearSort={() => setStatusSort(null)}
          onClearFilter={(key) =>
            setStatusFilters((prev) => {
              const next = { ...prev };
              delete next[key];
              return next;
            })
          }
          onResetAll={() => {
            setStatusSort(null);
            setStatusFilters({});
          }}
        />
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <InteractiveTableHead
                columnKey="status"
                header={t("dashboard.analytics.table.status")}
                headClassName="text-xs font-semibold uppercase tracking-wider"
                sortState={statusSort}
                onSortChange={setStatusSort}
                filterType="select"
                filterValue={statusFilters.status}
                filterOptions={capitalStatusOptions}
                onFilterChange={(next) =>
                  setStatusFilters((prev) => {
                    const copy = { ...prev };
                    if (!isColumnFilterActive(next)) delete copy.status;
                    else if (next) copy.status = next;
                    return copy;
                  })
                }
              />
              <InteractiveTableHead
                columnKey="deployed"
                header={t("dashboard.analytics.series.deployed")}
                headClassName="text-xs font-semibold uppercase tracking-wider text-right"
                sortState={statusSort}
                onSortChange={setStatusSort}
                filterable={false}
              />
              <InteractiveTableHead
                columnKey="share"
                header={t("dashboard.analytics.table.share")}
                headClassName="text-xs font-semibold uppercase tracking-wider text-right"
                sortState={statusSort}
                onSortChange={setStatusSort}
                filterable={false}
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedCapitalStatus.map((row) => (
              <TableRow key={row.statusKey}>
                <TableCell className="text-sm font-medium whitespace-nowrap">
                  {t(`dashboard.analytics.charts.status.${row.statusKey}`)}
                </TableCell>
                <TableCell className="text-right text-sm font-medium tabular-nums whitespace-nowrap">
                  {formatCurrency(row.amount, locale)}
                </TableCell>
                <TableCell className="text-right text-sm font-medium tabular-nums whitespace-nowrap">
                  {((row.amount / total) * 100).toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
