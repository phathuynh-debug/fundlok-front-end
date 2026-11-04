"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { ArrowRight, ChevronDown, ChevronRight, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminRepaymentReceipts } from "@/hooks/use-admin-funding";
import { useTranslations } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate, formatDateTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import type {
  AdminRepaymentFilter,
  AdminRepaymentReceipt,
} from "@/services/admin-funding.service";
import { TablePager } from "../../_components/TablePager";
import { personName } from "./activity";
import { RepaymentReviewSheet } from "./RepaymentReviewSheet";
import { RepaymentStatusBadge } from "./RepaymentStatusBadge";

export const REPAYMENT_PAGE_SIZE = 20;

const K = "admin.transactions.repayments";

interface InvestmentRepaymentGroup {
  tranche_id: string;
  project_name: string;
  reference_code: string;
  tranche_amount_vnd: number;
  tranche_paid_days: number;
  tranche_total_days: number;
  business: AdminRepaymentReceipt["business"];
  investor: AdminRepaymentReceipt["investor"];
  receipts: AdminRepaymentReceipt[];
  total_net_vnd: number;
  total_gross_vnd: number;
  total_tax_vnd: number;
  summary_receipt: AdminRepaymentReceipt;
}

export function groupReceiptsByInvestment(
  rows: AdminRepaymentReceipt[],
): InvestmentRepaymentGroup[] {
  const byTranche = new Map<string, InvestmentRepaymentGroup>();

  for (const row of rows) {
    const existing = byTranche.get(row.tranche_id);
    if (!existing) {
      byTranche.set(row.tranche_id, {
        tranche_id: row.tranche_id,
        project_name: row.project_name,
        reference_code: row.reference_code,
        tranche_amount_vnd: row.tranche_amount_vnd ?? 0,
        tranche_paid_days: row.tranche_paid_days ?? 0,
        tranche_total_days: row.tranche_total_days ?? 0,
        business: row.business,
        investor: row.investor,
        receipts: [row],
        total_net_vnd: row.net_vnd,
        total_gross_vnd: row.gross_vnd,
        total_tax_vnd: row.tax_withheld_vnd,
        summary_receipt: row,
      });
    } else {
      existing.receipts.push(row);
      existing.total_net_vnd += row.net_vnd;
      existing.total_gross_vnd += row.gross_vnd;
      existing.total_tax_vnd += row.tax_withheld_vnd;
      if (row.needs_action && !existing.summary_receipt.needs_action) {
        existing.summary_receipt = row;
      } else if (row.open_report && !existing.summary_receipt.open_report) {
        existing.summary_receipt = {
          ...existing.summary_receipt,
          open_report: true,
        };
      }
    }
  }

  return Array.from(byTranche.values());
}

