"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TruncatedFigure } from "@/components/truncated-figure";
import { useRequireAuth } from "@/hooks/use-authentication";
import { useHasBankAccount } from "@/hooks/use-payment-accounts";
import { usePublicProjects } from "@/hooks/use-projects";
import {
  useFundingWindow,
  useMyTranches,
  useReserveTicket,
} from "@/hooks/use-funding";
import { useToast } from "@/hooks/use-toast";
import { BankAccountPrompt } from "../_components/BankAccountPrompt";
import { InvestTerms } from "./_components/InvestTerms";
import { TransferDetails } from "./_components/TransferDetails";
import { useTranslations } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-date";
import { ticketBounds } from "@/lib/listing-figures";
import { CONTROL_IDLE } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";
import {
  INVESTOR_TERMS_VERSION,
  LIVE_TRANCHE_STATUSES,
} from "@/services/funding.service";

const K = "investConfirm";

// Reservation failures the investor can act on, by X-Error-Code.
const KNOWN_ERRORS = new Set([
  "BELOW_MIN_TICKET",
  "CAPACITY_EXCEEDED",
  "WINDOW_NOT_OPEN",
  "ALREADY_HAS_LIVE_TRANCHE",
  "TERMS_OUTDATED",
  "BANK_ACCOUNT_REQUIRED",
  "ACCOUNT_NOT_APPROVED",
  "INVESTOR_FEE_UNPAID",
]);

const STEPS = ["amount", "terms", "transfer"] as const;

