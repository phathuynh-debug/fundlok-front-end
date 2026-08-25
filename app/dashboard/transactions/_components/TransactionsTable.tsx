"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  return (
    <div className="bg-card text-card-foreground border border-border rounded-xl shadow-xs overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-mono text-[10px] uppercase tracking-wider whitespace-nowrap">
              {t("dashboard.transactions.table.date")}
            </TableHead>
            <TableHead className="font-mono text-[10px] uppercase tracking-wider">
              {t("dashboard.transactions.table.transaction")}
            </TableHead>
            <TableHead className="font-mono text-[10px] uppercase tracking-wider hidden md:table-cell">
              {t("dashboard.transactions.table.method")}
            </TableHead>
            <TableHead className="font-mono text-[10px] uppercase tracking-wider text-right whitespace-nowrap">
              {t("dashboard.transactions.table.amount")}
            </TableHead>
            <TableHead className="font-mono text-[10px] uppercase tracking-wider">
              {t("dashboard.transactions.table.status")}
            </TableHead>
            <TableHead className="font-mono text-[10px] uppercase tracking-wider hidden lg:table-cell">
              {t("dashboard.transactions.table.reference")}
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {transactions.map((txn) => {
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
                  {txn.method}
                </TableCell>
                <TableCell
                  className={`text-right font-mono text-sm font-bold whitespace-nowrap align-middle ${amountClassName}`}
                >
                  {formatAmount(txn.amount, locale)}
                </TableCell>
                <TableCell className="align-middle">
                  <TransactionStatusBadge status={txn.status} />
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground hidden lg:table-cell whitespace-nowrap align-middle">
                  {txn.reference}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
