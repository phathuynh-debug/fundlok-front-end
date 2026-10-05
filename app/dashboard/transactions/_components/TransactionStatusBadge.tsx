"use client";

import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "@/lib/i18n";
import type { TransactionStatus } from "./mock-transactions";

// Accent tints rather than raw colours: emerald/amber/destructive all read on
// both themes, and each badge carries an icon so status is not conveyed by
// colour alone.
const STATUS_STYLES: Record<
  TransactionStatus,
  { className: string; icon: typeof CheckCircle2; labelKey: string }
> = {
  COMPLETED: {
    className:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: CheckCircle2,
    labelKey: "dashboard.transactions.status.completed",
  },
  PENDING: {
    className:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: Clock,
    labelKey: "dashboard.transactions.status.pending",
  },
  FAILED: {
    className: "bg-destructive/10 text-destructive border-destructive/20",
    icon: XCircle,
    labelKey: "dashboard.transactions.status.failed",
  },
};

export function TransactionStatusBadge({
  status,
}: {
  status: TransactionStatus;
}) {
  const { t } = useTranslations();
  const { className, icon: Icon, labelKey } = STATUS_STYLES[status];

  return (
    <Badge
      variant="outline"
      className={`${className} text-[11px] uppercase font-semibold tracking-wider rounded-full px-2.5 py-0.5 flex items-center gap-1 w-fit`}
    >
      <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
      {t(labelKey)}
    </Badge>
  );
}
