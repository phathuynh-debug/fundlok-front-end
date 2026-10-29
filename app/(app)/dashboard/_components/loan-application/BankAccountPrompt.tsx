"use client";

import Link from "next/link";
import { Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePaymentAccounts } from "@/hooks/use-payment-accounts";

/**
 * Asks an approved SME for the bank account investors will pay into.
 *
 * Investors only see a project whose owner has saved a bank account (pending
 * or approved; see owner_has_bank_account in the backend's projects service),
 * so until there is one the project stays off the marketplace. Shown only
 * once the account list has loaded and has no usable account, so it never
 * flashes up for an SME who already added one.
 */
export function BankAccountPrompt({ t }: { t: (key: string) => string }) {
  const accounts = usePaymentAccounts();
  const hasUsableAccount = (accounts.data ?? []).some(
    (account) => account.status !== "REJECTED",
  );
  if (!accounts.isSuccess || hasUsableAccount) return null;

  return (
    <section
      role="status"
      data-testid="bank-account-prompt"
      className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 sm:flex-row sm:items-center"
    >
      <Landmark
        className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
        aria-hidden
      />
      <div className="flex-1 space-y-0.5">
        <p className="text-sm font-bold text-foreground">
          {t("dashboard.sme.bankAccountPrompt.title")}
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("dashboard.sme.bankAccountPrompt.body")}
        </p>
      </div>
      <Button asChild size="sm" className="shrink-0 rounded-full">
        <Link href="/dashboard/settings/profile#bank-account">
          {t("dashboard.sme.bankAccountPrompt.cta")}
        </Link>
      </Button>
    </section>
  );
}
