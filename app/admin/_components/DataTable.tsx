"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// A single column definition: how to label the header and render each cell.
export interface Column<T> {
  // Stable key for React and header identity.
  key: string;
  header: string;
  // Optional Tailwind classes for the header cell / body cells.
  headClassName?: string;
  cellClassName?: string;
  // Turns a row into the cell content.
  render: (row: T) => React.ReactNode;
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

// Generic, presentational table. Pass the data plus a column config describing
// how to render each cell; layout, loading, and empty states are handled here.
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  isLoading,
  isFetching,
  emptyMessage = "No results found.",
  onRowClick,
  getRowLabel,
}: DataTableProps<T>) {
  const colCount = columns.length;

  return (
    <div className="relative overflow-x-auto">
      {isFetching && !isLoading && (
        <div className="absolute right-3 top-3 z-10">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className={col.headClassName}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={colCount} className="h-32 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={colCount}
                className="h-32 text-center text-sm text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
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
