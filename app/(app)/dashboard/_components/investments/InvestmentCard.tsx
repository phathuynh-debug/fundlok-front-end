"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useRepaymentProjection,
  useRepaymentSchedule,
} from "@/hooks/use-repayment";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Tranche } from "@/services/funding.service";
import type { RepaymentRow } from "@/services/repayment.service";
import { InvestmentSchedule } from "./InvestmentSchedule";
import { ProjectedRepayments } from "./ProjectedRepayments";

const K = "dashboard.investor.investments";

/** What the business has paid so far (by its own word, until confirmed), what
 *  the whole schedule pays, and the next day still due. */
export function repaymentSummary(rows: RepaymentRow[]) {
  const total = rows.reduce((sum, row) => sum + row.net_vnd, 0);
  const paid = rows
    .filter((row) => row.status === "PRESUMED_PAID" || row.status === "MATCHED")
    .reduce((sum, row) => sum + row.net_vnd, 0);
  const next = rows.find((row) => row.status === "DUE" && row.net_vnd > 0);
  return { total, paid, next };
}

// One investment. While the transfer is awaited it links back to it; once the
// money is received it shows the projected repayment (until the round closes);
// once repaying, what has been paid, the next payment and the real schedule.
export function InvestmentCard({ tranche }: { tranche: Tranche }) {
  const { t, locale } = useTranslations();
  const repaying = tranche.status === "ACTIVE";
  const schedule = useRepaymentSchedule(tranche.id, repaying);
  const received = tranche.status === "CONFIRMED";
  const projection = useRepaymentProjection(tranche.id, received);
  const [open, setOpen] = useState(false);
  const money = (vnd: number) => formatCurrency(vnd, locale);
  const awaitingTransfer =
    tranche.status === "RESERVED" || tranche.status === "SIGNED";
  const summary = schedule.data ? repaymentSummary(schedule.data) : null;

  return (
    <article
      className="space-y-3 rounded-xl border bg-card p-4"
      data-testid="investment-card"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <p className="truncate font-semibold text-foreground">
            {tranche.project_name ?? "—"}
          </p>
          <p className="text-xs text-muted-foreground">
            {t(`${K}.memo`)}{" "}
            <span className="font-mono">{tranche.reference_code}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tabular-nums text-foreground">
            {money(tranche.amount_vnd)}
          </span>
          <Badge
            variant="outline"
            className={cn(
              (tranche.status === "CONFIRMED" || repaying) &&
                "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
              tranche.status === "VOID" &&
                "border-destructive/40 bg-destructive/10 text-destructive",
            )}
          >
            {t(`${K}.status.${tranche.status}`)}
          </Badge>
        </div>
      </div>

      {awaitingTransfer && tranche.project_id && (
        <Button asChild size="sm" variant="outline" className="gap-1.5">
          <Link href={`/dashboard/invest?projectId=${tranche.project_id}`}>
            {t(`${K}.continue`)}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      )}
      {received &&
        (projection.data ? (
          <ProjectedRepayments projection={projection.data} />
        ) : (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t(`${K}.waitingClose`)}
          </p>
        ))}

      {repaying && summary && (
        <div className="space-y-2">
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p className="text-foreground">
              {t(`${K}.received`, {
                paid: money(summary.paid),
                total: money(summary.total),
              })}
            </p>
            {summary.next && (
              <p className="text-foreground sm:text-right">
                {t(`${K}.next`, {
                  amount: money(summary.next.net_vnd),
                  date: formatDate(summary.next.due_date, locale),
                })}
              </p>
            )}
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="-ml-2 gap-1.5"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {open ? t(`${K}.hideSchedule`) : t(`${K}.schedule`)}
          </Button>
          {open && schedule.data && (
            <InvestmentSchedule trancheId={tranche.id} rows={schedule.data} />
          )}
        </div>
      )}
    </article>
  );
}
