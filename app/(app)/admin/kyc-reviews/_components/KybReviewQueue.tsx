"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type Column } from "../../_components/DataTable";
import { KybReviewSheet } from "./KybReviewSheet";
import { useAdminKybVerifications } from "@/hooks/use-admin";
import { useTranslations } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format-date";
import { enumLabel } from "@/lib/enum-labels";
import type { AdminKybReview, AdminKycStatus } from "@/services/admin.service";

// Business verifications (KYB) waiting for a person. In AUTOMATIC mode only
// borderline provider results land here; in MANUAL mode every submission
// does. Same shape as the KYC queue: the review tab is the work, the other
// two are history.
const TABS: AdminKycStatus[] = ["MANUAL_REVIEW", "APPROVED", "REJECTED"];

export function KybReviewQueue() {
  const { t, locale } = useTranslations();
  const [status, setStatus] = useState<AdminKycStatus>("MANUAL_REVIEW");
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isLoading, isFetching } = useAdminKybVerifications(status);

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
      render: (row) => (
        <Badge
          variant={row.status === "REJECTED" ? "destructive" : "secondary"}
        >
          {enumLabel(t, "verificationStatus", row.status)}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Tabs
        value={status}
        onValueChange={(value) => setStatus(value as AdminKycStatus)}
      >
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {t(`admin.kycReviews.tabs.${tab}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="rounded-xl border border-border bg-card">
        <DataTable
          columns={columns}
          rows={data ?? []}
          getRowKey={(row) => row.id}
          isLoading={isLoading}
          isFetching={isFetching}
          emptyMessage={
            status === "MANUAL_REVIEW"
              ? t("admin.kybReviews.empty")
              : t("admin.kybReviews.emptyOther")
          }
          onRowClick={(row) => setOpenId(row.id)}
          getRowLabel={(row) =>
            t("admin.kybReviews.rowLabel").replace(
              "{name}",
              row.projects[0] || row.user.full_name || row.user.email,
            )
          }
        />
      </div>

      <KybReviewSheet
        verificationId={openId}
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
      />
    </div>
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
