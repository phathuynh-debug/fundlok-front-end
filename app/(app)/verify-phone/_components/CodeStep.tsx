"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { landingRouteFor, signInReturnPath } from "@/app/(app)/login/use-login";
import { useToast } from "@/hooks/use-toast";
import { useVerifyPhoneCode } from "@/hooks/use-users";
import { useTranslations } from "@/lib/i18n";
import {
  codeIsSpent,
  formatVietnameseMobile,
  phoneVerificationErrorKey,
} from "@/lib/phone-verification";
import type { SendPhoneCodeResponse } from "@/services/users.service";

const CODE_LENGTH = 6;

const SENT_KEYS: Record<SendPhoneCodeResponse["channel"], string> = {
  zalo: "auth.verifyPhone.codeSentZalo",
  log: "auth.verifyPhone.codeSentLog",
};

interface CodeStepProps {
  sent: SendPhoneCodeResponse;
  /** Seconds until another code may be requested. */
  resendIn: number;
  onResend: () => void;
  isResending: boolean;
  /** i18n key of the last resend's refusal. */
  resendError: string | null;
  /** False until the Turnstile check has produced a token. */
  canResend: boolean;
  onChangeNumber: () => void;
}

export function CodeStep({
  sent,
  resendIn,
  onResend,
  isResending,
  resendError,
  canResend,
  onChangeNumber,
}: CodeStepProps) {
  const { t } = useTranslations();
  const { toast } = useToast();
  const router = useRouter();
  const verify = useVerifyPhoneCode();
  const [code, setCode] = useState("");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  // An expired or exhausted code cannot be retried; only a resend helps. A
  // delivered resend remounts this step (the parent keys it per send).
  const spent = errorKey !== null && codeIsSpent(errorKey);
  const shownError = errorKey ?? resendError;

  const submit = (value: string) => {
    if (value.length !== CODE_LENGTH || verify.isPending || verify.isSuccess) {
      return;
    }
    setErrorKey(null);
    verify.mutate(value, {
      onSuccess: (user) => {
        toast({
          title: t("auth.verifyPhone.verifiedTitle"),
          description: t("auth.verifyPhone.verifiedDescription"),
        });
        router.push(landingRouteFor(user, signInReturnPath()));
      },
      onError: (error) => {
        setErrorKey(phoneVerificationErrorKey(error));
        setCode("");
      },
    });
  };

  const sentTo = t(SENT_KEYS[sent.channel]).replace(
    "{phone}",
    formatVietnameseMobile(sent.phone),
  );
  const expiry = t("auth.verifyPhone.codeExpiry").replace(
    "{minutes}",
    String(Math.round(sent.expires_in / 60)),
  );

  return (
    <div className="space-y-5">
      <div className="space-y-1 text-center">
        <p className="text-sm lg:text-base text-foreground">{sentTo}</p>
        <p className="text-xs text-muted-foreground">{expiry}</p>
      </div>

      <InputOTP
        maxLength={CODE_LENGTH}
        value={code}
        onChange={(value) => {
          setCode(value);
          setErrorKey(null);
        }}
        onComplete={submit}
        pattern={REGEXP_ONLY_DIGITS}
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        disabled={spent || verify.isPending || verify.isSuccess}
        aria-label={t("auth.verifyPhone.codeLabel")}
        containerClassName="justify-center"
      >
        <InputOTPGroup>
          {Array.from({ length: CODE_LENGTH }, (_, i) => (
            <InputOTPSlot
              key={i}
              index={i}
              aria-invalid={!!errorKey}
              className="h-12 w-11 text-lg"
            />
          ))}
        </InputOTPGroup>
      </InputOTP>

      {shownError && (
        <p role="alert" className="text-sm text-destructive text-center">
          {t(shownError)}
        </p>
      )}

      <div className="space-y-3">
        <Button
          type="button"
          onClick={() => submit(code)}
          disabled={
            code.length !== CODE_LENGTH ||
            spent ||
            verify.isPending ||
            verify.isSuccess
          }
          className="w-full h-11"
        >
          {verify.isPending || verify.isSuccess ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("common.processing")}
            </>
          ) : (
            t("auth.verifyPhone.verifyBtn")
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onResend}
          disabled={resendIn > 0 || isResending || !canResend}
          className="w-full h-11"
        >
          {isResending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("common.processing")}
            </>
          ) : resendIn > 0 ? (
            t("auth.verifyPhone.resendIn").replace(
              "{seconds}",
              String(resendIn),
            )
          ) : (
            t("auth.verifyPhone.resendBtn")
          )}
        </Button>

        <Button
          type="button"
          variant="link"
          onClick={onChangeNumber}
          className="w-full text-muted-foreground"
        >
          {t("auth.verifyPhone.changeNumber")}
        </Button>
      </div>
    </div>
  );
}
