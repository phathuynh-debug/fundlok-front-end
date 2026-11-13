"use client";

import { AlertTriangle, ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminOverdueRepayments } from "@/hooks/use-admin-funding";
import { useTranslations } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import { personName } from "./activity";

const K = "admin.transactions.repayments";
const O = `${K}.overdue`;

/** Late is a status, so it wears the destructive (red) theme token. Dark
 *  mode's --destructive is a deep red meant for fills (about 2:1 against the
 *  dark background as text), so text and outlines lift to red-400 there, the
 *  way the amber "awaiting" badge lifts to amber-300. */
export const LATE_TEXT = "text-destructive dark:text-red-400";
export const LATE_BADGE =
  "border-destructive/50 bg-destructive/10 text-destructive dark:border-red-400/50 dark:text-red-400";

type T = (key: string, values?: Record<string, string | number>) => string;

/** `t()` has no plurals: English keys come as `.one` / `.other`. */
export function plural(t: T, key: string, count: number) {
  return t(`${key}.${count === 1 ? "one" : "other"}`, { count });
}

/** A red "Late" badge with how many days are unpaid; its tooltip says since
 *  when, how many working days late and how much is owed. */
export function LateBadge({
  days,
  workingDaysLate,
  oldestDueDate,
  owedVnd,
}: {
  days: number;
  workingDaysLate: number;
  oldestDueDate: string | null | undefined;
  owedVnd: number;
}) {
  const { t, locale } = useTranslations();
  const detail = t(`${O}.badgeDetail`, {
    days: plural(t, `${O}.daysUnpaid`, days),
    date: oldestDueDate ? formatDate(oldestDueDate, locale) : "",
    working: plural(t, `${O}.workingDaysLate`, workingDaysLate),
    amount: formatCurrency(owedVnd, locale),
  });
  return (
    <Badge
      variant="outline"
      className={cn("gap-1", LATE_BADGE)}
      title={detail}
      aria-label={detail}
      data-testid="late-badge"
    >
      <AlertTriangle aria-hidden />
      {plural(t, `${O}.badge`, days)}
    </Badge>
  );
}

/** The red count on the Repayments tab: how many tickets are late. */
export function LateCount({ count }: { count: number }) {
  const { t } = useTranslations();
  if (count <= 0) return null;
  return (
    <span
      className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold tabular-nums leading-none text-white"
      aria-label={plural(t, `${O}.tabCount`, count)}
      data-testid="late-count"
    >
      {count}
    </span>
  );
}

// Every investor ticket a business has not repaid on time: days it has not
// marked paid (no receipt uploaded) after their due date. The receipts table
// below cannot show a ticket that has no receipt at all, so it is listed here,
// in red, above it. Nothing renders when every repayment is on time.
export function OverdueRepayments() {
  const { t, locale } = useTranslations();
  const { data } = useAdminOverdueRepayments();

  if (!data || data.items.length === 0) return null;

  const money = (vnd: number) => formatCurrency(vnd, locale);

  return (
    <section
      role="alert"
      aria-labelledby="overdue-repayments-title"
      data-testid="overdue-repayments"
      className="overflow-hidden rounded-lg border border-destructive/40 bg-destructive/5 dark:border-red-400/40"
    >
      <div className="flex items-start gap-3 border-b border-destructive/20 p-4">
        <AlertTriangle
          className={cn("mt-0.5 h-5 w-5 shrink-0", LATE_TEXT)}
          aria-hidden
        />
        <div className="min-w-0 space-y-1">
          <h2
            id="overdue-repayments-title"
            className={cn("text-sm font-semibold", LATE_TEXT)}
          >
            {plural(t, `${O}.title`, data.tickets)}
          </h2>
          <p className={cn("text-sm font-medium tabular-nums", LATE_TEXT)}>
            {t(`${O}.summary`, {
              businesses: plural(t, `${O}.businesses`, data.businesses),
              days: plural(t, `${O}.daysUnpaid`, data.overdue_days),
              amount: money(data.overdue_net_vnd),
            })}
          </p>
          <p className="text-xs text-muted-foreground">{t(`${O}.hint`)}</p>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs">
              {t(`${K}.table.investment`)}
            </TableHead>
            <TableHead className="text-xs">{t(`${K}.table.flow`)}</TableHead>
            <TableHead className="text-xs">{t(`${O}.table.late`)}</TableHead>
            <TableHead className="text-right text-xs">
              {t(`${O}.table.owed`)}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.items.map((item) => (
            <TableRow
              key={item.tranche_id}
              data-testid={`overdue-row-${item.tranche_id}`}
              className="hover:bg-destructive/5"
            >
              <TableCell className="max-w-64 text-xs">
                <p className="truncate font-semibold text-foreground">
                  {item.project_name}
                </p>
                <span className="mt-1 inline-block rounded border bg-background px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                  {item.reference_code}
                </span>
              </TableCell>

              <TableCell className="text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {personName(item.business)}
                    </p>
                    {item.business.email && (
                      <p className="truncate text-[11px] text-muted-foreground">
                        {item.business.email}
                      </p>
                    )}
                  </div>
                  <ArrowRight
                    className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {personName(item.investor)}
                    </p>
                    {item.investor.email && (
                      <p className="truncate text-[11px] text-muted-foreground">
                        {item.investor.email}
                      </p>
                    )}
                  </div>
                </div>
              </TableCell>

              <TableCell className="text-xs">
                <div className="space-y-1">
                  <Badge
                    variant="outline"
                    className={cn("tabular-nums", LATE_BADGE)}
                  >
                    {plural(t, `${O}.workingDaysLate`, item.working_days_late)}
                  </Badge>
                  <p className={cn("tabular-nums", LATE_TEXT)}>
                    {plural(t, `${O}.daysUnpaid`, item.overdue_days)}
                    {" · "}
                    {t(`${O}.since`, {
                      date: formatDate(item.oldest_due_date, locale),
                    })}
                  </p>
                </div>
              </TableCell>

              <TableCell
                className={cn(
                  "whitespace-nowrap text-right text-xs font-semibold tabular-nums",
                  LATE_TEXT,
                )}
              >
                {money(item.overdue_net_vnd)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
