"use client";

import { useState } from "react";
import { useAdminRepaymentReceipts } from "@/hooks/use-admin-funding";
import { useTranslations } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate, formatDateTime } from "@/lib/format-date";
import type {
  AdminRepaymentFilter,
  AdminRepaymentReceipt,
} from "@/services/admin-funding.service";
import { DataTable, type Column } from "../../_components/DataTable";
import { TablePager } from "../../_components/TablePager";
import { personName } from "./activity";
import { RepaymentReviewSheet } from "./RepaymentReviewSheet";
import { RepaymentStatusBadge } from "./RepaymentStatusBadge";

export const REPAYMENT_PAGE_SIZE = 20;

const K = "admin.transactions.repayments";

// The receipts businesses uploaded when they repaid an investor, the ones
// waiting on staff first. Remounted (keyed by the filter) when it changes, so
// it starts again on page 1.
export function RepaymentQueue({ status }: { status: AdminRepaymentFilter }) {
  const { t, locale } = useTranslations();
  const [page, setPage] = useState(1);
  // Only the id is held: the panel reads its own copy of the receipt.
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isLoading, isFetching } = useAdminRepaymentReceipts({
    status,
    page,
    page_size: REPAYMENT_PAGE_SIZE,
  });

  const columns: Column<AdminRepaymentReceipt>[] = [
    {
      key: "submitted_at",
      header: t(`${K}.table.submitted`),
      cellClassName: "whitespace-nowrap text-xs text-muted-foreground",
      render: (row) => formatDateTime(row.submitted_at, locale),
    },
    {
      key: "business",
      header: t(`${K}.table.business`),
      cellClassName: "max-w-48 text-xs",
      render: (row) => (
        <div className="min-w-0 space-y-0.5">
          <p className="truncate font-medium text-foreground">
            {personName(row.business)}
          </p>
          <p className="truncate text-muted-foreground">{row.project_name}</p>
        </div>
      ),
    },
    {
      key: "investor",
      header: t(`${K}.table.investor`),
      cellClassName: "max-w-40 truncate text-xs",
      render: (row) => personName(row.investor),
    },
    {
      key: "amount",
      header: t(`${K}.table.amount`),
      cellClassName: "whitespace-nowrap text-xs font-semibold tabular-nums",
      render: (row) => formatCurrency(row.net_vnd, locale),
    },
    {
      key: "days",
      header: t(`${K}.table.days`),
      cellClassName: "whitespace-nowrap text-xs text-muted-foreground",
      render: (row) => {
        const dates = [...new Set(row.days.map((day) => day.due_date))];
        return dates.length === 1
          ? formatDate(dates[0], locale)
          : t(`${K}.table.daysValue`, {
              count: dates.length,
              first: formatDate(dates[0], locale),
            });
      },
    },
    {
      key: "memo",
      header: t("admin.transactions.table.memo"),
      cellClassName: "whitespace-nowrap font-mono text-xs",
      render: (row) => row.reference_code,
    },
    {
      key: "status",
      header: t("admin.transactions.table.status"),
      render: (row) => <RepaymentStatusBadge receipt={row} />,
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
          status === "NEEDS_ACTION" ? t(`${K}.emptyQueue`) : t(`${K}.empty`)
        }
        onRowClick={(row) => setOpenId(row.id)}
        getRowLabel={(row) =>
          t(`${K}.rowLabel`, {
            business: personName(row.business) ?? "",
            investor: personName(row.investor) ?? "",
          })
        }
      />
      <TablePager
        page={page}
        pageSize={REPAYMENT_PAGE_SIZE}
        total={data?.total ?? 0}
        unit={t(`${K}.unit`)}
        isFetching={isFetching}
        onPageChange={setPage}
      />

      <RepaymentReviewSheet
        receiptId={openId}
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
      />
    </>
  );
}
