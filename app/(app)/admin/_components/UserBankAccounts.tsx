"use client";

import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format-date";
import type { PaymentAccount } from "@/services/payment-accounts.service";

const PROFILE = "dashboard.settings.profile.bankAccount";

interface UserBankAccountsProps {
  accounts: PaymentAccount[];
  locale: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

/**
 * The bank accounts a user saved on their profile, in full, for an admin:
 * the account an SME is paid into and an investor is repaid to. Admin only,
 * so the whole number is shown. Nothing renders when there are none (the
 * summary tile above says so).
 */
export function UserBankAccounts({
  accounts,
  locale,
  t,
}: UserBankAccountsProps) {
  if (accounts.length === 0) return null;

  return (
    <ul className="space-y-2" data-testid="admin-user-bank-accounts">
      {accounts.map((account) => (
        <li
          key={account.id}
          className="rounded-lg border bg-muted/20 p-3 space-y-0.5"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {account.bank_name}
            </span>
            {account.bank_bin === null && (
              <Badge variant="outline" className="text-[10px]">
                {t("admin.userPreview.bankAccountOtherBank")}
              </Badge>
            )}
            {account.status !== "APPROVED" && (
              <Badge variant="secondary" className="text-[10px]">
                {t(`${PROFILE}.status.${account.status}`)}
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
        </li>
      ))}
    </ul>
  );
}
