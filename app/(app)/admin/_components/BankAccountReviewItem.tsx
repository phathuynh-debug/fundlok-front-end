"use client";

import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format-date";
import { roleLabel } from "@/lib/enum-labels";
import { cn } from "@/lib/utils";
import type { AdminPaymentAccount } from "@/services/admin.service";
import { PaymentAccountDecision } from "./PaymentAccountDecision";

const K = "admin.bankAccounts";
const PROFILE = "dashboard.settings.profile.bankAccount";

const STATUS_CLASSES = {
  PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  APPROVED: "bg-primary/10 text-primary border-primary/20",
  REJECTED: "bg-destructive/10 text-destructive border-destructive/20",
} as const;

interface BankAccountReviewItemProps {
  account: AdminPaymentAccount;
  /** Show whose account it is: the review queue does, a user's own panel does not. */
  showOwner?: boolean;
  locale: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

/**
 * One saved bank account as an admin reviews it: the account in full, its
 * status, who decided it and when, and, while it is PENDING, the controls to
 * approve or reject it.
 */
export function BankAccountReviewItem({
  account,
  showOwner = false,
  locale,
  t,
}: BankAccountReviewItemProps) {
  const decidedOn = account.approved_at
    ? formatDate(account.approved_at, locale)
    : null;

  return (
    <li
      className="rounded-lg border bg-muted/20 p-3 space-y-0.5"
      data-testid="bank-account-review-item"
    >
      {showOwner && (
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">
            {account.user_full_name || account.user_email}
          </span>
          {account.user_full_name && <> · {account.user_email}</>} ·{" "}
          {roleLabel(t, account.holder_role)}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-foreground">
          {account.bank_name}
        </span>
        <Badge
          className={cn(
            "rounded-full border text-[10px] hover:bg-transparent",
            STATUS_CLASSES[account.status],
          )}
        >
          {t(`${PROFILE}.status.${account.status}`)}
        </Badge>
        {account.bank_bin === null && (
          <Badge variant="outline" className="text-[10px]">
            {t("admin.userPreview.bankAccountOtherBank")}
          </Badge>
        )}
      </div>
      <p className="font-mono text-sm text-foreground">
        {account.account_number}
      </p>
      <p className="text-xs text-muted-foreground">
        {account.account_name} ·{" "}
        {account.holder_type === "ENTITY"
          ? t(`${PROFILE}.holderEntity`)
          : t(`${PROFILE}.holderIndividual`)}{" "}
        ·{" "}
        {t(`${PROFILE}.addedOn`, {
          date: formatDate(account.created_at, locale),
        })}
      </p>

      {account.status !== "PENDING" && (
        <p className="text-xs text-muted-foreground">
          {account.approved_by_email
            ? t(
                account.status === "APPROVED"
                  ? `${K}.approvedBy`
                  : `${K}.rejectedBy`,
                { email: account.approved_by_email, date: decidedOn ?? "—" },
              )
            : account.status === "APPROVED"
              ? t(`${K}.approvedOnSave`)
              : null}
        </p>
      )}
      {account.status === "REJECTED" && account.rejection_reason && (
        <p className="text-xs text-destructive">
          {t(`${PROFILE}.rejectedReason`, {
            reason: account.rejection_reason,
          })}
        </p>
      )}

      {account.status === "PENDING" && (
        <PaymentAccountDecision accountId={account.id} locale={locale} t={t} />
      )}
    </li>
  );
}
