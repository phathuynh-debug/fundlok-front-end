"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
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
  extractTextContent,
  isColumnFilterActive,
  type ColumnFilterOption,
  type ColumnFilterType,
  type ColumnFiltersState,
  type SortState,
} from "@/components/ui/interactive-table-head";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";

const ACTION_COLUMN_KEYS = new Set(["actions", "advance"]);

// A single column definition: how to label the header, render each cell, and
// optionally customize interactive sorting and per-column filtering.
export interface Column<T> {
  // Stable key for React and header identity.
  key: string;
  header: string;
  // Optional Tailwind classes for the header cell / body cells.
  headClassName?: string;
  cellClassName?: string;
  // Turns a row into the cell content.
  render: (row: T) => React.ReactNode;
  // Interactive sorting & filtering (enabled by default except on action columns).
  sortable?: boolean;
  sortValue?: (row: T) => string | number | null | undefined;
  filterable?: boolean;
  filterType?: ColumnFilterType;
  filterValue?: (row: T) => string | null | undefined;
  filterOptions?: ColumnFilterOption[];
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  // First load — shows a centered spinner in place of rows.
  isLoading?: boolean;
  // Background refetch (paging/filtering) — shows a subtle corner spinner.
  isFetching?: boolean;
  emptyMessage?: string;
  // Makes rows activatable. Rows become real <button>-like targets: focusable,
  // Enter/Space activated, with a pointer and hover fill. Left unset, rows stay
  // inert and pick up none of that affordance, so a table with nothing to open
  // never looks clickable.
  onRowClick?: (row: T) => void;
  // Accessible label for an activatable row, e.g. "Preview Acme Holdings".
  getRowLabel?: (row: T) => string;
}

function getRowFilterText<T>(row: T, col: Column<T>): string {
  if (col.filterValue) {
    return col.filterValue(row)?.trim() ?? "";
  }
  return extractTextContent(col.render(row)).trim();
}

function getRowSortValue<T>(
  row: T,
  col: Column<T>,
): string | number | null | undefined {
  if (col.sortValue) {
    return col.sortValue(row);
  }
  const record = row as Record<string, unknown>;
  const raw = record?.[col.key];
  if (typeof raw === "number" || typeof raw === "string") {
    return raw;
  }
  return extractTextContent(col.render(row)).trim();
}

