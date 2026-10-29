"use client";

import QRCode from "react-qr-code";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAccountVietQr } from "@/hooks/use-payment-accounts";
import { useTranslations } from "@/lib/i18n";
import type { PaymentAccount } from "@/services/payment-accounts.service";

const K = "dashboard.settings.profile.bankAccount.qr";

interface AccountQrDialogProps {
  account: PaymentAccount | null;
  onOpenChange: (open: boolean) => void;
}

// A static VietQR built by the backend from the saved bank + account number:
// the same thing the account holder's own bank app shows for receiving money.
export function AccountQrDialog({
  account,
  onOpenChange,
}: AccountQrDialogProps) {
  const { t } = useTranslations();
  const qr = useAccountVietQr(account?.id ?? null);
  const unavailable = qr.error?.code === "QR_UNSUPPORTED";

  return (
    <Dialog open={Boolean(account)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t(`${K}.title`)}</DialogTitle>
          <DialogDescription>{t(`${K}.description`)}</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-[248px] items-center justify-center">
          {qr.isLoading && (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          )}
          {qr.isError && (
            <p role="alert" className="text-center text-sm text-destructive">
              {unavailable ? t(`${K}.unavailable`) : t(`${K}.loadFailed`)}
            </p>
          )}
          {qr.data && (
            // QR needs a light background to stay scannable in dark mode.
            <div
              data-testid="account-qr-code"
              data-qr-value={qr.data.payload}
              className="rounded-2xl border border-border/40 bg-white p-4 shadow-sm"
            >
              <QRCode value={qr.data.payload} size={200} />
            </div>
          )}
        </div>

        {account && (
          <div className="space-y-0.5 text-center">
            <p className="text-sm font-semibold text-foreground">
              {account.bank_name}
            </p>
            <p className="font-mono text-sm text-foreground">
              {account.account_number}
            </p>
            <p className="text-xs text-muted-foreground">
              {account.account_name}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