// Investing in one project, after the amount was chosen on its page
// (/dashboard/invest?projectId=…&amount=…): read and agree to the investing
// terms, which reserves the amount, then transfer it straight to the
// business's bank account. Opened with just ?projectId=…, it shows the
// transfer details of the investor's ticket on that project.
//
// The proxy only lets a KYC-approved INVESTOR reach this route (unverified
// ones go to /kyc?next=… first), and the backend checks again on reserve.
export default function InvestClient() {
  const searchParams = useSearchParams();
  const { t, locale } = useTranslations();
  const { toast } = useToast();
  const { isLoading: isAuthLoading } = useRequireAuth();
  // Reached by URL too, so it checks for a bank account itself rather than
  // trusting the project page's button to have done so.
  const bankAccount = useHasBankAccount();
  const needsBankAccount = bankAccount.isLoaded && !bankAccount.hasAccount;

  const projectId = searchParams.get("projectId");
  const amount = Number(searchParams.get("amount") || 0);

  const projects = usePublicProjects(!isAuthLoading);
  const project = projects.data?.find((p) => p.id === projectId);
  const listingId = project?.loan_application?.listing?.id ?? null;
  const windowQuery = useFundingWindow(listingId);
  const fundingWindow = windowQuery.data ?? null;
  const tranches = useMyTranches(Boolean(fundingWindow));
  const reserve = useReserveTicket();
  // One key per visit: a double click or a retry replays the same reservation
  // instead of making a second one.
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [error, setError] = useState<string | null>(null);

  const ticket =
    reserve.data ??
    tranches.data?.find(
      (tranche) =>
        tranche.window_id === fundingWindow?.id &&
        LIVE_TRANCHE_STATUSES.includes(tranche.status),
    );

  const loading =
    isAuthLoading ||
    projects.isLoading ||
    (Boolean(listingId) && windowQuery.isLoading) ||
    (Boolean(fundingWindow) && tranches.isLoading);

  const handleAgree = () => {
    if (!fundingWindow) return;
    setError(null);
    reserve.mutate(
      {
        windowId: fundingWindow.id,
        idempotencyKey,
        body: {
          amount_vnd: amount,
          ack_risk_disclosure: true,
          terms_version: INVESTOR_TERMS_VERSION,
        },
      },
      {
        onError: (failure) => {
          const code = failure.code ?? "";
          const message = KNOWN_ERRORS.has(code)
            ? t(`${K}.errors.${code}`)
            : t(`${K}.errors.generic`);
          setError(message);
          toast({
            variant: "destructive",
            title: t(`${K}.reserveFailed`),
            description: message,
          });
          // Their ticket from another tab: show it instead of the terms.
          if (code === "ALREADY_HAS_LIVE_TRANCHE") void tranches.refetch();
        },
      },
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const backHref = project
    ? `/dashboard/projects/${project.id}`
    : "/dashboard/projects";
  const bounds = fundingWindow ? ticketBounds(fundingWindow) : null;
  const amountInBounds =
    bounds !== null && amount >= bounds.min && amount <= bounds.max;
  const open = fundingWindow?.status === "OPEN";
  const step = ticket ? "transfer" : "terms";
  const shownAmount = ticket?.amount_vnd ?? amount;

  let body: React.ReactNode;
  if (ticket) {
    body =
      ticket.status === "RESERVED" || ticket.status === "SIGNED" ? (
        <TransferDetails trancheId={ticket.id} locale={locale} t={t} />
      ) : (
        <p className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
          {t(`${K}.confirming`)}
        </p>
      );
  } else if (!project || !fundingWindow || !open) {
    body = (
      <Notice title={t(`${K}.notOpenTitle`)} body={t(`${K}.notOpenBody`)} />
    );
  } else if (needsBankAccount) {
    body = <BankAccountPrompt t={t} audience="investor" />;
  } else if (!amountInBounds) {
    body = (
      <Notice
        title={t(`${K}.amountOutOfRangeTitle`)}
        body={t(`${K}.amountOutOfRangeBody`, {
          min: formatCurrency(bounds!.min, locale),
          max: formatCurrency(bounds!.max, locale),
        })}
      />
    );
  } else {
    body = (
      <>
        <InvestTerms
          amount={amount}
          businessName={project.legal_name}
          fundingWindow={fundingWindow}
          isPending={reserve.isPending}
          onAgree={handleAgree}
          locale={locale}
          t={t}
        />
        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}
      </>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className={cn("-ml-2 gap-2", CONTROL_IDLE)}
      >
        <Link href={backHref}>
          <ArrowLeft className="h-4 w-4" />
          {t(project ? `${K}.backToProject` : `${K}.back`)}
        </Link>
      </Button>

      <Card className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm md:p-8">
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="h-4 w-4" />
          {t(`${K}.verifiedBadge`)}
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t(`${K}.title`)}
          </h1>
          {project && (
            <p className="text-sm text-muted-foreground">
              {project.legal_name}
            </p>
          )}
        </div>

        {/* Where the investor is: the amount was chosen on the project page. */}
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs font-semibold">
          {STEPS.map((name, i) => {
            const current = STEPS.indexOf(step);
            return (
              <li
                key={name}
                aria-current={i === current ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap",
                  i <= current ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border text-[11px]",
                    i < current && "border-primary bg-primary/10 text-primary",
                    i === current &&
                      "border-primary bg-primary text-primary-foreground",
                  )}
                >
                  {i + 1}
                </span>
                {t(`${K}.steps.${name}`)}
                {i < STEPS.length - 1 && (
                  <span
                    className="hidden h-px w-6 bg-border sm:block"
                    aria-hidden
                  />
                )}
              </li>
            );
          })}
        </ol>

        {fundingWindow && shownAmount > 0 && (
          <dl className="grid gap-4 rounded-xl border bg-muted/30 p-5 sm:grid-cols-3">
            <div className="min-w-0 sm:col-span-1">
              <dt className="stat-label">{t(`${K}.amountLabel`)}</dt>
              <dd className="mt-1 text-foreground">
                <TruncatedFigure
                  value={formatCurrency(shownAmount, locale)}
                  className="text-xl font-bold"
                />
              </dd>
            </div>
            <div>
              <dt className="stat-label">{t(`${K}.term`)}</dt>
              <dd className="mt-1 text-sm font-semibold text-foreground">
                {t(`${K}.termValue`, { months: fundingWindow.term_months })}
              </dd>
            </div>
            <div>
              <dt className="stat-label">{t(`${K}.closes`)}</dt>
              <dd className="mt-1 text-sm font-semibold text-foreground">
                {formatDate(fundingWindow.window_end, locale)}
              </dd>
            </div>
          </dl>
        )}

        {body}
      </Card>
    </div>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="space-y-1">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
