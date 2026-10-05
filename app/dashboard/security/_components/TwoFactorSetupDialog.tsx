"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useEnableTwoFactor,
  useStartTwoFactorSetup,
} from "@/hooks/use-authentication";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { apiErrorMessage } from "@/lib/api-error-message";

/**
 * Three-step enrolment: scan -> confirm a code -> save recovery codes.
 *
 * The recovery-code step is not skippable and has no "later" button. The codes
 * exist only in this response — they are Argon2-hashed server-side, so no
 * endpoint can ever show them again, and a user who dismisses this step has a
 * second factor with no way back in if they lose their phone.
 */

type Step = "scan" | "confirm" | "recovery";

export function TwoFactorSetupDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, locale } = useTranslations();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("scan");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const {
    mutate: startSetup,
    data: setup,
    isPending: isStarting,
    error: setupError,
    reset: resetSetup,
  } = useStartTwoFactorSetup();
  const { mutate: enable, isPending: isEnabling } = useEnableTwoFactor();

  // Minting a secret is a side effect, so it runs on open rather than on
  // render. The cleanup is what keeps a stale secret from being shown if the
  // dialog is closed and reopened.
  useEffect(() => {
    if (!open) return;
    startSetup();
    return () => resetSetup();
  }, [open, startSetup, resetSetup]);

  const close = (next: boolean) => {
    if (!next) {
      setStep("scan");
      setCode("");
      setError(null);
      setRecoveryCodes([]);
      setCopied(false);
    }
    onOpenChange(next);
  };

  const handleConfirm = () => {
    setError(null);
    enable(code, {
      onSuccess: (result) => {
        setRecoveryCodes(result.recovery_codes);
        setStep("recovery");
      },
      onError: (apiError) =>
        setError(
          apiErrorMessage(
            apiError,
            locale,
            t("security.twoFactor.codeInvalid"),
          ),
        ),
    });
  };

  const copyRecoveryCodes = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join("\n"));
      setCopied(true);
      toast({ title: t("security.twoFactor.recoveryCopied") });
    } catch {
      // Clipboard permission can be denied; the codes are on screen regardless.
      toast({
        variant: "destructive",
        title: t("security.twoFactor.recoveryCopyFailed"),
      });
    }
  };

  const downloadRecoveryCodes = () => {
    // A Blob download rather than a server file: these never touch the network
    // twice, and there is no endpoint that could re-serve them.
    const blob = new Blob(
      [
        `${t("security.twoFactor.recoveryFileHeader")}\n\n${recoveryCodes.join("\n")}\n`,
      ],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "fundlok-recovery-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {t("security.twoFactor.title")}
          </DialogTitle>
          <DialogDescription>
            {step === "recovery"
              ? t("security.twoFactor.recoveryDescription")
              : t("security.twoFactor.description")}
          </DialogDescription>
        </DialogHeader>

        {/* --- Setup could not start ---
            Its own branch on purpose. Before this existed, a failed
            POST /auth/2fa/setup left the skeleton spinning and the secret as
            "…", so a server with no TOTP_ENCRYPTION_KEY looked like a hung
            dialog rather than a clear "not available". */}
        {step === "scan" && setupError && (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-destructive">
                  {t("security.twoFactor.setupFailedTitle")}
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {setupError.message ||
                    t("security.twoFactor.setupFailedDescription")}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => close(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={() => startSetup()} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                {t("security.twoFactor.retry")}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* --- Step 1: scan --- */}
        {step === "scan" && !setupError && (
          <div className="space-y-4">
            <div className="flex justify-center rounded-xl border border-border bg-white p-4">
              {/* bg-white, not a token: a QR needs a light quiet zone to scan,
                  in dark mode too. */}
              {isStarting || !setup ? (
                <Skeleton className="h-[180px] w-[180px]" />
              ) : (
                <QRCode value={setup.provisioning_uri} size={180} />
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("security.twoFactor.manualEntry")}
              </Label>
              {/* Shown for anyone whose camera cannot reach the screen — a
                  desktop authenticator, or a locked-down phone. */}
              <code className="block break-all rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-sm">
                {setup?.secret ?? "…"}
              </code>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => close(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                onClick={() => setStep("confirm")}
                disabled={isStarting || !setup}
              >
                {t("security.twoFactor.next")}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* --- Step 2: confirm a live code --- */}
        {step === "confirm" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="totp-code">
                {t("security.twoFactor.codeLabel")}
              </Label>
              <Input
                id="totp-code"
                value={code}
                onChange={(event) =>
                  // Digits only, capped at 6: the backend rejects anything else
                  // anyway, and a field that silently accepts letters invites a
                  // "why is my code wrong" support ticket.
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" && code.length === 6) {
                    handleConfirm();
                  }
                }}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                className="text-center font-mono text-2xl tracking-[0.4em]"
                disabled={isEnabling}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                {t("security.twoFactor.codeHint")}
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep("scan")}
                disabled={isEnabling}
              >
                {t("security.twoFactor.back")}
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isEnabling || code.length !== 6}
              >
                {isEnabling && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("security.twoFactor.verifyAndEnable")}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* --- Step 3: recovery codes, shown once --- */}
        {step === "recovery" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
              <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                {t("security.twoFactor.recoveryWarning")}
              </p>
            </div>

            <ul className="grid grid-cols-2 gap-2">
              {recoveryCodes.map((recoveryCode) => (
                <li
                  key={recoveryCode}
                  className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-center font-mono text-sm tracking-wider"
                >
                  {recoveryCode}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyRecoveryCodes}
                className="gap-1.5"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {t("security.twoFactor.copyCodes")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadRecoveryCodes}
                className="gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                {t("security.twoFactor.downloadCodes")}
              </Button>
            </div>

            <DialogFooter>
              <Button
                onClick={() => {
                  toast({
                    title: t("security.twoFactor.enabledTitle"),
                    description: t("security.twoFactor.enabledDescription"),
                  });
                  close(false);
                }}
                className={cn("w-full sm:w-auto")}
              >
                {t("security.twoFactor.savedThem")}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
