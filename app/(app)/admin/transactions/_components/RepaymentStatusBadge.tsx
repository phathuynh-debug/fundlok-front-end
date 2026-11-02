"use client";

import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useTranslations } from "@/lib/i18n";
import type { AdminRepaymentReceipt } from "@/services/admin-funding.service";

const K = "admin.transactions.repayments";

/** A receipt waiting on staff stands out, and says when the investor reported
 *  a day missing; a decided one says how it went. */
export function RepaymentStatusBadge({
  receipt,
}: {
  receipt: AdminRepaymentReceipt;
}) {
  const { t } = useTranslations();
  if (receipt.needs_action) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <Badge
          variant="outline"
          className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
        >
          {t(`${K}.status.AWAITING_FIELDS`)}
        </Badge>
        {receipt.open_report && (
          <AlertTriangle
            className="h-3.5 w-3.5 text-destructive"
            aria-label={t(`${K}.reported`)}
          />
        )}
      </span>
    );
  }
  return (
    <Badge
      variant="outline"
      className={
        receipt.check_status === "MATCHED"
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-destructive/40 bg-destructive/10 text-destructive"
      }
    >
      {t(`${K}.status.${receipt.check_status}`)}
    </Badge>
  );
}
