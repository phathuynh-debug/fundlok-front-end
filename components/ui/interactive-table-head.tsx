"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ListFilter,
  Search,
  X,
} from "lucide-react";
import { TableHead } from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n";
import { CONTROL_IDLE } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc";

export interface SortState {
  key: string;
  direction: SortDirection;
}

export type ColumnFilterType = "text" | "select";

export interface ColumnFilterOption {
  value: string;
  label: string;
  count?: number;
}

export type ColumnFilterValue = string | string[];
export type ColumnFiltersState = Record<string, ColumnFilterValue>;

/**
 * Recursively extracts plain text from a rendered React cell so columns can
 * be sorted and filtered even when they render rich JSX (badges, avatars,
 * stacked lines).
 */
export function extractTextContent(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) {
    return node.map(extractTextContent).filter(Boolean).join(" ").trim();
  }
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return extractTextContent(node.props.children);
  }
  return "";
}

/** Cycles column sort state: unsorted -> asc -> desc -> unsorted. */
export function cycleSortState(
  current: SortState | null,
  key: string,
): SortState | null {
  if (!current || current.key !== key) {
    return { key, direction: "asc" };
  }
  if (current.direction === "asc") {
    return { key, direction: "desc" };
  }
  return null;
}

export function isColumnFilterActive(
  value: ColumnFilterValue | undefined,
): boolean {
  if (!value) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return value.length > 0;
}

function isEmptySortableValue(
  value: string | number | null | undefined,
): boolean {
  if (value == null) return true;
  if (typeof value === "number") return Number.isNaN(value);
  const trimmed = value.trim();
  return trimmed === "" || trimmed === "—";
}

/**
 * Locale-aware comparator that keeps empty/"—" cells at the bottom regardless
 * of sort direction, compares numbers numerically, and uses numeric collation
 * for strings and ISO timestamps.
 */
export function compareSortableValues(
  a: string | number | null | undefined,
  b: string | number | null | undefined,
  direction: SortDirection,
  locale = "en",
): number {
  const aEmpty = isEmptySortableValue(a);
  const bEmpty = isEmptySortableValue(b);
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;

  const factor = direction === "asc" ? 1 : -1;

  if (typeof a === "number" && typeof b === "number") {
    return (a - b) * factor;
  }

  const collator = new Intl.Collator(locale === "vi" ? "vi" : "en", {
    numeric: true,
    sensitivity: "base",
  });
  return collator.compare(String(a), String(b)) * factor;
}

export interface InteractiveTableHeadProps {
  columnKey: string;
  header: string;
  headClassName?: string;
  sortable?: boolean;
  sortState: SortState | null;
  onSortChange: (next: SortState | null) => void;
  filterable?: boolean;
  filterType?: ColumnFilterType;
  filterValue?: ColumnFilterValue;
  filterOptions?: ColumnFilterOption[];
  onFilterChange?: (next: ColumnFilterValue | undefined) => void;
}

