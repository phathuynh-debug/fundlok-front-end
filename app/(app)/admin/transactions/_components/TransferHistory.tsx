"use client";

import { Loader2 } from "lucide-react";

import { useAdminFundingActivity } from "@/hooks/use-admin-funding";
import { useTranslations } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format-date";
import { ActivityBadge } from "./ActivityBadge";
import { personName } from "./activity";

// One ticket's audit trail in the review panel, newest first: reserved,
// receipt uploaded, viewed, checked, decided, each with who and why.
export function TransferHistory({ trancheId }: { trancheId: string }) {
  const { t, locale } = useTranslations();
  const { data, isLoading, isError } = useAdminFundingActivity({
    group: "ALL",
    tranche_id: trancheId,
    page: 1,
    page_size: 50,
  });

  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }
  if (isError || !data) {
    return (
      <p role="alert" className="text-xs text-destructive">
        {t("admin.transactions.activity.loadFailed")}
      </p>
    );
  }
  if (data.items.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        {t("admin.transactions.activity.empty.ALL")}
      </p>
    );
  }
  return (
    <ol className="space-y-3 border-l pl-4" data-testid="transfer-history">
      {data.items.map((entry) => (
        <li key={entry.id} className="space-y-1 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <ActivityBadge entry={entry} />
            <span className="text-muted-foreground">
              {entry.created_at ? formatDateTime(entry.created_at, locale) : ""}
            </span>
          </div>
          <p className="text-muted-foreground">
            {t("admin.transactions.activity.byName").replace(
              "{name}",
              personName(entry.actor) ??
                t("admin.transactions.activity.system"),
            )}
          </p>
          {entry.reason && (
            <p className="break-words text-foreground">{entry.reason}</p>
          )}
        </li>
      ))}
    </ol>
  );
}
