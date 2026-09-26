"use client";

import { motion } from "framer-motion";
import { ArrowDownLeft, Banknote, Clock, Receipt } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { staggerContainerVariants, springItemVariants } from "@/lib/animations";
import { formatCurrency } from "@/lib/format-currency";
import type { SmeTransactionSummary } from "./mock-sme-transactions";

// The investor tiles are money-in / money-out / net / pending. Net is
// meaningless for a borrower — every loan starts deeply "positive" on
// disbursement and works back toward zero, so the number would read as profit.
// A borrower's four questions are: what did I receive, what have I paid back,
// what did the platform take, and what is still in flight.
export function SmeTransactionSummaryCards({
  summary,
}: {
  summary: SmeTransactionSummary;
}) {
  const { locale, t } = useTranslations();

  const cards = [
    {
      key: "disbursed",
      label: t("dashboard.transactions.smeSummary.disbursed"),
      value: formatCurrency(summary.disbursed, locale),
      hint: t("dashboard.transactions.smeSummary.disbursedHint"),
      icon: ArrowDownLeft,
      valueClassName: "text-emerald-600 dark:text-emerald-400",
    },
    {
      key: "repaid",
      label: t("dashboard.transactions.smeSummary.repaid"),
      value: formatCurrency(summary.repaid, locale),
      hint: t("dashboard.transactions.smeSummary.repaidHint"),
      icon: Banknote,
      valueClassName: "text-foreground",
    },
    {
      key: "fees",
      label: t("dashboard.transactions.smeSummary.fees"),
      value: formatCurrency(summary.fees, locale),
      hint: t("dashboard.transactions.smeSummary.feesHint"),
      icon: Receipt,
      valueClassName: "text-foreground",
    },
    {
      key: "pending",
      label: t("dashboard.transactions.smeSummary.pending"),
      value: String(summary.pendingCount),
      hint: t("dashboard.transactions.smeSummary.pendingHint"),
      icon: Clock,
      valueClassName: "text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {cards.map((card) => (
        <motion.div
          key={card.key}
          variants={springItemVariants}
          className="bg-card text-card-foreground border border-border rounded-xl shadow-xs p-5 space-y-1"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {card.label}
            </span>
            <card.icon
              className="h-4 w-4 text-muted-foreground/70 shrink-0"
              aria-hidden="true"
            />
          </div>
          {/* Ten-digit VND figures: one line, clipped at the card edge rather
              than overflowing it. */}
          <div
            className={`truncate whitespace-nowrap text-xl font-black ${card.valueClassName}`}
          >
            {card.value}
          </div>
          <p className="text-xs text-muted-foreground">{card.hint}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
