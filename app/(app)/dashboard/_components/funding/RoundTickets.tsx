"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useReportMissingTransfer } from "@/hooks/use-funding";
import { useToast } from "@/hooks/use-toast";
import { apiErrorMessage } from "@/lib/api-error-message";
import { formatCurrency } from "@/lib/format-currency";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { SmeRound, SmeTicket } from "@/services/funding.service";

const K = "dashboard.sme.funding";

// Lapsed reservations were never investments: left out.
const SHOWN = (ticket: SmeTicket) => ticket.status !== "EXPIRED";

// Money received: the investment has repayment tickets, real or projected.
const HAS_TICKETS = (ticket: SmeTicket) =>
  ticket.status === "ACTIVE" || ticket.status === "CONFIRMED";

// An investor has uploaded their transfer receipt (or staff attested it): the
// business can report if the money has not reached its bank account.
const REPORTABLE = (ticket: SmeTicket) =>
  ticket.status === "ATTESTED" ||
  (ticket.status === "SIGNED" && Boolean(ticket.receipt_submitted_at));

/** The business's page for one investment: its tickets and today's payment. */
export const investmentHref = (ticketId: string) =>
  `/dashboard/repayments/${ticketId}`;

// Each investor's ticket, masked as everywhere the business looks. When an
// investor uploads their transfer receipt, the business is notified and can
// report here if the money has not arrived in its account. Once confirmed, an
// investment opens its own page of repayment tickets.
export function RoundTickets({ round }: { round: SmeRound }) {
  const { t } = useTranslations();
  const tickets = round.tickets.filter(SHOWN);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t(`${K}.ticketsHeading`)}
        </p>
        {tickets.some(HAS_TICKETS) && (
          <p className="text-xs text-muted-foreground">
            {t(`${K}.ticketsHint`)}
          </p>
        )}
      </div>
      {tickets.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t(`${K}.noTickets`)}</p>
      ) : (
        <ul className="divide-y rounded-lg border" data-testid="round-tickets">
          {tickets.map((ticket) => (
            <TicketRow key={ticket.id} ticket={ticket} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TicketRow({ ticket }: { ticket: SmeTicket }) {
  const { t, locale } = useTranslations();
  const { toast } = useToast();
  const report = useReportMissingTransfer();
  const [reporting, setReporting] = useState(false);
  const [statement, setStatement] = useState("");

  const received = HAS_TICKETS(ticket);
  const reportable = REPORTABLE(ticket);
  const reportedMissing =
    ticket.status === "UNDER_REVIEW" && ticket.review_cause === "SME_DISPUTE";
  const receiptSubmitted =
    ticket.status === "SIGNED" && Boolean(ticket.receipt_submitted_at);

  const statusKey = reportedMissing
    ? "REPORTED_MISSING"
    : receiptSubmitted
      ? "RECEIPT_SUBMITTED"
      : ticket.status;

  const sendReport = () =>
    report.mutate(
      { trancheId: ticket.id, statement: statement.trim() || null },
      {
        onSuccess: () => {
          toast({ title: t(`${K}.reportedToast`) });
          setReporting(false);
        },
        onError: (error) =>
          toast({
            variant: "destructive",
            title: t(`${K}.reportFailed`),
            description:
              error.code === "DISPUTE_WINDOW_CLOSED"
                ? t(`${K}.reportClosed`)
                : apiErrorMessage(error, locale, t("common.tryAgain")),
          }),
      },
    );

  const summary = (
    <>
      <span className="min-w-0 font-medium text-foreground">
        {ticket.investor_display}
        <span className="ml-2 font-mono text-xs text-muted-foreground">
          {ticket.reference_code}
        </span>
      </span>
      <span className="flex flex-wrap items-center gap-2">
        <span className="font-semibold tabular-nums text-foreground">
          {formatCurrency(ticket.amount_vnd, locale)}
        </span>
        <Badge
          variant="outline"
          className={cn(
            received &&
              "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
            reportedMissing &&
              "border-destructive/40 bg-destructive/10 text-destructive",
            receiptSubmitted &&
              "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
          )}
        >
          {t(`${K}.ticketStatus.${statusKey}`)}
        </Badge>
        {reportable && !reporting && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={() => setReporting(true)}
          >
            {t(`${K}.report`)}
          </Button>
        )}
        {received && (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </span>
    </>
  );

  return (
    <li className="space-y-2 text-sm">
      {received ? (
        <Link
          href={investmentHref(ticket.id)}
          className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
          title={t(`${K}.openTickets`)}
        >
          {summary}
        </Link>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
          {summary}
        </div>
      )}
      {reporting && (
        <div className="space-y-2 px-3 pb-3">
          <Textarea
            rows={2}
            value={statement}
            onChange={(event) => setStatement(event.target.value)}
            placeholder={t(`${K}.reportPlaceholder`)}
            aria-label={t(`${K}.reportPlaceholder`)}
            disabled={report.isPending}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={report.isPending}
              onClick={sendReport}
            >
              {t(`${K}.reportSend`)}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={report.isPending}
              onClick={() => setReporting(false)}
            >
              {t(`${K}.cancel`)}
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
