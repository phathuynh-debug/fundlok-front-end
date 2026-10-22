"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type Column } from "../../_components/DataTable";
import { KycReviewSheet } from "./KycReviewSheet";
import { useAdminKycVerifications } from "@/hooks/use-admin";
import { useTranslations } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format-date";
import { enumLabel } from "@/lib/enum-labels";
import type {
  AdminKycStatus,
  AdminKycVerification,
} from "@/services/admin.service";

// The statuses an operator browses. MANUAL_REVIEW is the queue and the only one
// with anything to act on; the other two are history, for checking a past
// decision. FAILED (a provider outage) is left out: there is nothing to review.
const TABS: AdminKycStatus[] = ["MANUAL_REVIEW", "APPROVED", "REJECTED"];

export function KycReviewQueue() {
  const { t, locale } = useTranslations();
  const [status, setStatus] = useState<AdminKycStatus>("MANUAL_REVIEW");
  // Only the id is held: the panel fetches its own copy, so it shows the
  // conflict list as it is now rather than as it was when the queue loaded.
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isLoading, isFetching } = useAdminKycVerifications(status);

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
            {status === "MANUAL_REVIEW"
              ? t("admin.kycReviews.noConflict")
              : "—"}
          </span>
        ),
    },
    {
      key: "status",
      header: t("admin.kycReviews.table.status"),
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
              ? t("admin.kycReviews.empty")
              : t("admin.kycReviews.emptyOther")
          }
          onRowClick={(row) => setOpenId(row.id)}
          getRowLabel={(row) =>
            t("admin.kycReviews.rowLabel").replace(
              "{name}",
              row.user.full_name || row.user.email,
            )
          }
        />
      </div>

      <KycReviewSheet
        verificationId={openId}
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
      />
    </div>
  );
}

export function conflictLabel(t: (key: string) => string, count: number) {
  return count === 1
    ? t("admin.kycReviews.conflictOne")
    : t("admin.kycReviews.conflictMany").replace("{count}", String(count));
}
