"use client";

import { useState } from "react";
import { AlertTriangle, Link2, Loader2, Unlink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useDisconnectSepay,
  useSepayBankAccounts,
  useSepayStatus,
  useStartSepayConnect,
} from "@/hooks/use-sepay";
import { useToast } from "@/hooks/use-toast";
import { apiErrorMessage } from "@/lib/api-error-message";
import { formatDate } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import { CONTROL_HOVER } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";

const K = "dashboard.settings.profile.sepay";

// Lets an SME or investor connect their own SePay account over OAuth2. The
// button sends the browser to SePay; SePay sends it back to
// /dashboard/settings/profile/sepay-callback, which finishes the connection.
// Hidden entirely until FundLok's SePay app is configured on the server.
export function SepayConnectionCard() {
  const { t, locale } = useTranslations();
  const { toast } = useToast();
  const status = useSepayStatus();
  const startConnect = useStartSepayConnect();
  const disconnect = useDisconnectSepay();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const connected = status.data?.connected ?? false;
  const needsReconnect = status.data?.status === "NEEDS_RECONNECT";
  const accounts = useSepayBankAccounts(connected && !needsReconnect);

  if (!status.data?.configured) return null;

  const handleConnect = () => {
    startConnect.mutate(undefined, {
      onSuccess: ({ authorize_url }) => {
        window.location.assign(authorize_url);
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: t(`${K}.connectFailed`),
          description: apiErrorMessage(error, locale, t(`${K}.tryAgain`)),
        });
      },
    });
  };

  const handleDisconnect = () => {
    disconnect.mutate(undefined, {
      onSuccess: () => {
        setConfirmOpen(false);
        toast({
          title: t(`${K}.disconnectedTitle`),
          description: t(`${K}.disconnectedDescription`),
        });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: t(`${K}.disconnectFailed`),
          description: apiErrorMessage(error, locale, t(`${K}.tryAgain`)),
        });
      },
    });
  };

  const list = accounts.data ?? [];

  return (
    <Card id="sepay" className="scroll-mt-24 p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2.5 text-lg font-semibold text-foreground">
            <Link2 className="h-5 w-5 text-primary" />
            {t(`${K}.title`)}
            {connected && !needsReconnect && (
              <Badge className="rounded-full border border-primary/20 bg-primary/10 text-primary hover:bg-primary/10">
                {t(`${K}.connected`)}
              </Badge>
            )}
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            {t(`${K}.description`)}
          </p>
        </div>

        {(!connected || needsReconnect) && (
          <Button
            type="button"
            className="rounded-full"
            onClick={handleConnect}
            disabled={startConnect.isPending || startConnect.isSuccess}
          >
            {startConnect.isPending || startConnect.isSuccess ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="h-4 w-4" />
            )}
            {needsReconnect ? t(`${K}.reconnect`) : t(`${K}.connect`)}
          </Button>
        )}
        {connected && (
          <Button
            type="button"
            variant="outline"
            className={cn("rounded-full", CONTROL_HOVER)}
            onClick={() => setConfirmOpen(true)}
          >
            <Unlink className="h-4 w-4" />
            {t(`${K}.disconnect`)}
          </Button>
        )}
      </div>

      {status.isLoading && (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!connected && (
        <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
          {t(`${K}.consent`)}
        </p>
      )}

      {needsReconnect && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-600"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {t(`${K}.needsReconnect`)}
        </p>
      )}

      {connected && !needsReconnect && (
        <div className="space-y-3">
          {status.data?.connected_at && (
            <p className="text-xs text-muted-foreground">
              {t(`${K}.connectedOn`, {
                date: formatDate(status.data.connected_at, locale),
              })}
            </p>
          )}

          {accounts.isLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {accounts.isError && (
            <p role="alert" className="text-sm text-destructive">
              {apiErrorMessage(accounts.error, locale, t(`${K}.loadFailed`))}
            </p>
          )}
          {accounts.isSuccess && list.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
              {t(`${K}.noAccounts`)}
            </p>
          )}
          {list.length > 0 && (
            <ul className="space-y-3">
              {list.map((account) => (
                <li
                  key={account.id}
                  className="rounded-xl border border-border/60 bg-muted/20 p-5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">
                      {account.bank_short_name ?? account.bank_full_name ?? "—"}
                    </p>
                    {!account.active && (
                      <Badge variant="secondary" className="rounded-full">
                        {t(`${K}.inactive`)}
                      </Badge>
                    )}
                  </div>
                  <p className="font-mono text-sm text-foreground">
                    {account.account_number}
                  </p>
                  {account.account_holder_name && (
                    <p className="text-sm text-muted-foreground">
                      {account.account_holder_name}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(`${K}.disconnectTitle`)}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(`${K}.disconnectBody`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disconnect.isPending}>
              {t(`${K}.cancel`)}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDisconnect();
              }}
              disabled={disconnect.isPending}
            >
              {disconnect.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {t(`${K}.disconnect`)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
