"use client";

import Link from "next/link";
import { CalendarCheck, Loader2, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTodaysPayments } from "@/hooks/use-repayment";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { RepaymentRow } from "@/services/repayment.service";
import { investmentHref } from "./RoundTickets";

const K = "dashboard.sme.repayments";

interface InvestorDue {
  trancheId: string;
  investor: string;
  reference: string;
  /** Still to pay: due today or earlier and not marked paid. */
  due: RepaymentRow[];
  /** Every unsettled row, marked paid or not. */
  rows: RepaymentRow[];
}

const sum = (rows: RepaymentRow[], field: "gross_vnd" | "net_vnd") =>
  rows.reduce((total, row) => total + row[field], 0);

/** Today's rows, one entry per investment, in the order they came. */
export function byInvestment(rows: RepaymentRow[]): InvestorDue[] {
  const out = new Map<string, InvestorDue>();
  for (const row of rows) {
    const entry = out.get(row.tranche_id) ?? {
      trancheId: row.tranche_id,
      investor: row.investor_display,
      reference: row.reference_code,
      due: [],
      rows: [],
    };
    entry.rows.push(row);
    if (row.status === "DUE") entry.due.push(row);
    out.set(row.tranche_id, entry);
  }
  return [...out.values()];
}

// What the business owes its investors today, and any earlier day not yet
// marked paid: one line per investor. Each is paid from that investment's
// page, which shows the investor's own account, a VietQR for the exact amount
// and where to upload the bank's receipt; uploading it marks the days paid.
export function TodaysRepayments() {
  const { t, locale } = useTranslations();
  const today = useTodaysPayments();
  const money = (vnd: number) => formatCurrency(vnd, locale);

  if (today.isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  const investors = byInvestment(today.data?.rows ?? []);
  const due = investors.flatMap((investor) => investor.due);
  const dueGross = sum(due, "gross_vnd");
  const dueNet = sum(due, "net_vnd");

  return (
    <section
      aria-labelledby="todays-repayments"
      className="space-y-4 rounded-xl border border-border/60 bg-card p-4 md:p-5"
      data-testid="todays-repayments"
    >
      <div className="space-y-1">
        <h3
          id="todays-repayments"
          className="flex items-center gap-2 text-sm font-semibold text-foreground"
        >
          <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          {t(`${K}.heading`)}
        </h3>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t(`${K}.hint`)}
        </p>
      </div>

      {investors.length === 0 ? (
        <p className="rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          {t(`${K}.none`)}
        </p>
      ) : (
        <>
          <ul className="divide-y rounded-lg border">
            {investors.map((investor) => (
              <InvestorLine key={investor.trancheId} investor={investor} />
            ))}
          </ul>

          {due.length > 0 && (
            <div className="space-y-0.5 text-xs text-muted-foreground">
              <p className="text-sm text-foreground">
                {t(`${K}.total`, { net: money(dueNet) })}
              </p>
              {dueGross !== dueNet && (
                <>
                  <p>{t(`${K}.grossTotal`, { gross: money(dueGross) })}</p>
                  <p>{t(`${K}.withheld`, { tax: money(dueGross - dueNet) })}</p>
                </>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function InvestorLine({ investor }: { investor: InvestorDue }) {
  const { t, locale } = useTranslations();
  const owing = investor.due.length > 0;
  const shown = owing ? investor.due : investor.rows;
  const dates = [...new Set(shown.map((row) => row.due_date))];
  const missing = investor.rows.some((row) => row.status === "REPORTED_MISSED");
  const net = sum(shown, "net_vnd");
  const gross = sum(shown, "gross_vnd");

  return (
    <li
      className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 text-sm"
      data-testid="repayment-ticket"
    >
      <div className="min-w-0 space-y-0.5">
        <p className="font-medium text-foreground">
          {investor.investor}
          <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">
            {investor.reference}
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          {t(`${K}.days`, {
            count: dates.length,
            dates: dates.map((date) => formatDate(date, locale)).join(", "),
          })}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-right">
          {/* What to transfer; tax included beneath. */}
          <span className="block font-semibold tabular-nums text-foreground">
            {formatCurrency(net, locale)}
          </span>
          {gross !== net && (
            <span className="block text-[11px] tabular-nums text-muted-foreground">
              {t(`${K}.inclTax`, { gross: formatCurrency(gross, locale) })}
            </span>
          )}
        </span>
        {owing ? (
          <Button asChild size="sm" className="gap-1.5">
            <Link href={investmentHref(investor.trancheId)}>
              <Wallet className="h-4 w-4" />
              {t(`${K}.pay`)}
            </Link>
          </Button>
        ) : (
          <Badge
            variant="outline"
            className={cn(
              missing
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
            )}
          >
            {t(`${K}.status.${missing ? "REPORTED_MISSED" : "PRESUMED_PAID"}`)}
          </Badge>
        )}
      </div>
    </li>
  );
}
