"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { useAdminInvestorTransfers } from "@/hooks/use-admin-funding";
import { useTranslations } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format-currency";
import { formatDateTime } from "@/lib/format-date";
import { enumLabel } from "@/lib/enum-labels";
import type {
  AdminInvestorTransfer,
  AdminTransferFilter,
} from "@/services/admin-funding.service";
import { DataTable, type Column } from "../../_components/DataTable";
import { TablePager } from "../../_components/TablePager";
import { TransferReviewSheet } from "./TransferReviewSheet";

export const TRANSFER_PAGE_SIZE = 20;

// Investor tickets, the ones waiting on staff first. Remounted (keyed by the
// filters) when they change, so it starts again on page 1.
export function TransferQueue({
  status,
  windowId,
}: {
  status: AdminTransferFilter;
  windowId?: string;
}) {
  const { t, locale } = useTranslations();
  const [page, setPage] = useState(1);
  // Only the id is held: the panel reads its own copy of the ticket.
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isLoading, isFetching } = useAdminInvestorTransfers({
    status,
    ...(windowId ? { window_id: windowId } : {}),
    page,
    page_size: TRANSFER_PAGE_SIZE,
  });

  const columns: Column<AdminInvestorTransfer>[] = [
    {
      key: "reserved_at",
      header: t("admin.transactions.table.reserved"),
      cellClassName: "whitespace-nowrap text-xs text-muted-foreground",
      render: (row) => formatDateTime(row.reserved_at, locale),
    },
    {
      key: "investor",
      header: t("admin.transactions.table.investor"),
      cellClassName: "text-xs",
      render: (row) => (
        <div className="min-w-0 space-y-0.5">
          <p className="truncate font-medium text-foreground">
            {row.investor_full_name || row.investor_email}
          </p>
          {row.investor_full_name && (
            <p className="truncate text-muted-foreground">
              {row.investor_email}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "project",
      header: t("admin.transactions.table.project"),
      cellClassName: "max-w-48 truncate text-xs",
      filterType: "select",
      render: (row) => row.project_name,
    },
    {
      key: "amount",
      header: t("admin.transactions.table.amount"),
      cellClassName: "whitespace-nowrap text-xs font-semibold tabular-nums",
      sortValue: (row) => row.amount_vnd,
      render: (row) => formatCurrency(row.amount_vnd, locale),
    },
    {
      key: "memo",
      header: t("admin.transactions.table.memo"),
      cellClassName: "whitespace-nowrap font-mono text-xs",
      sortValue: (row) => row.reference_code,
      render: (row) => row.reference_code,
    },
    {
      key: "receipt",
      header: t("admin.transactions.table.receipt"),
      cellClassName: "whitespace-nowrap text-xs text-muted-foreground",
      sortValue: (row) => row.receipt_submitted_at,
      render: (row) =>
        row.receipt_submitted_at
          ? formatDateTime(row.receipt_submitted_at, locale)
          : row.transfer?.has_file
            ? t("admin.transactions.table.receiptIn")
            : "—",
    },
    {
      key: "status",
      header: t("admin.transactions.table.status"),
      filterType: "select",
      render: (row) => <TransferStatusBadge transfer={row} />,
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
        emptyMessage={
          status === "NEEDS_ACTION"
            ? t("admin.transactions.emptyQueue")
            : t("admin.transactions.empty")
        }
        onRowClick={(row) => setOpenId(row.id)}
        getRowLabel={(row) =>
          t("admin.transactions.rowLabel")
            .replace("{name}", row.investor_full_name || row.investor_email)
            .replace("{memo}", row.reference_code)
        }
      />
      <TablePager
        page={page}
        pageSize={TRANSFER_PAGE_SIZE}
        total={data?.total ?? 0}
        unit={t("admin.pagination.transfers")}
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

/** A ticket waiting on staff says what for and stands out; the rest show
 *  their state. */
export function TransferStatusBadge({
  transfer,
}: {
  transfer: AdminInvestorTransfer;
}) {
  const { t } = useTranslations();
  if (transfer.needs_action) {
    const smeDisputed =
      transfer.dispute?.status !== "DECIDED" &&
      (transfer.dispute?.cause === "SME_DISPUTE" ||
        transfer.review_cause === "SME_DISPUTE");
    if (smeDisputed) {
      return (
        <Badge
          variant="outline"
          className="border-destructive/40 bg-destructive/10 text-destructive"
        >
          {t("admin.transactions.needs.smeDispute")}
        </Badge>
      );
    }
    const toCheck = transfer.transfer?.check_status === "AWAITING_FIELDS";
    return (
      <Badge
        variant="outline"
        className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      >
        {toCheck
          ? t("admin.transactions.needs.receipt")
          : t("admin.transactions.needs.decision")}
      </Badge>
    );
  }
  return (
    <Badge variant={transfer.status === "VOID" ? "destructive" : "secondary"}>
      {enumLabel(t, "trancheStatus", transfer.status)}
    </Badge>
  );
}
