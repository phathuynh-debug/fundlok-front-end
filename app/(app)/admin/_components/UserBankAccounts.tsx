"use client";

import type { AdminPaymentAccount } from "@/services/admin.service";
import { BankAccountReviewItem } from "./BankAccountReviewItem";

interface UserBankAccountsProps {
  accounts: AdminPaymentAccount[];
  locale: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

/**
 * The bank accounts a user saved on their profile, in full, for an admin:
 * the account an SME is paid into and an investor is repaid to. A PENDING one
 * can be approved or rejected right here. Nothing renders when there are none
 * (the summary tile above says so).
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
        <BankAccountReviewItem
          key={account.id}
          account={account}
          locale={locale}
          t={t}
        />
      ))}
    </ul>
  );
}
