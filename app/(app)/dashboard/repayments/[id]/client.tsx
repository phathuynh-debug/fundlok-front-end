"use client";

import Link from "next/link";
import { ArrowLeft, Loader2, SearchX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useRequireAuth } from "@/hooks/use-authentication";
import { useMyRounds } from "@/hooks/use-funding";
import {
  useRepaymentProjection,
  useRepaymentSchedule,
} from "@/hooks/use-repayment";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate, todayIct } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import type { SmeTicket } from "@/services/funding.service";
import {
  investmentProgress,
  ticketsByDay,
} from "../../_components/funding/investment-days";
import { PayToday } from "./_components/PayToday";
import { TicketCards } from "./_components/TicketCards";

const K = "dashboard.sme.investment";

// One investor's investment, opened from the business's list of investors.
// Repaying, it shows how many days are paid and left, today's repayment (the
// investor's account, a QR, and the receipt to upload) and every ticket as a
// card. Received but not repaying yet, the tickets are projected, never a
// promise. Other investments, and other businesses' ones, are not found.
export default function RepaymentClient({ trancheId }: { trancheId: string }) {
  const { t, locale } = useTranslations();
  const { isLoading: isAuthLoading } = useRequireAuth();
  const rounds = useMyRounds(!isAuthLoading);
  const found = rounds.data
    ?.flatMap((round) => round.tickets.map((ticket) => ({ round, ticket })))
    .find(({ ticket }) => ticket.id === trancheId);
  const ticket = found?.ticket;
  const repaying = ticket?.status === "ACTIVE";
  const received = ticket?.status === "CONFIRMED";
  const schedule = useRepaymentSchedule(trancheId, repaying);
  const projection = useRepaymentProjection(trancheId, received);

  if (isAuthLoading || rounds.isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6 md:px-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t(`${K}.back`)}
      </Link>

      {!found || !ticket ? (
        <NotFound />
      ) : (
        <>
          <Header ticket={ticket} projectName={found.round.project_name} />
          {repaying || received ? (
            <Body
              trancheId={trancheId}
              repaying={repaying}
              isLoading={repaying ? schedule.isLoading : projection.isLoading}
              rows={repaying ? schedule.data : projection.data?.days}
              assumedClose={
                projection.data
                  ? formatDate(projection.data.assumed_close_date, locale)
                  : ""
              }
            />
          ) : (
            <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
              {t(`${K}.notReceived`)}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Header({
  ticket,
  projectName,
}: {
  ticket: SmeTicket;
  projectName: string | null;
}) {
  const { t, locale } = useTranslations();
  const settled = ticket.status === "ACTIVE" || ticket.status === "CONFIRMED";
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 rounded-xl border bg-card p-4 md:p-5">
      <div className="min-w-0 space-y-1">
        {projectName && (
          <p className="truncate text-xs text-muted-foreground">
            {projectName}
          </p>
        )}
        <h1 className="text-xl font-bold text-foreground">
          {ticket.investor_display}
        </h1>
        <p className="text-xs text-muted-foreground">
          {t("dashboard.sme.repayments.memo")}{" "}
          <span className="font-mono text-foreground">
            {ticket.reference_code}
          </span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold tabular-nums text-foreground">
          {formatCurrency(ticket.amount_vnd, locale)}
        </span>
        <Badge
          variant="outline"
          className={
            settled
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : undefined
          }
        >
          {t(`dashboard.sme.funding.ticketStatus.${ticket.status}`)}
        </Badge>
      </div>
    </header>
  );
}

function Body({
  trancheId,
  repaying,
  isLoading,
  rows,
  assumedClose,
}: {
  trancheId: string;
  repaying: boolean;
  isLoading: boolean;
  rows: Parameters<typeof ticketsByDay>[0] | undefined;
  assumedClose: string;
}) {
  const { t, locale } = useTranslations();
  const money = (vnd: number) => formatCurrency(vnd, locale);

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!rows || rows.length === 0) {
    return (
      <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        {t(`${K}.unavailable`)}
      </p>
    );
  }

  const today = todayIct();
  const days = ticketsByDay(rows, today);
  const progress = investmentProgress(days, today);
  const split = (gross: number, net: number) =>
    gross === net
      ? money(gross)
      : t("dashboard.sme.plan.amountSplit", {
          gross: money(gross),
          net: money(net),
        });
  const first = days[0];
  const last = days[days.length - 1];

  return (
    <>
      <section
        aria-label={t(`${K}.progressHeading`)}
        className="space-y-4 rounded-xl border bg-card p-4 md:p-5"
        data-testid="investment-progress"
      >
        {repaying ? (
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-lg font-semibold tabular-nums text-foreground">
                {t(`${K}.daysPaid`, {
                  paid: progress.paidDays,
                  count: progress.count,
                })}
              </span>
              <span className="text-sm text-muted-foreground">
                {t(`${K}.daysLeft`, { count: progress.leftDays })}
              </span>
            </div>
            <Progress
              value={(progress.paidDays / progress.count) * 100}
              className="h-2"
              aria-label={t(`${K}.daysPaid`, {
                paid: progress.paidDays,
                count: progress.count,
              })}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Badge
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
            >
              {t("dashboard.sme.plan.badge")}
            </Badge>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t(`${K}.projectedNote`, { date: assumedClose })}
            </p>
          </div>
        )}

        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Figure label={t("dashboard.sme.plan.periods")}>
            {t("dashboard.sme.plan.periodsValue", {
              count: progress.count,
              start: formatDate(first.due_date, locale),
              end: formatDate(last.due_date, locale),
            })}
          </Figure>
          {repaying && (
            <Figure label={t(`${K}.transferred`)}>
              {t(`${K}.transferredValue`, {
                paid: money(progress.paidNet),
                total: money(progress.totalNet),
              })}
            </Figure>
          )}
          <Figure label={t(repaying ? `${K}.left` : `${K}.total`)}>
            {split(progress.leftGross, progress.leftNet)}
          </Figure>
          {progress.next && (
            <Figure label={t("dashboard.sme.plan.next")}>
              {t("dashboard.sme.plan.firstValue", {
                amount: split(progress.next.gross_vnd, progress.next.net_vnd),
                date: formatDate(progress.next.due_date, locale),
              })}
            </Figure>
          )}
        </dl>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("dashboard.sme.plan.note")}
        </p>
      </section>

      {repaying && <PayToday trancheId={trancheId} />}

      <TicketCards days={days} today={today} projected={!repaying} />
    </>
  );
}

function NotFound() {
  const { t } = useTranslations();
  return (
    <div
      className="flex flex-col items-center gap-2 rounded-xl border bg-card px-4 py-10 text-center"
      data-testid="investment-not-found"
    >
      <SearchX className="h-6 w-6 text-muted-foreground" />
      <p className="font-semibold text-foreground">{t(`${K}.notFound`)}</p>
      <p className="max-w-md text-sm text-muted-foreground">
        {t(`${K}.notFoundHint`)}
      </p>
    </div>
  );
}

function Figure({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums text-foreground">{children}</dd>
    </div>
  );
}
