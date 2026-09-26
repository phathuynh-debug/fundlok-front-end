"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical, History, Search, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireAuth } from "@/hooks/use-authentication";
import { pageTransitionProps } from "@/lib/animations";
import { useTranslations } from "@/lib/i18n";
import { DashboardHeader } from "../_components/DashboardHeader";
import { TransactionSummaryCards } from "./_components/TransactionSummaryCards";
import { TransactionsTable } from "./_components/TransactionsTable";
import { SmeTransactionSummaryCards } from "./_components/sme/SmeTransactionSummaryCards";
import {
  MOCK_SME_TRANSACTIONS,
  SME_TYPE_FILTERS,
  summarizeSme,
} from "./_components/sme/mock-sme-transactions";
import { transactionTypeLabelKey } from "./_components/TransactionTypeCell";
import {
  MOCK_TRANSACTIONS,
  summarize,
  type TransactionStatus,
  type TransactionType,
} from "./_components/mock-transactions";
import { CONTROL_HOVER, CONTROL_IDLE } from "@/lib/ui-tokens";

const TYPE_FILTERS: TransactionType[] = [
  "INVESTMENT",
  "RETURN",
  "DEPOSIT",
  "WITHDRAWAL",
  "REPAYMENT",
  "FEE",
];

const STATUS_FILTERS: TransactionStatus[] = ["COMPLETED", "PENDING", "FAILED"];

const STATUS_LABEL_KEYS: Record<TransactionStatus, string> = {
  COMPLETED: "dashboard.transactions.status.completed",
  PENDING: "dashboard.transactions.status.pending",
  FAILED: "dashboard.transactions.status.failed",
};

function TransactionsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-xl p-5 space-y-2 shadow-xs"
          >
            <Skeleton className="h-3 w-20 rounded-sm" />
            <Skeleton className="h-7 w-28 rounded-md" />
            <Skeleton className="h-3 w-24 rounded-sm" />
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
            <Skeleton className="h-4 flex-1 rounded-sm" />
            <Skeleton className="h-4 w-24 rounded-sm hidden sm:block" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TransactionsClient() {
  const { user, isLoading: isAuthLoading } = useRequireAuth();
  const { t } = useTranslations();

  // FE-013: a borrower's ledger is the other half of the omnibus flow —
  // disbursement in, repayments and fees out. Investments, returns and
  // distributions describe an investor, so the SME gets its own dataset,
  // summary tiles and filter chips rather than the investor screen relabelled.
  const isSme = user?.role === "SME";
  const transactions = isSme ? MOCK_SME_TRANSACTIONS : MOCK_TRANSACTIONS;
  const typeFilters = isSme ? SME_TYPE_FILTERS : TYPE_FILTERS;

  // All local UI state: none of this round-trips to the server, so it stays in
  // useState rather than React Query.
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<TransactionType | "ALL">(
    "ALL",
  );
  const [selectedStatus, setSelectedStatus] = useState<
    TransactionStatus | "ALL"
  >("ALL");

  const filteredTransactions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return transactions.filter((txn) => {
      const matchesSearch =
        query === "" ||
        txn.counterparty.toLowerCase().includes(query) ||
        txn.reference.toLowerCase().includes(query) ||
        (txn.method_ref ?? "").toLowerCase().includes(query);
      const matchesType = selectedType === "ALL" || txn.type === selectedType;
      const matchesStatus =
        selectedStatus === "ALL" || txn.status === selectedStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [transactions, searchTerm, selectedType, selectedStatus]);

  // Totals reflect what is on screen, so they stay consistent with the filters.
  const summary = useMemo(
    () => summarize(filteredTransactions),
    [filteredTransactions],
  );
  const smeSummary = useMemo(
    () => summarizeSme(filteredTransactions),
    [filteredTransactions],
  );

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />

      <motion.div
        {...pageTransitionProps}
        className="flex-1 space-y-6 md:space-y-8 p-4 md:p-8 pt-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {t(
                isSme
                  ? "dashboard.transactions.smeTitle"
                  : "dashboard.transactions.title",
              )}
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              {t(
                isSme
                  ? "dashboard.transactions.smeSubtitle"
                  : "dashboard.transactions.subtitle",
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-full text-xs font-semibold w-fit border border-emerald-500/20">
            <History className="h-4 w-4" />
            <span>
              {t("dashboard.transactions.count", {
                count: transactions.length,
              })}
            </span>
          </div>
        </div>

        {/* Sample-data notice: this screen is not wired to the backend yet, and
            the numbers below should not be read as real balances. */}
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
          <FlaskConical className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            {t(
              isSme
                ? "dashboard.transactions.smeMockNotice"
                : "dashboard.transactions.mockNotice",
            )}
          </p>
        </div>

        {isAuthLoading ? (
          <TransactionsSkeleton />
        ) : (
          <>
            {isSme ? (
              <SmeTransactionSummaryCards summary={smeSummary} />
            ) : (
              <TransactionSummaryCards summary={summary} />
            )}

            {/* Search + status filter */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("dashboard.transactions.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200/50 dark:border-zinc-800/40 w-fit flex items-center gap-1">
                {(["ALL", ...STATUS_FILTERS] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSelectedStatus(status)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold uppercase transition-all duration-200 cursor-pointer ${
                      selectedStatus === status
                        ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs border border-border/10"
                        : `${CONTROL_IDLE} bg-transparent border border-transparent`
                    }`}
                  >
                    {status === "ALL"
                      ? t("common.all")
                      : t(STATUS_LABEL_KEYS[status])}
                  </button>
                ))}
              </div>
            </div>

            {/* Type filter */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mr-1">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {t("dashboard.transactions.filterByType")}
              </span>
              {(["ALL", ...typeFilters] as const).map((type) => (
                <Badge
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  className={`cursor-pointer rounded-full transition-all ${
                    selectedType === type
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : CONTROL_HOVER
                  }`}
                  onClick={() => setSelectedType(type)}
                >
                  {type === "ALL"
                    ? t("common.all")
                    : t(transactionTypeLabelKey(type))}
                </Badge>
              ))}
            </div>

            <div className="text-xs font-semibold text-muted-foreground tracking-wide">
              {t("dashboard.transactions.showing", {
                shown: filteredTransactions.length,
                total: MOCK_TRANSACTIONS.length,
              })}
            </div>

            <AnimatePresence mode="wait">
              {filteredTransactions.length > 0 ? (
                <motion.div
                  key="table"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <TransactionsTable transactions={filteredTransactions} />
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="text-center py-16 bg-muted/30 rounded-lg border border-dashed flex flex-col items-center justify-center p-6"
                >
                  <History className="h-10 w-10 text-muted-foreground/60 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {t("dashboard.transactions.empty.title")}
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    {t("dashboard.transactions.empty.description")}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </motion.div>
    </div>
  );
}
