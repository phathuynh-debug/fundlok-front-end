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
              <TableRow key={getRowKey(row)} className="h-16">
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
