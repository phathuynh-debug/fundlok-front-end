"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import type { TransactionType } from "./mock-transactions";

const TYPE_CONFIG: Record<
  TransactionType,
  { icon: typeof Wallet; labelKey: string }
> = {
  INVESTMENT: {
    icon: TrendingUp,
    labelKey: "dashboard.transactions.types.investment",
  },
  RETURN: {
    icon: ArrowDownLeft,
    labelKey: "dashboard.transactions.types.return",
  },
  DEPOSIT: { icon: Wallet, labelKey: "dashboard.transactions.types.deposit" },
  WITHDRAWAL: {
    icon: ArrowUpRight,
    labelKey: "dashboard.transactions.types.withdrawal",
  },
  REPAYMENT: {
    icon: Banknote,
    labelKey: "dashboard.transactions.types.repayment",
  },
  FEE: { icon: Receipt, labelKey: "dashboard.transactions.types.fee" },
};

export function transactionTypeLabelKey(type: TransactionType) {
  return TYPE_CONFIG[type].labelKey;
}

export function TransactionTypeCell({
  type,
  counterparty,
}: {
  type: TransactionType;
  counterparty: string;
}) {
  const { t } = useTranslations();
  const { icon: Icon, labelKey } = TYPE_CONFIG[type];

  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
        aria-hidden="true"
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-foreground truncate">
          {t(labelKey)}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {counterparty}
        </div>
      </div>
    </div>
  );
}
