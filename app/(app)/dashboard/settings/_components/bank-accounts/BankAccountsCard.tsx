"use client";

import { useState } from "react";
import { Landmark, Loader2, Plus, QrCode } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePaymentAccounts } from "@/hooks/use-payment-accounts";
import { formatDate } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import { CONTROL_HOVER } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";
import type {
  PaymentAccount,
  PaymentAccountStatus,
} from "@/services/payment-accounts.service";
import { AddBankAccountDialog } from "./AddBankAccountDialog";
import { AccountQrDialog } from "./AccountQrDialog";

const K = "dashboard.settings.profile.bankAccount";

const STATUS_CLASSES: Record<PaymentAccountStatus, string> = {
  PENDING:
    "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/10",
  APPROVED: "bg-primary/10 text-primary border-primary/20 hover:bg-primary/10",
  REJECTED:
    "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/10",
};

interface BankAccountsCardProps {
  role: "SME" | "INVESTOR";
}

// The bank accounts a user sends and receives transfers with. Each one starts
// PENDING until staff check it against the uploaded statement; a wrong account
// is fixed by saving a new one (there is no edit or delete).
export function BankAccountsCard({ role }: BankAccountsCardProps) {
  const { t, locale } = useTranslations();
  const accounts = usePaymentAccounts();
  const [addOpen, setAddOpen] = useState(false);
  const [qrAccount, setQrAccount] = useState<PaymentAccount | null>(null);

  const list = accounts.data ?? [];

  return (
    <Card className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2.5 text-lg font-semibold text-foreground">
            <Landmark className="h-5 w-5 text-primary" />
            {t(`${K}.title`)}
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            {t(`${K}.description`)}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className={cn("rounded-full", CONTROL_HOVER)}
          onClick={() => setAddOpen(true)}
        >
          <Plus className="h-4 w-4" />
          {t(`${K}.add`)}
        </Button>
      </div>

      {accounts.isLoading && (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {accounts.isError && (
        <p role="alert" className="text-sm text-destructive">
          {t(`${K}.loadFailed`)}
        </p>
      )}

      {accounts.isSuccess && list.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
          {t(`${K}.empty`)}
        </p>
      )}

      {list.length > 0 && (
        <ul className="space-y-3">
          {list.map((account) => (
            <li
              key={account.id}
              className="rounded-xl border border-border/60 bg-muted/20 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">
                      {account.bank_name}
                    </p>
                    <Badge
                      className={cn(
                        "rounded-full border",
                        STATUS_CLASSES[account.status],
                      )}
                    >
                      {t(`${K}.status.${account.status}`)}
                    </Badge>
                  </div>
                  <p className="font-mono text-sm text-foreground">
                    {account.account_number}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {account.account_name} ·{" "}
                    {account.holder_type === "ENTITY"
                      ? t(`${K}.holderEntity`)
                      : t(`${K}.holderIndividual`)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t(`${K}.addedOn`, {
                      date: formatDate(account.created_at, locale),
                    })}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={CONTROL_HOVER}
                  onClick={() => setQrAccount(account)}
                >
                  <QrCode className="h-4 w-4" />
                  {t(`${K}.showQr`)}
                </Button>
              </div>

              {account.status === "PENDING" && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {t(`${K}.pendingHint`)}
                </p>
              )}
              {account.status === "REJECTED" && (
                <div className="mt-3 space-y-0.5 text-xs">
                  {account.rejection_reason && (
                    <p className="text-destructive">
                      {t(`${K}.rejectedReason`, {
                        reason: account.rejection_reason,
                      })}
                    </p>
                  )}
                  <p className="text-muted-foreground">
                    {t(`${K}.rejectedHint`)}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <AddBankAccountDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        defaultHolderType={role === "SME" ? "ENTITY" : "INDIVIDUAL"}
      />
      <AccountQrDialog
        account={qrAccount}
        onOpenChange={(open) => {
          if (!open) setQrAccount(null);
        }}
      />
    </Card>
  );
}
