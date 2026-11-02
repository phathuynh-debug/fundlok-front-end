"use client";

import { Badge } from "@/components/ui/badge";
import { useTranslations } from "@/lib/i18n";
import type { AdminFundingActivity } from "@/services/admin-funding.service";
import { TONE_CLASS, activityKind } from "./activity";

export function ActivityBadge({ entry }: { entry: AdminFundingActivity }) {
  const { t } = useTranslations();
  const { key, tone } = activityKind(entry);
  return (
    <Badge
      variant={tone === "neutral" ? "secondary" : "outline"}
      className={TONE_CLASS[tone]}
    >
      {key === "other"
        ? entry.action
        : t(`admin.transactions.activity.kinds.${key}`)}
    </Badge>
  );
}

/** The note staff gave; a check without one lists what did not match. */
export function ActivityNote({ entry }: { entry: AdminFundingActivity }) {
  const { t } = useTranslations();
  const flagged = entry.failure_codes.length;
  return (
    <span className="line-clamp-2 break-words">
      {entry.reason ||
        (flagged
          ? t("admin.transactions.activity.flagged").replace(
              "{count}",
              String(flagged),
            )
          : "—")}
    </span>
  );
}
