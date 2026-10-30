"use client";

import Link from "next/link";
import { Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHasBankAccount } from "@/hooks/use-payment-accounts";

const COPY = {
  // Investors only see a project whose owner has a bank account (the
  // backend's owner_has_bank_account), so until there is one the project
  // stays off the marketplace.
  sme: "dashboard.sme.bankAccountPrompt",
  // The order endpoint refuses an investor without one (BANK_ACCOUNT_REQUIRED):
  // repayments are paid back into the investor's own account.
  investor: "investment.tab.bankAccountPrompt",
} as const;

/**
 * Asks for the bank account money moves through, with a link to the profile's
 * bank account card: "add one" when there is none (or every one was rejected),
 * "waiting for approval" when one is saved but an admin has not approved it
 * yet. Shown only once the account list has loaded and has no approved
 * account, so it never flashes up for someone who already has one.
 */
export function BankAccountPrompt({
  t,
  audience,
}: {
  t: (key: string) => string;
  audience: keyof typeof COPY;
}) {
  const { hasAccount, hasPending, isLoaded } = useHasBankAccount();
  if (!isLoaded || hasAccount) return null;
  const k = COPY[audience];
  const title = hasPending ? `${k}.pendingTitle` : `${k}.title`;
  const body = hasPending ? `${k}.pendingBody` : `${k}.body`;
  const cta = hasPending ? `${k}.pendingCta` : `${k}.cta`;

  return (
    <section
      role="status"
      data-testid="bank-account-prompt"
      data-state={hasPending ? "pending" : "missing"}
      className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 sm:flex-row sm:items-center"
    >
      <Landmark
        className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
        aria-hidden
      />
      <div className="flex-1 space-y-0.5">
        <p className="text-sm font-bold text-foreground">{t(title)}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t(body)}
        </p>
      </div>
      <Button asChild size="sm" className="shrink-0 rounded-full">
        <Link href="/dashboard/settings/profile#bank-account">{t(cta)}</Link>
      </Button>
    </section>
  );
}
