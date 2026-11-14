"use client";

import { BadgeCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAdminFeeInvoices } from "@/hooks/use-admin-funding";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate, formatDateTime } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import type {
  AdminFeeInvoice,
  FeeInvoiceFilter,
} from "@/services/admin-funding.service";
import { DataTable, type Column } from "../../_components/DataTable";
import { FeeStatusBadge } from "./FeeStatusBadge";

// SME service fees: one per closed round, 3% of what its investments sent the
// business plus VAT, paid into FundLok's own account. Unpaid first, soonest
// due. A row opens the fee with its investment package (FeeInvoiceSheet); an
// unpaid row's "Mark as paid" button opens it straight at the payment form.
export function FeeInvoicesTable({
  status,
  onOpen,
  onMarkPaid,
}: {
  status: FeeInvoiceFilter;
  onOpen: (invoice: AdminFeeInvoice) => void;
  /** Opens the fee with the cursor in the "mark paid" form. */
  onMarkPaid: (invoice: AdminFeeInvoice) => void;
}) {
  const { t, locale } = useTranslations();
  const { data, isLoading, isFetching, isError } = useAdminFeeInvoices(status);
  const money = (vnd: number) => formatCurrency(vnd, locale);

  const columns: Column<AdminFeeInvoice>[] = [
    {
      key: "project",
      header: t("admin.transactions.rounds.project"),
      cellClassName: "text-xs",
      sortValue: (row) => row.project_name,
      render: (row) => (
        <div className="min-w-0 space-y-0.5">
          <p className="truncate font-medium text-foreground">
            {row.project_name}
          </p>
          <p className="truncate text-muted-foreground">
            {row.sme_full_name || row.sme_email}
          </p>
        </div>
      ),
    },
    {
      key: "package",
      header: t("admin.transactions.fees.package"),
      cellClassName: "whitespace-nowrap text-xs tabular-nums",
      sortValue: (row) => row.base_vnd,
      render: (row) => (
        <div className="space-y-0.5">
          <p className="font-medium text-foreground">{money(row.base_vnd)}</p>
          <p className="text-muted-foreground">
            {t("admin.transactions.fees.investmentCount").replace(
              "{count}",
              String(row.investments.length),
            )}
          </p>
        </div>
      ),
    },
    {
      key: "fee",
      header: t("admin.transactions.fees.fee"),
      cellClassName: "whitespace-nowrap text-xs tabular-nums",
      sortValue: (row) => row.total_vnd,
      render: (row) => (
        <span className="font-semibold text-foreground">
          {money(row.total_vnd)}
        </span>
      ),
    },
    {
      key: "memo",
      header: t("admin.transactions.fees.memoColumn"),
      cellClassName: "font-mono text-xs",
      render: (row) => row.reference_code,
    },
    {
      key: "due",
      header: t("admin.transactions.fees.due"),
      cellClassName: "whitespace-nowrap text-xs",
      sortValue: (row) => row.due_at,
      render: (row) =>
        row.status === "PAID" && row.paid_at
          ? t("admin.transactions.fees.paidOn").replace(
              "{date}",
              formatDate(row.paid_at, locale),
            )
          : formatDate(row.due_at, locale),
    },
    {
      key: "email",
      header: t("admin.transactions.fees.emailColumn"),
      cellClassName: "whitespace-nowrap text-xs text-muted-foreground",
      filterType: "select",
      filterValue: (row) => emailLabel(row, t),
      render: (row) =>
        row.email_status === "SENT" && row.emailed_at ? (
          <span title={formatDateTime(row.emailed_at, locale)}>
            {emailLabel(row, t)}
          </span>
        ) : row.email_status === "FAILED" ? (
          <span className="text-destructive">{emailLabel(row, t)}</span>
        ) : (
          emailLabel(row, t)
        ),
    },
    {
      key: "status",
      header: t("admin.transactions.fees.status"),
      render: (row) => <FeeStatusBadge fee={row} />,
    },
    {
      key: "action",
      header: t("admin.transactions.rounds.action"),
      render: (row) =>
        row.status === "PAID" || row.status === "VOID" ? null : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5 whitespace-nowrap"
            onClick={(event) => {
              // The row itself opens the fee without the form focused.
              event.stopPropagation();
              onMarkPaid(row);
            }}
          >
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
            {t("admin.transactions.fees.markSubmit")}
          </Button>
        ),
    },
  ];

  if (isError) {
    return (
      <p role="alert" className="p-6 text-sm text-destructive">
        {t("admin.transactions.fees.loadFailed")}
      </p>
    );
  }

  return (
    <DataTable
      columns={columns}
      rows={data ?? []}
      getRowKey={(row) => row.id}
      isLoading={isLoading}
      isFetching={isFetching}
      emptyMessage={
        status === "UNPAID"
          ? t("admin.transactions.fees.emptyUnpaid")
          : t("admin.transactions.fees.empty")
      }
      onRowClick={onOpen}
      getRowLabel={(row) =>
        t("admin.transactions.fees.rowLabel").replace(
          "{name}",
          row.project_name,
        )
      }
    />
  );
}

function emailLabel(row: AdminFeeInvoice, t: (key: string) => string) {
  switch (row.email_status) {
    case "SENT":
      return t("admin.transactions.fees.emailSent");
    case "FAILED":
      return t("admin.transactions.fees.emailFailed");
    case "SENDING":
      return t("admin.transactions.fees.emailSending");
    default:
      return t("admin.transactions.fees.emailNone");
  }
}