// Generic, interactive table. Pass the data plus a column config describing
// how to render each cell; layout, column sorting, per-column filtering,
// loading, and empty states are handled here.
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  isLoading,
  isFetching,
  emptyMessage,
  onRowClick,
  getRowLabel,
}: DataTableProps<T>) {
  const { t, locale } = useTranslations();
  const [sortState, setSortState] = React.useState<SortState | null>(null);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    {},
  );
  const colCount = columns.length;

  // Build unique select options and counts for columns that use select filtering.
  const selectOptionsByColumn = React.useMemo(() => {
    const map: Record<string, ColumnFilterOption[]> = {};
    for (const col of columns) {
      const effectiveType =
        col.filterType ?? (col.filterOptions ? "select" : "text");
      if (effectiveType !== "select") continue;

      const counts = new Map<string, number>();
      for (const row of rows) {
        const val = getRowFilterText(row, col);
        if (!val || val === "—") continue;
        counts.set(val, (counts.get(val) ?? 0) + 1);
      }

      if (col.filterOptions && col.filterOptions.length > 0) {
        map[col.key] = col.filterOptions.map((opt) => ({
          ...opt,
          count: opt.count ?? counts.get(opt.value) ?? 0,
        }));
      } else {
        map[col.key] = Array.from(counts.entries()).map(([val, count]) => ({
          value: val,
          label: val,
          count,
        }));
      }
    }
    return map;
  }, [columns, rows]);

  const hasActiveFilters = React.useMemo(
    () => Object.values(columnFilters).some((val) => isColumnFilterActive(val)),
    [columnFilters],
  );

  const displayedRows = React.useMemo(() => {
    let result = rows;

    if (hasActiveFilters) {
      result = result.filter((row) => {
        for (const col of columns) {
          const filterVal = columnFilters[col.key];
          if (!isColumnFilterActive(filterVal)) continue;

          const cellText = getRowFilterText(row, col);
          if (typeof filterVal === "string") {
            if (
              !cellText.toLowerCase().includes(filterVal.trim().toLowerCase())
            ) {
              return false;
            }
          } else if (Array.isArray(filterVal)) {
            if (!filterVal.includes(cellText)) {
              return false;
            }
          }
        }
        return true;
      });
    }

    if (sortState) {
      const sortCol = columns.find((col) => col.key === sortState.key);
      if (sortCol) {
        result = [...result].sort((a, b) =>
          compareSortableValues(
            getRowSortValue(a, sortCol),
            getRowSortValue(b, sortCol),
            sortState.direction,
            locale,
          ),
        );
      }
    }

    return result;
  }, [rows, columns, columnFilters, hasActiveFilters, sortState, locale]);

  const setColumnFilter = (
    key: string,
    next: string | string[] | undefined,
  ) => {
    setColumnFilters((prev) => {
      const copy = { ...prev };
      if (!isColumnFilterActive(next)) {
        delete copy[key];
      } else if (next !== undefined) {
        copy[key] = next;
      }
      return copy;
    });
  };

  const resetAll = () => {
    setSortState(null);
    setColumnFilters({});
  };

  return (
    <div className="relative overflow-x-auto">
      {isFetching && !isLoading && (
        <div className="absolute right-3 top-3 z-10">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      <ActiveTableFiltersBar
        columns={columns}
        sortState={sortState}
        columnFilters={columnFilters}
        onClearSort={() => setSortState(null)}
        onClearFilter={(key) => setColumnFilter(key, undefined)}
        onResetAll={resetAll}
      />

      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => {
              const isActionCol = ACTION_COLUMN_KEYS.has(col.key);
              const sortable = col.sortable ?? !isActionCol;
              const filterable = col.filterable ?? !isActionCol;
              const filterType =
                col.filterType ?? (col.filterOptions ? "select" : "text");

              return (
                <InteractiveTableHead
                  key={col.key}
                  columnKey={col.key}
                  header={col.header}
                  headClassName={col.headClassName}
                  sortable={sortable}
                  sortState={sortState}
                  onSortChange={setSortState}
                  filterable={filterable}
                  filterType={filterType}
                  filterValue={columnFilters[col.key]}
                  filterOptions={selectOptionsByColumn[col.key]}
                  onFilterChange={(next) => setColumnFilter(col.key, next)}
                />
              );
            })}
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={colCount} className="h-32 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
              </TableCell>
            </TableRow>
          ) : displayedRows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={colCount}
                className="h-32 text-center text-sm text-muted-foreground"
              >
                {rows.length > 0 && hasActiveFilters ? (
                  <div className="flex flex-col items-center gap-2">
                    <span>{t("tableControls.noMatchingRows")}</span>
                    <button
                      type="button"
                      onClick={resetAll}
                      className="text-xs font-medium text-primary hover:underline cursor-pointer"
                    >
                      {t("tableControls.clearAll")}
                    </button>
                  </div>
                ) : (
                  (emptyMessage ?? t("admin.table.noResults"))
                )}
              </TableCell>
            </TableRow>
          ) : (
            displayedRows.map((row) => (
              // Fixed height keeps every row uniform regardless of cell
              // content — sized to comfortably fit the 32px (h-8) avatar.
              <TableRow
                key={getRowKey(row)}
                className={cn(
                  "h-16",
                  onRowClick &&
                    "cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                )}
                // A <tr> has no native activation, so keyboard support is
                // wired by hand rather than left to the mouse only.
                role={onRowClick ? "button" : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                aria-label={onRowClick ? getRowLabel?.(row) : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.cellClassName}>
                    {col.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
