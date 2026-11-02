"use client";

import { FastForward, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  useAdminFundingRounds,
  useAdvanceRound,
} from "@/hooks/use-admin-funding";
import { useToast } from "@/hooks/use-toast";
import { apiErrorMessage } from "@/lib/api-error-message";
import { useTranslations } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-date";
import { enumLabel } from "@/lib/enum-labels";
import type {
  AdminFundingRound,
  AdminRoundFilter,
} from "@/services/admin-funding.service";
import { DataTable, type Column } from "../../_components/DataTable";

// Funding rounds, closing soonest first: what each has raised (confirmed) and
// holds (reserved, not yet paid), what is still open, and how many of its
// tickets wait on staff. A row opens the round's transfers. "Advance" does what
// is due on the round now (close it, then form the loan and its daily
// repayment days): the scheduled job that would do it is not running.
export function FundingRoundsTable({
  status,
  onOpen,
}: {
  status: AdminRoundFilter;
  onOpen: (round: AdminFundingRound) => void;
}) {
  const { t, locale } = useTranslations();
  const { data, isLoading, isFetching } = useAdminFundingRounds(status);
  const advance = useAdvanceRound();
  const { toast } = useToast();
  const money = (vnd: number) => formatCurrency(vnd, locale);

  const columns: Column<AdminFundingRound>[] = [
    {
      key: "project",
      header: t("admin.transactions.rounds.project"),
      cellClassName: "text-xs",
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
      key: "status",
      header: t("admin.transactions.rounds.status"),
      render: (row) => (
        <Badge variant="secondary">
          {enumLabel(t, "fundingWindowStatus", row.status)}
        </Badge>
      ),
    },
    {
      key: "raised",
      header: t("admin.transactions.rounds.raised"),
      cellClassName: "min-w-44 text-xs",
      render: (row) => (
        <div className="space-y-1.5">
          <p className="tabular-nums text-foreground">
            <span className="font-semibold">{money(row.confirmed_vnd)}</span>
            <span className="text-muted-foreground">
              {" / "}
              {money(row.target_vnd)}
            </span>
          </p>
          <Progress
            value={
              row.target_vnd > 0
                ? Math.min(100, (row.confirmed_vnd / row.target_vnd) * 100)
                : 0
            }
            className="h-1.5"
            aria-label={t("admin.transactions.rounds.raised")}
          />
        </div>
      ),
    },
    {
      key: "reserved",
      header: t("admin.transactions.rounds.reserved"),
      cellClassName: "whitespace-nowrap text-xs tabular-nums",
      render: (row) => money(row.reserved_vnd),
    },
    {
      key: "open",
      header: t("admin.transactions.rounds.open"),
      cellClassName: "whitespace-nowrap text-xs tabular-nums",
      render: (row) => money(row.capacity_vnd),
    },
    {
      key: "tickets",
      header: t("admin.transactions.rounds.tickets"),
      cellClassName: "text-xs tabular-nums",
      render: (row) => row.tranche_count,
    },
    {
      key: "needs_action",
      header: t("admin.transactions.rounds.needsAction"),
      render: (row) =>
        row.needs_action > 0 ? (
          <Badge
            variant="outline"
            className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
          >
            {row.needs_action}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: "closes",
      header: t("admin.transactions.rounds.closes"),
      cellClassName: "whitespace-nowrap text-xs text-muted-foreground",
      render: (row) => (
        <div className="space-y-0.5">
          <p className="text-foreground">
            {formatDate(row.window_end, locale)}
          </p>
          {(row.status === "OPEN" || row.status === "FULL") && (
            <p>
              {t("admin.transactions.rounds.daysLeft").replace(
                "{days}",
                String(row.days_left),
              )}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "advance",
      header: t("admin.transactions.rounds.action"),
      render: (row) =>
        ["OPEN", "FULL", "CLOSING"].includes(row.status) ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            title={t("admin.transactions.rounds.advanceHint")}
            disabled={advance.isPending}
            onClick={(event) => {
              // The row itself opens the round's transfers.
              event.stopPropagation();
              advance.mutate(row.id, {
                onSuccess: (round) =>
                  toast({
                    title: t("admin.transactions.rounds.advancedToast").replace(
                      "{status}",
                      enumLabel(t, "fundingWindowStatus", round.status),
                    ),
                  }),
                onError: (error) =>
                  toast({
                    variant: "destructive",
                    title: t("admin.transactions.rounds.advanceFailed"),
                    description: apiErrorMessage(
                      error,
                      locale,
                      t("common.tryAgain"),
                    ),
                  }),
              });
            }}
          >
            {advance.isPending && advance.variables === row.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FastForward className="h-3.5 w-3.5" />
            )}
            {t("admin.transactions.rounds.advance")}
          </Button>
        ) : null,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={data ?? []}
      getRowKey={(row) => row.id}
      isLoading={isLoading}
      isFetching={isFetching}
      emptyMessage={
        status === "OPEN"
          ? t("admin.transactions.rounds.empty")
          : t("admin.transactions.rounds.emptyAll")
      }
      onRowClick={onOpen}
      getRowLabel={(row) =>
        t("admin.transactions.rounds.rowLabel").replace(
          "{name}",
          row.project_name,
        )
      }
    />
  );
}
