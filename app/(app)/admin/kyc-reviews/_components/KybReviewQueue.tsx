"use client";

import { useState } from "react";

import { DataTable, type Column } from "../../_components/DataTable";
import { TablePager } from "../../_components/TablePager";
import { KybReviewSheet } from "./KybReviewSheet";
import {
  REVIEW_PAGE_SIZE,
  ReviewStatusBadge,
  reviewEmptyMessage,
} from "./KycReviewQueue";
import { useAdminKybVerifications } from "@/hooks/use-admin";
import { useTranslations } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format-date";
import type {
  AdminKybReview,
  AdminReviewFilter,
} from "@/services/admin.service";

// Business verifications (KYB). In AUTOMATIC mode only borderline provider
// results need action; in MANUAL mode every submission does. Same shape as
// the KYC queue: "needs action" is the work, the rest is history.
export function KybReviewQueue({ status }: { status: AdminReviewFilter }) {
  const { t, locale } = useTranslations();
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isLoading, isFetching } = useAdminKybVerifications({
    status,
    page,
    page_size: REVIEW_PAGE_SIZE,
  });

  const columns: Column<AdminKybReview>[] = [
    {
      key: "created_at",
      header: t("admin.kybReviews.table.submitted"),
      cellClassName: "whitespace-nowrap text-xs text-muted-foreground",
      render: (row) =>
        row.created_at ? formatDateTime(row.created_at, locale) : "—",
    },
    {
      key: "applicant",
      header: t("admin.kybReviews.table.applicant"),
      cellClassName: "text-xs",
      render: (row) => (
        <div className="min-w-0 space-y-0.5">
          <p className="truncate font-medium text-foreground">
            {row.projects[0] || row.user.full_name || row.user.email}
          </p>
          <p className="truncate text-muted-foreground">{row.user.email}</p>
        </div>
      ),
    },
    {
      key: "tax_code",
      header: t("admin.kybReviews.table.taxCode"),
      cellClassName: "whitespace-nowrap font-mono text-xs tabular-nums",
      render: (row) => row.tax_code || "—",
    },
    {
      key: "document_type",
      header: t("admin.kybReviews.table.documentType"),
      cellClassName: "text-xs",
      render: (row) => documentTypeLabel(t, row.document_type),
    },
    {
      key: "check",
      header: t("admin.kybReviews.table.check"),
      cellClassName: "text-xs text-muted-foreground",
      render: (row) =>
        row.provider_checked
          ? t("admin.kybReviews.checkProvider")
          : t("admin.kybReviews.checkManual"),
    },
    {
      key: "status",
      header: t("admin.kybReviews.table.status"),
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
        emptyMessage={reviewEmptyMessage(t, "kybReviews", status)}
        onRowClick={(row) => setOpenId(row.id)}
        getRowLabel={(row) =>
          t("admin.kybReviews.rowLabel").replace(
            "{name}",
            row.projects[0] || row.user.full_name || row.user.email,
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

      <KybReviewSheet
        verificationId={openId}
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
      />
    </>
  );
}

const DOCUMENT_TYPES = ["COMPANY", "COMPANY_BRANCH", "HOUSEHOLD"] as const;

export function documentTypeLabel(
  t: (key: string) => string,
  value: string,
): string {
  return (DOCUMENT_TYPES as readonly string[]).includes(value)
    ? t(`admin.kybReviews.documentTypes.${value}`)
    : value;
}