export function InteractiveTableHead({
  columnKey,
  header,
  headClassName,
  sortable = true,
  sortState,
  onSortChange,
  filterable = true,
  filterType = "text",
  filterValue,
  filterOptions = [],
  onFilterChange,
}: InteractiveTableHeadProps) {
  const { t } = useTranslations();
  const [optionQuery, setOptionQuery] = React.useState("");

  const isSorted = sortState?.key === columnKey;
  const sortDirection = isSorted ? sortState.direction : undefined;
  const hasActiveFilter = isColumnFilterActive(filterValue);
  const isRightAligned = Boolean(headClassName?.includes("text-right"));

  const selectedValues = Array.isArray(filterValue) ? filterValue : [];
  const textValue = typeof filterValue === "string" ? filterValue : "";

  const visibleOptions = React.useMemo(() => {
    const q = optionQuery.trim().toLowerCase();
    if (!q) return filterOptions;
    return filterOptions.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [filterOptions, optionQuery]);

  const toggleOption = (val: string) => {
    if (!onFilterChange) return;
    const next = selectedValues.includes(val)
      ? selectedValues.filter((item) => item !== val)
      : [...selectedValues, val];
    onFilterChange(next.length > 0 ? next : undefined);
  };

  if (!sortable && !filterable) {
    return <TableHead className={headClassName}>{header}</TableHead>;
  }

  return (
    <TableHead
      aria-sort={
        sortDirection === "asc"
          ? "ascending"
          : sortDirection === "desc"
            ? "descending"
            : sortable
              ? "none"
              : undefined
      }
      className={cn("select-none", headClassName)}
    >
      <div
        className={cn(
          "inline-flex items-center gap-1",
          isRightAligned && "w-full justify-end",
        )}
      >
        {sortable ? (
          <button
            type="button"
            onClick={() => onSortChange(cycleSortState(sortState, columnKey))}
            title={t("tableControls.sortBy").replace("{column}", header)}
            className={cn(
              "group -mx-1.5 inline-flex items-center gap-1 rounded px-1.5 py-1 text-left font-medium transition-colors cursor-pointer",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              isSorted ? "text-foreground" : CONTROL_IDLE,
            )}
          >
            <span>{header}</span>
            {sortDirection === "asc" ? (
              <ArrowUp className="h-3.5 w-3.5 shrink-0 text-primary" />
            ) : sortDirection === "desc" ? (
              <ArrowDown className="h-3.5 w-3.5 shrink-0 text-primary" />
            ) : (
              <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-40 transition-opacity group-hover:opacity-100" />
            )}
          </button>
        ) : (
          <span>{header}</span>
        )}

        {filterable && onFilterChange && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={t("tableControls.filterBy").replace(
                  "{column}",
                  header,
                )}
                title={t("tableControls.filterBy").replace("{column}", header)}
                className={cn(
                  "inline-flex h-6 min-w-6 items-center justify-center gap-0.5 rounded px-1 text-xs transition-colors cursor-pointer",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  hasActiveFilter
                    ? "bg-primary/15 text-primary font-semibold hover:bg-primary/25"
                    : cn("text-muted-foreground", CONTROL_IDLE),
                )}
              >
                <ListFilter className="h-3.5 w-3.5 shrink-0" />
                {selectedValues.length > 0 && (
                  <span className="text-[10px] leading-none tabular-nums">
                    {selectedValues.length}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align={isRightAligned ? "end" : "start"}
              className="w-60 p-3 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground truncate">
                  {header}
                </span>
                {(hasActiveFilter || isSorted) && (
                  <button
                    type="button"
                    onClick={() => {
                      onFilterChange(undefined);
                      if (isSorted) onSortChange(null);
                    }}
                    className={cn(
                      "text-xs font-medium rounded px-1.5 py-0.5 cursor-pointer",
                      CONTROL_IDLE,
                    )}
                  >
                    {t("tableControls.clear")}
                  </button>
                )}
              </div>

              {sortable && (
                <div className="grid grid-cols-2 gap-1 border-b pb-2">
                  <Button
                    type="button"
                    variant={sortDirection === "asc" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() =>
                      onSortChange(
                        sortDirection === "asc"
                          ? null
                          : { key: columnKey, direction: "asc" },
                      )
                    }
                    className="h-7 justify-start gap-1.5 px-2 text-xs"
                  >
                    <ArrowUp className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {t("tableControls.sortAsc")}
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant={sortDirection === "desc" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() =>
                      onSortChange(
                        sortDirection === "desc"
                          ? null
                          : { key: columnKey, direction: "desc" },
                      )
                    }
                    className="h-7 justify-start gap-1.5 px-2 text-xs"
                  >
                    <ArrowDown className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {t("tableControls.sortDesc")}
                    </span>
                  </Button>
                </div>
              )}

              {filterType === "select" ? (
                <div className="space-y-2">
                  {filterOptions.length > 6 && (
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={optionQuery}
                        onChange={(e) => setOptionQuery(e.target.value)}
                        placeholder={t(
                          "tableControls.filterPlaceholder",
                        ).replace("{column}", header)}
                        className="h-7 pl-8 text-xs"
                      />
                    </div>
                  )}
                  {visibleOptions.length === 0 ? (
                    <p className="py-2 text-center text-xs text-muted-foreground">
                      {t("tableControls.noOptions")}
                    </p>
                  ) : (
                    <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
                      {visibleOptions.map((opt) => {
                        const checked = selectedValues.includes(opt.value);
                        return (
                          <label
                            key={opt.value}
                            className="flex cursor-pointer items-center justify-between gap-2 rounded px-1.5 py-1 text-xs hover:bg-muted/60"
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() => toggleOption(opt.value)}
                              />
                              <span className="truncate text-foreground">
                                {opt.label}
                              </span>
                            </span>
                            {opt.count !== undefined && (
                              <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                                {opt.count}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={textValue}
                    onChange={(e) =>
                      onFilterChange(e.target.value || undefined)
                    }
                    placeholder={t("tableControls.filterPlaceholder").replace(
                      "{column}",
                      header,
                    )}
                    className="h-8 pl-8 pr-7 text-xs"
                  />
                  {textValue && (
                    <button
                      type="button"
                      onClick={() => onFilterChange(undefined)}
                      aria-label={t("tableControls.clear")}
                      className={cn(
                        "absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 cursor-pointer",
                        CONTROL_IDLE,
                      )}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
            </PopoverContent>
          </Popover>
        )}
      </div>
    </TableHead>
  );
}

export interface ActiveTableFiltersBarProps {
  columns: { key: string; header: string }[];
  sortState: SortState | null;
  columnFilters: ColumnFiltersState;
  onClearSort: () => void;
  onClearFilter: (key: string) => void;
  onResetAll: () => void;
}

export function ActiveTableFiltersBar({
  columns,
  sortState,
  columnFilters,
  onClearSort,
  onClearFilter,
  onResetAll,
}: ActiveTableFiltersBarProps) {
  const { t } = useTranslations();

  const activeFilterEntries = Object.entries(columnFilters).filter(([, val]) =>
    isColumnFilterActive(val),
  );

  if (!sortState && activeFilterEntries.length === 0) {
    return null;
  }

  const headerFor = (key: string) =>
    columns.find((c) => c.key === key)?.header ?? key;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/20 px-4 py-2 text-xs">
      <div className="flex flex-wrap items-center gap-1.5">
        {sortState && (
          <span className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-0.5 text-xs text-foreground">
            <span>
              {t(
                sortState.direction === "asc"
                  ? "tableControls.sortedAsc"
                  : "tableControls.sortedDesc",
              ).replace("{column}", headerFor(sortState.key))}
            </span>
            <button
              type="button"
              onClick={onClearSort}
              aria-label={t("tableControls.clear")}
              className={cn("rounded p-0.5 cursor-pointer", CONTROL_IDLE)}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        )}

        {activeFilterEntries.map(([key, val]) => {
          const summary = Array.isArray(val) ? val.join(", ") : val;
          return (
            <span
              key={key}
              className="inline-flex max-w-64 items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs text-foreground"
            >
              <span className="truncate">
                <span className="font-medium">{headerFor(key)}:</span> {summary}
              </span>
              <button
                type="button"
                onClick={() => onClearFilter(key)}
                aria-label={t("tableControls.clear")}
                className={cn(
                  "shrink-0 rounded p-0.5 cursor-pointer",
                  CONTROL_IDLE,
                )}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onResetAll}
        className={cn(
          "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium cursor-pointer",
          CONTROL_IDLE,
        )}
      >
        <X className="h-3 w-3" />
        <span>{t("tableControls.clearAll")}</span>
      </button>
    </div>
  );
}
