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
import { formatDateTime } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import { TransactionStatusBadge } from "./TransactionStatusBadge";
import { TransactionTypeCell } from "./TransactionTypeCell";
import { formatAmount, type Transaction } from "./mock-transactions";

export function TransactionsTable({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const { t, locale } = useTranslations();
  const [sortState, setSortState] = React.useState<SortState | null>(null);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    {},
  );

  const methodText = React.useCallback(
    (txn: Transaction) => t(`dashboard.transactions.methods.${txn.method_key}`),
    [t],
  );

  const statusText = React.useCallback(
    (txn: Transaction) => t(`dashboard.transactions.status.${txn.status}`),
    [t],
  );

  const transactionText = React.useCallback(
    (txn: Transaction) =>
      `${t(`dashboard.transactions.types.${txn.type}`)} ${txn.counterparty}`,
    [t],
  );

  const methodOptions = React.useMemo<ColumnFilterOption[]>(() => {
    const counts = new Map<string, number>();
    for (const txn of transactions) {
      const label = methodText(txn);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([value, count]) => ({
      value,
      label: value,
      count,
    }));
  }, [transactions, methodText]);

  const statusOptions = React.useMemo<ColumnFilterOption[]>(() => {
    const counts = new Map<string, number>();
    for (const txn of transactions) {
      const label = statusText(txn);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([value, count]) => ({
      value,
      label: value,
      count,
    }));
  }, [transactions, statusText]);

  const columnsMeta = React.useMemo(
    () => [
      { key: "date", header: t("dashboard.transactions.table.date") },
      {
        key: "transaction",
        header: t("dashboard.transactions.table.transaction"),
      },
      { key: "method", header: t("dashboard.transactions.table.method") },
      { key: "amount", header: t("dashboard.transactions.table.amount") },
      { key: "status", header: t("dashboard.transactions.table.status") },
      { key: "reference", header: t("dashboard.transactions.table.reference") },
    ],
    [t],
  );

  const hasActiveFilters = React.useMemo(
    () => Object.values(columnFilters).some((val) => isColumnFilterActive(val)),
    [columnFilters],
  );

  const displayedTransactions = React.useMemo(() => {
    let result = transactions;

    if (hasActiveFilters) {
      result = result.filter((txn) => {
        const dateFilter = columnFilters.date;
        if (
          typeof dateFilter === "string" &&
          dateFilter.trim() &&
          !formatDateTime(txn.created_at, locale)
            .toLowerCase()
            .includes(dateFilter.trim().toLowerCase())
        ) {
          return false;
        }

        const txnFilter = columnFilters.transaction;
        if (
          typeof txnFilter === "string" &&
          txnFilter.trim() &&
          !transactionText(txn)
            .toLowerCase()
            .includes(txnFilter.trim().toLowerCase())
        ) {
          return false;
        }

        const methodFilter = columnFilters.method;
        if (
          Array.isArray(methodFilter) &&
          methodFilter.length > 0 &&
          !methodFilter.includes(methodText(txn))
        ) {
          return false;
        }

        const amountFilter = columnFilters.amount;
        if (
          typeof amountFilter === "string" &&
          amountFilter.trim() &&
          !formatAmount(txn.amount, locale)
            .toLowerCase()
            .includes(amountFilter.trim().toLowerCase()) &&
          !String(txn.amount).includes(amountFilter.trim())
        ) {
          return false;
        }

        const statusFilter = columnFilters.status;
        if (
          Array.isArray(statusFilter) &&
          statusFilter.length > 0 &&
          !statusFilter.includes(statusText(txn))
        ) {
          return false;
        }

        const refFilter = columnFilters.reference;
        if (
          typeof refFilter === "string" &&
          refFilter.trim() &&
          !txn.reference.toLowerCase().includes(refFilter.trim().toLowerCase())
        ) {
          return false;
        }

        return true;
      });
    }

    if (sortState) {
      result = [...result].sort((a, b) => {
        switch (sortState.key) {
          case "date":
            return compareSortableValues(
              a.created_at,
              b.created_at,
              sortState.direction,
              locale,
            );
          case "transaction":
            return compareSortableValues(
              transactionText(a),
              transactionText(b),
              sortState.direction,
              locale,
            );
          case "method":
            return compareSortableValues(
              methodText(a),
              methodText(b),
              sortState.direction,
              locale,
            );
          case "amount":
            return compareSortableValues(
              a.amount,
              b.amount,
              sortState.direction,
              locale,
            );
          case "status":
            return compareSortableValues(
              statusText(a),
              statusText(b),
              sortState.direction,
              locale,
            );
          case "reference":
            return compareSortableValues(
              a.reference,
              b.reference,
              sortState.direction,
              locale,
            );
          default:
            return 0;
        }
      });
    }

    return result;
  }, [
    transactions,
    columnFilters,
    hasActiveFilters,
    sortState,
    locale,
    methodText,
    statusText,
    transactionText,
  ]);

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
    <div className="bg-card text-card-foreground border border-border rounded-xl shadow-xs overflow-hidden">
      <ActiveTableFiltersBar
        columns={columnsMeta}
        sortState={sortState}
        columnFilters={columnFilters}
        onClearSort={() => setSortState(null)}
        onClearFilter={(key) => setColumnFilter(key, undefined)}
        onResetAll={resetAll}
      />

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <InteractiveTableHead
              columnKey="date"
              header={t("dashboard.transactions.table.date")}
              headClassName="text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
              sortState={sortState}
              onSortChange={setSortState}
              filterType="text"
              filterValue={columnFilters.date}
              onFilterChange={(next) => setColumnFilter("date", next)}
            />
            <InteractiveTableHead
              columnKey="transaction"
              header={t("dashboard.transactions.table.transaction")}
              headClassName="text-xs font-semibold uppercase tracking-wider"
              sortState={sortState}
              onSortChange={setSortState}
              filterType="text"
              filterValue={columnFilters.transaction}
              onFilterChange={(next) => setColumnFilter("transaction", next)}
            />
            <InteractiveTableHead
              columnKey="method"
              header={t("dashboard.transactions.table.method")}
              headClassName="text-xs font-semibold uppercase tracking-wider hidden md:table-cell"
              sortState={sortState}
              onSortChange={setSortState}
              filterType="select"
              filterValue={columnFilters.method}
              filterOptions={methodOptions}
              onFilterChange={(next) => setColumnFilter("method", next)}
            />
            <InteractiveTableHead
              columnKey="amount"
              header={t("dashboard.transactions.table.amount")}
              headClassName="text-xs font-semibold uppercase tracking-wider text-right whitespace-nowrap"
              sortState={sortState}
              onSortChange={setSortState}
              filterType="text"
              filterValue={columnFilters.amount}
              onFilterChange={(next) => setColumnFilter("amount", next)}
            />
            <InteractiveTableHead
              columnKey="status"
              header={t("dashboard.transactions.table.status")}
              headClassName="text-xs font-semibold uppercase tracking-wider"
              sortState={sortState}
              onSortChange={setSortState}
              filterType="select"
              filterValue={columnFilters.status}
              filterOptions={statusOptions}
              onFilterChange={(next) => setColumnFilter("status", next)}
            />
            <InteractiveTableHead
              columnKey="reference"
              header={t("dashboard.transactions.table.reference")}
              headClassName="text-xs font-semibold uppercase tracking-wider hidden lg:table-cell"
              sortState={sortState}
              onSortChange={setSortState}
              filterType="text"
              filterValue={columnFilters.reference}
              onFilterChange={(next) => setColumnFilter("reference", next)}
            />
          </TableRow>
        </TableHeader>

        <TableBody>
          {displayedTransactions.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="h-28 text-center text-sm text-muted-foreground"
              >
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
              </TableCell>
            </TableRow>
          ) : (
            displayedTransactions.map((txn) => {
              const isInflow = txn.amount >= 0;
              // A failed transfer never moved money, so its amount is muted
              // rather than coloured as a real inflow/outflow.
              const amountClassName =
                txn.status === "FAILED"
                  ? "text-muted-foreground line-through"
                  : isInflow
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-foreground";

              return (
                <TableRow key={txn.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap align-middle">
                    {formatDateTime(txn.created_at, locale)}
                  </TableCell>
                  <TableCell className="align-middle">
                    <TransactionTypeCell
                      type={txn.type}
                      counterparty={txn.counterparty}
                    />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden md:table-cell align-middle">
                    {t(`dashboard.transactions.methods.${txn.method_key}`)}
                    {txn.method_ref ? ` ${txn.method_ref}` : ""}
                  </TableCell>
                  <TableCell
                    className={`text-right text-sm font-bold tabular-nums whitespace-nowrap align-middle ${amountClassName}`}
                  >
                    {formatAmount(txn.amount, locale)}
                  </TableCell>
                  <TableCell className="align-middle">
                    <TransactionStatusBadge status={txn.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden lg:table-cell whitespace-nowrap align-middle">
                    {txn.reference}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
