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
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ActiveTableFiltersBar,
  InteractiveTableHead,
  compareSortableValues,
  isColumnFilterActive,
  type ColumnFilterOption,
  type ColumnFiltersState,
  type SortState,
} from "@/components/ui/interactive-table-head";
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
import { LateBadge } from "./OverdueRepayments";
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
  /** The ticket's days not marked paid after their due date (same on every
   *  receipt of the ticket). */
  overdue_days: number;
  overdue_net_vnd: number;
  oldest_overdue_date: string | null;
  working_days_late: number;
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
        overdue_days: row.tranche_overdue_days ?? 0,
        overdue_net_vnd: row.tranche_overdue_net_vnd ?? 0,
        oldest_overdue_date: row.tranche_oldest_overdue_date ?? null,
        working_days_late: row.tranche_working_days_late ?? 0,
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
// receipts. Clicking a receipt opens the read-only review sheet. A ticket the
// business is late on (a day not marked paid after its due date) gets a red
// rail and a red "Late" badge with how many days are unpaid.
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

  const [sortState, setSortState] = useState<SortState | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>({});

  const groupStatusLabel = React.useCallback(
    (group: InvestmentRepaymentGroup) => {
      const r = group.summary_receipt;
      if (r.needs_action) return t(`${K}.needsAction`);
      if (r.open_report) return t(`${K}.reported`);
      return t(`${K}.status.${r.check_status}`);
    },
    [t],
  );

  const statusOptions = useMemo<ColumnFilterOption[]>(() => {
    const counts = new Map<string, number>();
    for (const group of groups) {
      const label = groupStatusLabel(group);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([value, count]) => ({
      value,
      label: value,
      count,
    }));
  }, [groups, groupStatusLabel]);

  const columnsMeta = useMemo(
    () => [
      { key: "investment", header: t(`${K}.table.investment`) },
      { key: "flow", header: t(`${K}.table.flow`) },
      { key: "progress", header: t(`${K}.table.progress`) },
      { key: "amount", header: t(`${K}.table.amount`) },
      { key: "status", header: t("admin.transactions.table.status") },
    ],
    [t],
  );

  const hasActiveFilters = useMemo(
    () => Object.values(columnFilters).some((val) => isColumnFilterActive(val)),
    [columnFilters],
  );

  const displayedGroups = useMemo(() => {
    let result = groups;

    if (hasActiveFilters) {
      result = result.filter((group) => {
        const invFilter = columnFilters.investment;
        if (
          typeof invFilter === "string" &&
          invFilter.trim() &&
          !`${group.project_name} ${group.reference_code}`
            .toLowerCase()
            .includes(invFilter.trim().toLowerCase())
        ) {
          return false;
        }

        const flowFilter = columnFilters.flow;
        if (
          typeof flowFilter === "string" &&
          flowFilter.trim() &&
          !`${personName(group.business)} ${group.business.email ?? ""} ${personName(group.investor)} ${group.investor.email ?? ""}`
            .toLowerCase()
            .includes(flowFilter.trim().toLowerCase())
        ) {
          return false;
        }

        const statusFilter = columnFilters.status;
        if (
          Array.isArray(statusFilter) &&
          statusFilter.length > 0 &&
          !statusFilter.includes(groupStatusLabel(group))
        ) {
          return false;
        }

        return true;
      });
    }

    if (sortState) {
      result = [...result].sort((a, b) => {
        switch (sortState.key) {
          case "investment":
            return compareSortableValues(
              a.project_name,
              b.project_name,
              sortState.direction,
              locale,
            );
          case "flow":
            return compareSortableValues(
              personName(a.business),
              personName(b.business),
              sortState.direction,
              locale,
            );
          case "progress": {
            const pctA =
              a.tranche_total_days > 0
                ? a.tranche_paid_days / a.tranche_total_days
                : 0;
            const pctB =
              b.tranche_total_days > 0
                ? b.tranche_paid_days / b.tranche_total_days
                : 0;
            return compareSortableValues(
              pctA,
              pctB,
              sortState.direction,
              locale,
            );
          }
          case "amount":
            return compareSortableValues(
              a.total_net_vnd,
              b.total_net_vnd,
              sortState.direction,
              locale,
            );
          case "status":
            return compareSortableValues(
              groupStatusLabel(a),
              groupStatusLabel(b),
              sortState.direction,
              locale,
            );
          default:
            return 0;
        }
      });
    }

    return result;
  }, [
    groups,
    columnFilters,
    hasActiveFilters,
    sortState,
    locale,
    groupStatusLabel,
  ]);

  const setColumnFilter = (
    key: string,
    next: string | string[] | undefined,
  ) => {
    setColumnFilters((prev) => {
      const copy = { ...prev };
      if (!isColumnFilterActive(next)) {
        delete copy[key];
      } else if (next !== undefined) {
        copy[key] = next;
      }
      return copy;
    });
  };

  const resetAll = () => {
    setSortState(null);
    setColumnFilters({});
  };

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

        <ActiveTableFiltersBar
          columns={columnsMeta}
          sortState={sortState}
          columnFilters={columnFilters}
          onClearSort={() => setSortState(null)}
          onClearFilter={(key) => setColumnFilter(key, undefined)}
          onResetAll={resetAll}
        />

        <Table>
          <TableHeader>
            <TableRow>
              <InteractiveTableHead
                columnKey="investment"
                header={t(`${K}.table.investment`)}
                sortState={sortState}
                onSortChange={setSortState}
                filterType="text"
                filterValue={columnFilters.investment}
                onFilterChange={(next) => setColumnFilter("investment", next)}
              />
              <InteractiveTableHead
                columnKey="flow"
                header={t(`${K}.table.flow`)}
                sortState={sortState}
                onSortChange={setSortState}
                filterType="text"
                filterValue={columnFilters.flow}
                onFilterChange={(next) => setColumnFilter("flow", next)}
              />
              <InteractiveTableHead
                columnKey="progress"
                header={t(`${K}.table.progress`)}
                sortState={sortState}
                onSortChange={setSortState}
                filterable={false}
              />
              <InteractiveTableHead
                columnKey="amount"
                header={t(`${K}.table.amount`)}
                sortState={sortState}
                onSortChange={setSortState}
                filterable={false}
              />
              <InteractiveTableHead
                columnKey="status"
                header={t("admin.transactions.table.status")}
                sortState={sortState}
                onSortChange={setSortState}
                filterType="select"
                filterValue={columnFilters.status}
                filterOptions={statusOptions}
                onFilterChange={(next) => setColumnFilter("status", next)}
              />
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : displayedGroups.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-sm text-muted-foreground"
                >
                  {groups.length > 0 && hasActiveFilters ? (
                    <div className="flex flex-col items-center gap-2">
                      <span>{t("tableControls.noMatchingRows")}</span>
                      <button
                        type="button"
                        onClick={resetAll}
                        className="text-xs font-medium text-primary hover:underline cursor-pointer"
                      >
                        {t("tableControls.clearAll")}
                      </button>
                    </div>
                  ) : (
                    emptyMessage
                  )}
                </TableCell>
              </TableRow>
            ) : (
              displayedGroups.map((group) => {
                const expanded = !collapsedIds.has(group.tranche_id);
                const late = group.overdue_days > 0;
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
                      data-late={late || undefined}
                      className={cn(
                        "cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                        late
                          ? "bg-destructive/5 hover:bg-destructive/10"
                          : "bg-muted/20 hover:bg-muted/40",
                      )}
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
                      <TableCell
                        className={cn(
                          "max-w-64 text-xs",
                          late && "shadow-[inset_3px_0_0_0_var(--destructive)]",
                        )}
                      >
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
                        <div className="flex flex-wrap items-center gap-1.5">
                          {late && (
                            <LateBadge
                              days={group.overdue_days}
                              workingDaysLate={group.working_days_late}
                              oldestDueDate={group.oldest_overdue_date}
                              owedVnd={group.overdue_net_vnd}
                            />
                          )}
                          <RepaymentStatusBadge
                            receipt={group.summary_receipt}
                          />
                        </div>
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
