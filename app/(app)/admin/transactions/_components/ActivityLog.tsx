"use client";

import { useState } from "react";

import { useAdminFundingActivity } from "@/hooks/use-admin-funding";
import { useTranslations } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format-currency";
import { formatDateTime } from "@/lib/format-date";
import type {
  AdminActivityGroup,
  AdminFundingActivity,
} from "@/services/admin-funding.service";
import { DataTable, type Column } from "../../_components/DataTable";
import { TablePager } from "../../_components/TablePager";
import { TransferReviewSheet } from "./TransferReviewSheet";
import { ActivityBadge, ActivityNote } from "./ActivityBadge";
import { personName } from "./activity";

export const ACTIVITY_PAGE_SIZE = 20;

// The transfers' audit trail, newest first: who approved or denied which
// ticket, when and why. Read from the append-only audit log, so it shows what
// was recorded at the time. A row opens the ticket. Remounted (keyed by the
// group) when the filter changes, so it starts again on page 1.
export function ActivityLog({ group }: { group: AdminActivityGroup }) {
  const { t, locale } = useTranslations();
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isLoading, isFetching } = useAdminFundingActivity({
    group,
    page,
    page_size: ACTIVITY_PAGE_SIZE,
  });

  const columns: Column<AdminFundingActivity>[] = [
    {
      key: "created_at",
      header: t("admin.transactions.activity.time"),
      cellClassName: "whitespace-nowrap text-xs text-muted-foreground",
      render: (row) =>
        row.created_at ? formatDateTime(row.created_at, locale) : "—",
    },
    {
      key: "action",
      header: t("admin.transactions.activity.action"),
      render: (row) => <ActivityBadge entry={row} />,
    },
    {
      key: "ticket",
      header: t("admin.transactions.activity.ticket"),
      cellClassName: "whitespace-nowrap text-xs",
      render: (row) => (
        <div className="space-y-0.5">
          <p className="font-mono text-foreground">
            {row.reference_code ?? "—"}
          </p>
          {row.amount_vnd != null && (
            <p className="tabular-nums text-muted-foreground">
              {formatCurrency(row.amount_vnd, locale)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "investor",
      header: t("admin.transactions.table.investor"),
      cellClassName: "text-xs",
      render: (row) => (
        <div className="min-w-0 space-y-0.5">
          <p className="truncate text-foreground">
            {personName(row.investor) ?? "—"}
          </p>
          {row.project_name && (
            <p className="truncate text-muted-foreground">{row.project_name}</p>
          )}
        </div>
      ),
    },
    {
      key: "actor",
      header: t("admin.transactions.activity.by"),
      cellClassName: "text-xs",
      render: (row) => (
        <span className="text-foreground">
          {personName(row.actor) ?? t("admin.transactions.activity.system")}
        </span>
      ),
    },
    {
      key: "reason",
      header: t("admin.transactions.activity.note"),
      cellClassName: "max-w-72 text-xs text-muted-foreground",
      render: (row) => <ActivityNote entry={row} />,
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
        emptyMessage={t(`admin.transactions.activity.empty.${group}`)}
        onRowClick={(row) => row.tranche_id && setOpenId(row.tranche_id)}
        getRowLabel={(row) =>
          t("admin.transactions.activity.rowLabel").replace(
            "{memo}",
            row.reference_code ?? "",
          )
        }
      />
      <TablePager
        page={page}
        pageSize={ACTIVITY_PAGE_SIZE}
        total={data?.total ?? 0}
        unit={t("admin.pagination.entries")}
        isFetching={isFetching}
        onPageChange={setPage}
      />

      <TransferReviewSheet
        trancheId={openId}
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
      />
    </>
  );
}
