"use client";

import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import type { AdminRoundFee } from "@/services/admin-funding.service";

// A round's service fee (3% + VAT): paid, unpaid with its due date, or overdue
// (unpaid past it, worked out by the backend since the overdue job does not
// run). Shared by the rounds table and the Service fees tab.
export function FeeStatusBadge({
  fee,
}: {
  fee: Pick<AdminRoundFee, "status" | "due_at" | "is_overdue">;
}) {
  const { t, locale } = useTranslations();

  if (fee.status === "PAID") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      >
        {t("admin.transactions.fees.statusPaid")}
      </Badge>
    );
  }
  if (fee.status === "VOID") {
    return (
      <Badge variant="secondary">
        {t("admin.transactions.fees.statusVoid")}
      </Badge>
    );
  }
  if (fee.is_overdue) {
    return (
      <Badge
        variant="outline"
        className="border-destructive/40 bg-destructive/10 text-destructive"
      >
        {t("admin.transactions.fees.statusOverdue")}
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
    >
      {t("admin.transactions.fees.statusUnpaidDue").replace(
        "{date}",
        formatDate(fee.due_at, locale),
      )}
    </Badge>
  );
}
