"use client";

import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Clock, Scale } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { staggerContainerVariants, springItemVariants } from "@/lib/animations";
import { formatCurrency, type TransactionSummary } from "./mock-transactions";

export function TransactionSummaryCards({
  summary,
}: {
  summary: TransactionSummary;
}) {
  const { t } = useTranslations();

  const cards = [
    {
      key: "in",
      label: t("dashboard.transactions.summary.moneyIn"),
      value: formatCurrency(summary.totalIn, "USD", 0),
      hint: t("dashboard.transactions.summary.moneyInHint"),
      icon: ArrowDownLeft,
      valueClassName: "text-emerald-600 dark:text-emerald-400",
    },
    {
      key: "out",
      label: t("dashboard.transactions.summary.moneyOut"),
      value: formatCurrency(summary.totalOut, "USD", 0),
      hint: t("dashboard.transactions.summary.moneyOutHint"),
      icon: ArrowUpRight,
      valueClassName: "text-foreground",
    },
    {
      key: "net",
      label: t("dashboard.transactions.summary.net"),
      value: `${summary.net < 0 ? "−" : ""}${formatCurrency(summary.net, "USD", 0)}`,
      hint: t("dashboard.transactions.summary.netHint"),
      icon: Scale,
      valueClassName:
        summary.net < 0
          ? "text-foreground"
          : "text-emerald-600 dark:text-emerald-400",
    },
    {
      key: "pending",
      label: t("dashboard.transactions.summary.pending"),
      value: String(summary.pendingCount),
      hint: t("dashboard.transactions.summary.pendingHint"),
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
            <span className="text-xs font-semibold text-muted-foreground uppercase font-mono tracking-wider">
              {card.label}
            </span>
            <card.icon
              className="h-4 w-4 text-muted-foreground/70 shrink-0"
              aria-hidden="true"
            />
          </div>
          <div className={`text-2xl font-black ${card.valueClassName}`}>
            {card.value}
          </div>
          <p className="text-xs text-muted-foreground">{card.hint}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
