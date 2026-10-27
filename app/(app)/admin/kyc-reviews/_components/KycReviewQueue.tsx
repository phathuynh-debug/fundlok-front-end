"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "../../_components/DataTable";
import { TablePager } from "../../_components/TablePager";
import { KycReviewSheet } from "./KycReviewSheet";
import { useAdminKycVerifications } from "@/hooks/use-admin";
import { useTranslations } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format-date";
import { enumLabel } from "@/lib/enum-labels";
import type {
  AdminKycVerification,
  AdminReviewFilter,
} from "@/services/admin.service";

export const REVIEW_PAGE_SIZE = 20;

// The statuses an operator filters by. MANUAL_REVIEW ("needs action") is the
// queue and the only one with anything to act on; the other two are history,
// for checking a past decision. FAILED (a provider outage) is left out: there
// is nothing to review. ALL lists the three, the ones needing action first.
export const REVIEW_FILTERS: AdminReviewFilter[] = [
  "ALL",
  "MANUAL_REVIEW",
  "APPROVED",
  "REJECTED",
];

// Remounted (keyed by the filter) when the filter changes, so it starts again
// on page 1.
export function KycReviewQueue({ status }: { status: AdminReviewFilter }) {
  const { t, locale } = useTranslations();
  const [page, setPage] = useState(1);
  // Only the id is held: the panel fetches its own copy, so it shows the
  // conflict list as it is now rather than as it was when the queue loaded.
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isLoading, isFetching } = useAdminKycVerifications({
    status,
    page,
    page_size: REVIEW_PAGE_SIZE,
  });

  const columns: Column<AdminKycVerification>[] = [
    {
      key: "created_at",
      header: t("admin.kycReviews.table.submitted"),
      cellClassName: "whitespace-nowrap text-xs text-muted-foreground",
      render: (row) =>
        row.created_at ? formatDateTime(row.created_at, locale) : "—",
    },
    {
      key: "investor",
      header: t("admin.kycReviews.table.investor"),
      cellClassName: "text-xs",
      render: (row) => (
        <div className="min-w-0 space-y-0.5">
          <p className="truncate font-medium text-foreground">
            {row.user.full_name || row.user.email}
          </p>
          {row.user.full_name && (
            <p className="truncate text-muted-foreground">{row.user.email}</p>
          )}
        </div>
      ),
    },
    {
      key: "person_number",
      header: t("admin.kycReviews.table.idNumber"),
      cellClassName: "whitespace-nowrap font-mono text-xs tabular-nums",
      render: (row) => row.person_number || "—",
    },
    {
      key: "full_name",
      header: t("admin.kycReviews.table.nameOnCard"),
      cellClassName: "text-xs",
      render: (row) => row.full_name || "—",
    },
    {
      key: "conflicts",
      header: t("admin.kycReviews.table.conflicts"),
      cellClassName: "text-xs",
      render: (row) =>
        !row.provider_checked && row.conflicts.length === 0 ? (
          <span className="text-muted-foreground">
            {t("admin.kycReviews.manualMode")}
          </span>
        ) : row.conflicts.length > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {conflictLabel(t, row.conflicts.length)}
          </span>
        ) : (
          <span className="text-muted-foreground">
            {row.status === "MANUAL_REVIEW"
              ? t("admin.kycReviews.noConflict")
              : "—"}
          </span>
        ),
    },
    {
      key: "status",
      header: t("admin.kycReviews.table.status"),
      render: (row) => <ReviewStatusBadge status={row.status} />,
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        getRowKey={(row) => row.id}
        isLoading={isLoading}
        isFetching={isFetching}
        emptyMessage={reviewEmptyMessage(t, "kycReviews", status)}
        onRowClick={(row) => setOpenId(row.id)}
        getRowLabel={(row) =>
          t("admin.kycReviews.rowLabel").replace(
            "{name}",
            row.user.full_name || row.user.email,
          )
        }
      />
      <TablePager
        page={page}
        pageSize={REVIEW_PAGE_SIZE}
        total={data?.total ?? 0}
        unit={t("admin.pagination.verifications")}
        isFetching={isFetching}
        onPageChange={setPage}
      />

      <KycReviewSheet
        verificationId={openId}
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
      />
    </>
  );
}

/** A waiting attempt reads "Needs action" and stands out; decided ones show
 *  their outcome. */
export function ReviewStatusBadge({ status }: { status: string }) {
  const { t } = useTranslations();
  if (status === "MANUAL_REVIEW") {
    return (
      <Badge
        variant="outline"
        className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      >
        {t("admin.kycReviews.filters.MANUAL_REVIEW")}
      </Badge>
    );
  }
  return (
    <Badge variant={status === "REJECTED" ? "destructive" : "secondary"}>
      {enumLabel(t, "verificationStatus", status)}
    </Badge>
  );
}

export function reviewEmptyMessage(
  t: (key: string) => string,
  section: "kycReviews" | "kybReviews",
  status: AdminReviewFilter,
) {
  if (status === "MANUAL_REVIEW") return t(`admin.${section}.empty`);
  if (status === "ALL") return t(`admin.${section}.emptyAll`);
  return t(`admin.${section}.emptyOther`);
}

export function conflictLabel(t: (key: string) => string, count: number) {
  return count === 1
    ? t("admin.kycReviews.conflictOne")
    : t("admin.kycReviews.conflictMany").replace("{count}", String(count));
}