// Repayment receipts grouped by investment ticket: each investment row shows
// Project, Ticket memo & invested principal, Business -> Investor, and
// paid/total days progress, and expands to list its individual repayment
// receipts. Clicking a receipt opens the read-only review sheet.
export function RepaymentQueue({ status }: { status: AdminRepaymentFilter }) {
  const { t, locale } = useTranslations();
  const [page, setPage] = useState(1);
  // Only the id is held: the panel reads its own copy of the receipt.
  const [openId, setOpenId] = useState<string | null>(null);
  // Investments start expanded so staff can see every receipt at a glance and
  // collapse any ticket they have already inspected.
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(
    () => new Set(),
  );

  const { data, isLoading, isFetching } = useAdminRepaymentReceipts({
    status,
    page,
    page_size: REPAYMENT_PAGE_SIZE,
  });

  const groups = useMemo(
    () => groupReceiptsByInvestment(data?.items ?? []),
    [data?.items],
  );

  const money = (vnd: number) => formatCurrency(vnd, locale);

  const toggleGroup = (trancheId: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(trancheId)) {
        next.delete(trancheId);
      } else {
        next.add(trancheId);
      }
      return next;
    });
  };

  const formatReceiptDays = (row: AdminRepaymentReceipt) => {
    const dates = [...new Set(row.days.map((day) => day.due_date))];
    return dates.length === 1
      ? formatDate(dates[0], locale)
      : t(`${K}.table.daysValue`, {
          count: dates.length,
          first: formatDate(dates[0], locale),
        });
  };

  const emptyMessage =
    status === "NEEDS_ACTION" ? t(`${K}.emptyQueue`) : t(`${K}.empty`);

  return (
    <>
      <div className="relative overflow-x-auto">
        {isFetching && !isLoading && (
          <div className="absolute right-3 top-3 z-10">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t(`${K}.table.investment`)}</TableHead>
              <TableHead>{t(`${K}.table.flow`)}</TableHead>
              <TableHead>{t(`${K}.table.progress`)}</TableHead>
              <TableHead>{t(`${K}.table.amount`)}</TableHead>
              <TableHead>{t("admin.transactions.table.status")}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : groups.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group) => {
                const expanded = !collapsedIds.has(group.tranche_id);
                const progressPct =
                  group.tranche_total_days > 0
                    ? Math.min(
                        100,
                        (group.tranche_paid_days / group.tranche_total_days) *
                          100,
                      )
                    : 0;

                return (
                  <React.Fragment key={group.tranche_id}>
                    <TableRow
                      data-testid={`investment-group-${group.tranche_id}`}
                      className="cursor-pointer bg-muted/20 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                      role="button"
                      tabIndex={0}
                      aria-expanded={expanded}
                      aria-label={t(`${K}.table.toggleInvestment`, {
                        memo: group.reference_code,
                      })}
                      onClick={() => toggleGroup(group.tranche_id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleGroup(group.tranche_id);
                        }
                      }}
                    >
                      <TableCell className="max-w-64 text-xs">
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 shrink-0 text-muted-foreground">
                            {expanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </span>
                          <div className="min-w-0 space-y-1">
                            <p className="truncate font-semibold text-foreground">
                              {group.project_name}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                              <span className="rounded border bg-background px-1.5 py-0.5 font-mono text-foreground">
                                {group.reference_code}
                              </span>
                              {group.tranche_amount_vnd > 0 && (
                                <span className="font-medium tabular-nums text-foreground">
                                  {t(`${K}.table.invested`, {
                                    amount: money(group.tranche_amount_vnd),
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">
                              {personName(group.business)}
                            </p>
                            {group.business.email && (
                              <p className="truncate text-[11px] text-muted-foreground">
                                {group.business.email}
                              </p>
                            )}
                          </div>
                          <ArrowRight
                            className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                            aria-hidden
                          />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">
                              {personName(group.investor)}
                            </p>
                            {group.investor.email && (
                              <p className="truncate text-[11px] text-muted-foreground">
                                {group.investor.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="min-w-44 text-xs">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            {group.tranche_total_days > 0 ? (
                              <span className="font-medium tabular-nums text-foreground">
                                {t(`${K}.table.progressDays`, {
                                  paid: group.tranche_paid_days,
                                  total: group.tranche_total_days,
                                })}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                {t(`${K}.table.receiptsCount`, {
                                  count: group.receipts.length,
                                })}
                              </span>
                            )}
                            {group.tranche_total_days > 0 && (
                              <Badge
                                variant="secondary"
                                className="px-1.5 py-0 text-[10px] tabular-nums"
                              >
                                {t(`${K}.table.receiptsCount`, {
                                  count: group.receipts.length,
                                })}
                              </Badge>
                            )}
                          </div>
                          {group.tranche_total_days > 0 && (
                            <Progress
                              value={progressPct}
                              className="h-1.5"
                              aria-label={t(`${K}.table.progress`)}
                            />
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-xs">
                        <div className="space-y-0.5">
                          <p className="font-semibold tabular-nums text-foreground">
                            {money(group.total_net_vnd)}
                          </p>
                          {group.total_tax_vnd > 0 && (
                            <p className="text-[11px] tabular-nums text-muted-foreground">
                              {t(`${K}.table.grossTaxHint`, {
                                gross: money(group.total_gross_vnd),
                                tax: money(group.total_tax_vnd),
                              })}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <RepaymentStatusBadge receipt={group.summary_receipt} />
                      </TableCell>
                    </TableRow>

                    {expanded &&
                      group.receipts.map((receipt) => {
                        const kinds = [
                          ...new Set(
                            receipt.days.map((day) =>
                              t(`${K}.kind.${day.kind}`),
                            ),
                          ),
                        ].join(" + ");

                        return (
                          <TableRow
                            key={receipt.id}
                            data-testid={`repayment-row-${receipt.id}`}
                            className={cn(
                              "cursor-pointer bg-background transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                            )}
                            role="button"
                            tabIndex={0}
                            aria-label={t(`${K}.rowLabel`, {
                              business: personName(receipt.business) ?? "",
                              investor: personName(receipt.investor) ?? "",
                            })}
                            onClick={() => setOpenId(receipt.id)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setOpenId(receipt.id);
                              }
                            }}
                          >
                            <TableCell className="pl-9 text-xs">
                              <div className="space-y-0.5">
                                <p className="font-medium text-foreground">
                                  {formatReceiptDays(receipt)}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {kinds}
                                </p>
                              </div>
                            </TableCell>

                            <TableCell className="text-xs text-muted-foreground">
                              {receipt.payer || receipt.payee ? (
                                <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                                  <span>
                                    {receipt.payer
                                      ? `${receipt.payer.bank_name} · ${receipt.payer.account_number}`
                                      : "—"}
                                  </span>
                                  <ArrowRight
                                    className="h-3 w-3 shrink-0"
                                    aria-hidden
                                  />
                                  <span>
                                    {receipt.payee
                                      ? `${receipt.payee.bank_name} · ${receipt.payee.account_number}`
                                      : "—"}
                                  </span>
                                </div>
                              ) : (
                                <span className="font-mono text-[11px]">
                                  {receipt.reference_code}
                                </span>
                              )}
                            </TableCell>

                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                              {t(`${K}.table.submitted`)}{" "}
                              {formatDateTime(receipt.submitted_at, locale)}
                            </TableCell>

                            <TableCell className="whitespace-nowrap text-xs">
                              <div className="space-y-0.5">
                                <p className="font-semibold tabular-nums text-foreground">
                                  {money(receipt.net_vnd)}
                                </p>
                                {receipt.tax_withheld_vnd > 0 && (
                                  <p className="text-[11px] tabular-nums text-muted-foreground">
                                    {t(`${K}.table.grossTaxHint`, {
                                      gross: money(receipt.gross_vnd),
                                      tax: money(receipt.tax_withheld_vnd),
                                    })}
                                  </p>
                                )}
                              </div>
                            </TableCell>

                            <TableCell>
                              <RepaymentStatusBadge receipt={receipt} />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

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
