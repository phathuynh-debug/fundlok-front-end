"use client";

import { useState } from "react";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/lib/i18n";
import type { ApiError } from "@/lib/types";
import { apiErrorMessage } from "@/lib/api-error-message";

/**
 * The code prompt shown after a correct password on a 2FA account.
 *
 * Replaces the email/password form rather than appearing beneath it: at this
 * point the password step is finished, and leaving those fields on screen
 * invites re-submitting them and losing the five-minute challenge.
 *
 * Accepts a recovery code as well as a six-digit one — which is why the input
 * is not digit-restricted here, unlike the enrolment dialog. A user reaching
 * for a recovery code has usually lost their phone and is having a bad enough
 * day without the field rejecting their keystrokes.
 */
export function TwoFactorStep({
  onSubmit,
  onCancel,
  isVerifying,
  error,
}: {
  onSubmit: (code: string) => void;
  onCancel: () => void;
  isVerifying: boolean;
  error?: ApiError | null;
}) {
  const { t, locale } = useTranslations();
  const [code, setCode] = useState("");

  const submit = () => {
    if (code.trim()) onSubmit(code.trim());
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {t("auth.login.twoFactorTitle")}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("auth.login.twoFactorDescription")}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-totp-code">
          {t("auth.login.twoFactorCodeLabel")}
        </Label>
        <Input
          id="login-totp-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          className="text-center font-mono text-xl tracking-[0.3em]"
          disabled={isVerifying}
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          {t("auth.login.twoFactorRecoveryHint")}
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive">
          {apiErrorMessage(error, locale, t("auth.login.twoFactorFailed"))}
        </p>
      )}

      <div className="space-y-2">
        <Button
          type="button"
          onClick={submit}
          aria-label={t("auth.login.twoFactorVerify")}
          disabled={isVerifying || !code.trim()}
          className="h-11 w-full"
        >
          {isVerifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("auth.login.twoFactorVerifying")}
            </>
          ) : (
            t("auth.login.twoFactorVerify")
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isVerifying}
          className="h-11 w-full gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("auth.login.twoFactorBack")}
        </Button>
      </div>
    </div>
  );
}
