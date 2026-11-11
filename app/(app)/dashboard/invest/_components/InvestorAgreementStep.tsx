"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  AlertCircle,
  Clock,
  Download,
  FileSignature,
  Loader2,
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import {
  useInvestorAgreementPdf,
  useSendInvestorAgreementCode,
  useSignInvestorAgreement,
} from "@/hooks/use-funding";
import { useObjectUrl } from "@/hooks/use-object-url";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/format-date";
import type { ApiError } from "@/lib/types";
import type {
  AgreementCodeSent,
  InvestorAgreementStatus,
} from "@/services/funding.service";

const K = "investConfirm.agreement";

const CODE_LENGTH = 6;

// Failures the investor can act on, by X-Error-Code.
const KNOWN_ERRORS = new Set([
  "CODE_INCORRECT",
  "CODE_EXPIRED",
  "CODE_TOO_MANY_ATTEMPTS",
  "CODE_COOLDOWN",
  "CODE_DAILY_LIMIT",
  "CODE_NOT_SENT",
  "CODE_UNAVAILABLE",
  "PHONE_REQUIRED",
  "PHONE_NO_ZALO",
  "INVESTOR_AGREEMENT_OUTDATED",
  "INVESTOR_AGREEMENT_ALREADY_SIGNED",
  "HOLD_EXPIRED",
]);

// A code that can no longer be entered: only a new one helps.
const SPENT = new Set(["CODE_EXPIRED", "CODE_TOO_MANY_ATTEMPTS"]);

interface InvestorAgreementStepProps {
  /** The version the platform asks for, printed on the PDF. */
  version: string;
  /** The commitment it is confirmed with: its code and Annex fill the PDF. */
  trancheId: string;
  referenceCode: string;
  /** Confirm before this, or the commitment's hold lapses. */
  holdExpiresAt: string;
  /**
   * The number the code goes to by Zalo, masked ("0703***489"); null when the
   * account has no Vietnamese mobile number yet.
   */
  phone: string | null;
  /** The agreement was confirmed: on to the transfer. */
  onSigned: (status: InvestorAgreementStatus) => void;
  locale: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

/**
 * The investor's first commitment, made and holding its amount (no money has
 * moved): now the Investor Service Agreement (Contract 4). The backend fills
 * the PDF in from the verified profile, the approved bank account and this
 * commitment's code and Annex; the investor reads it here, ticks that they
 * agree, asks for a one-time code on their phone by Zalo and enters it. The
 * code is their signature: the backend keeps the agreement as they read it
 * with the time and the number the code went to, and gives no payment details
 * until then.
 */
export function InvestorAgreementStep({
  version,
  trancheId,
  referenceCode,
  holdExpiresAt,
  phone,
  onSigned,
  locale,
  t,
}: InvestorAgreementStepProps) {
  const { toast } = useToast();
  const pdf = useInvestorAgreementPdf(trancheId);
  const url = useObjectUrl(pdf.data?.blob ?? null);
  const filename =
    pdf.data?.filename ?? "FundLok-hop-dong-dich-vu-nha-dau-tu.pdf";
  const sendCode = useSendInvestorAgreementCode();
  const sign = useSignInvestorAgreement();
  const [agreed, setAgreed] = useState(false);
  const [sent, setSent] = useState<AgreementCodeSent | null>(null);
  const [code, setCode] = useState("");
  // Seconds until another code may be requested; set from each send's answer.
  const [resendIn, setResendIn] = useState(0);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // Count down to the next allowed resend. The state update runs in the
  // timer's callback, never in the effect body.
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [resendIn]);

  const messageFor = (failure: ApiError) =>
    t(
      `${K}.errors.${KNOWN_ERRORS.has(failure.code ?? "") ? failure.code : "generic"}`,
    );

  const fail = (failure: ApiError, title: string) => {
    setErrorCode(
      KNOWN_ERRORS.has(failure.code ?? "") ? failure.code! : "generic",
    );
    toast({ variant: "destructive", title, description: messageFor(failure) });
  };

  const requestCode = () => {
    setErrorCode(null);
    sendCode.mutate(
      { version, trancheId },
      {
        onSuccess: (answer) => {
          setSent(answer);
          setCode("");
          setResendIn(answer.resend_in);
        },
        onError: (failure) => fail(failure, t(`${K}.sendFailed`)),
      },
    );
  };

  const confirm = (value: string) => {
    if (value.length !== CODE_LENGTH || sign.isPending || sign.isSuccess) {
      return;
    }
    setErrorCode(null);
    sign.mutate(
      { version, trancheId, code: value },
      {
        onSuccess: (status) => {
          toast({ title: t(`${K}.confirmed`) });
          onSigned(status);
        },
        onError: (failure) => {
          setCode("");
          fail(failure, t(`${K}.failed`));
        },
      },
    );
  };

  const spent = errorCode !== null && SPENT.has(errorCode);
  const busy = sign.isPending || sign.isSuccess;

  return (
    <section className="space-y-5" aria-labelledby="investor-agreement-title">
      <div className="space-y-1">
        <h2
          id="investor-agreement-title"
          className="flex items-center gap-2 text-lg font-bold text-foreground"
        >
          <FileSignature className="h-5 w-5 text-muted-foreground" />
          {t(`${K}.title`)}
        </h2>
        <p className="text-sm text-muted-foreground">{t(`${K}.intro`)}</p>
      </div>

      {/* The commitment exists, no money has moved: confirm before the hold ends. */}
      <div
        className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm"
        data-testid="investor-agreement-held"
      >
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="leading-relaxed text-foreground">
          {t(`${K}.held`, {
            ref: referenceCode,
            deadline: formatDateTime(holdExpiresAt, locale),
          })}
        </p>
      </div>

      {/* The agreement as the investor confirms it. */}
      <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border bg-muted/30">
        <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
          <span className="truncate text-xs font-semibold text-muted-foreground">
            {t(`${K}.previewLabel`)}
          </span>
          <Button
            asChild={!!url}
            type="button"
            size="sm"
            variant="outline"
            disabled={!url}
            className="h-8 shrink-0 gap-1.5 text-xs"
          >
            {url ? (
              <a href={url} download={filename}>
                <Download className="h-3.5 w-3.5" aria-hidden />
                {t(`${K}.download`)}
              </a>
            ) : (
              <span>
                <Download className="h-3.5 w-3.5" aria-hidden />
                {t(`${K}.download`)}
              </span>
            )}
          </Button>
        </div>
        <div className="flex h-[420px] items-center justify-center sm:h-[520px]">
          {pdf.isError ? (
            <div className="flex flex-col items-center gap-3 px-6 text-center">
              <AlertCircle className="h-6 w-6 text-destructive" aria-hidden />
              <p className="text-sm text-foreground">{t(`${K}.loadFailed`)}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => void pdf.refetch()}
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                {t(`${K}.retry`)}
              </Button>
            </div>
          ) : url ? (
            <iframe
              src={`${url}#view=FitH`}
              title={t(`${K}.title`)}
              className="h-full w-full bg-background"
              data-testid="investor-agreement-preview"
            />
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {t(`${K}.loading`)}
            </p>
          )}
        </div>
      </div>

      {/* Confirming: the code sent to their phone is their signature. */}
      <div
        className="space-y-4 rounded-xl border p-4"
        data-testid="investor-agreement-confirm"
      >
        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" aria-hidden />
          {t(`${K}.confirmTitle`)}
        </h3>

        {!phone ? (
          <div
            className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm"
            data-testid="investor-agreement-no-phone"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="leading-relaxed text-foreground">
              {t(`${K}.noPhone`)}{" "}
              <Link
                href="/dashboard/settings/profile"
                className="font-semibold underline underline-offset-2"
              >
                {t(`${K}.noPhoneLink`)}
              </Link>
            </p>
          </div>
        ) : !sent ? (
          <>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t(`${K}.confirmIntro`, { phone })}
            </p>
            <div className="flex items-start gap-3">
              <Checkbox
                id="agree-investor-agreement"
                checked={agreed}
                onCheckedChange={(value) => setAgreed(value === true)}
                disabled={sendCode.isPending}
                className="mt-0.5"
              />
              <Label
                htmlFor="agree-investor-agreement"
                className="text-sm font-medium leading-relaxed text-foreground"
              >
                {t(`${K}.agree`)}
              </Label>
            </div>
            <Button
              type="button"
              className="h-11 w-full gap-2 font-semibold"
              disabled={!agreed || !url || sendCode.isPending}
              onClick={requestCode}
            >
              {sendCode.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t(`${K}.sending`)}
                </>
              ) : (
                <>
                  <MessageSquareText className="h-4 w-4" />
                  {t(`${K}.sendCode`)}
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-1 text-center">
              <p className="text-sm text-foreground">
                {t(
                  sent.channel === "zalo"
                    ? `${K}.codeSentZalo`
                    : `${K}.codeSentLog`,
                  { phone: sent.phone },
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {t(`${K}.codeExpiry`, {
                  minutes: Math.round(sent.expires_in / 60),
                })}
              </p>
            </div>
            <InputOTP
              maxLength={CODE_LENGTH}
              value={code}
              onChange={(value) => {
                setCode(value);
                setErrorCode(null);
              }}
              onComplete={confirm}
              pattern={REGEXP_ONLY_DIGITS}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              disabled={spent || busy}
              aria-label={t(`${K}.codeLabel`)}
              containerClassName="justify-center"
            >
              <InputOTPGroup>
                {Array.from({ length: CODE_LENGTH }, (_, i) => (
                  <InputOTPSlot
                    key={i}
                    index={i}
                    aria-invalid={!!errorCode}
                    className="h-12 w-11 text-lg"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <Button
              type="button"
              className="h-11 w-full gap-2 font-semibold"
              disabled={code.length !== CODE_LENGTH || spent || busy}
              onClick={() => confirm(code)}
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t(`${K}.confirming`)}
                </>
              ) : (
                <>
                  <FileSignature className="h-4 w-4" />
                  {t(`${K}.confirm`)}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full"
              disabled={resendIn > 0 || sendCode.isPending || busy}
              onClick={requestCode}
            >
              {sendCode.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t(`${K}.sending`)}
                </>
              ) : resendIn > 0 ? (
                t(`${K}.resendIn`, { seconds: resendIn })
              ) : (
                t(`${K}.resend`)
              )}
            </Button>
          </>
        )}
        {errorCode && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {t(`${K}.errors.${errorCode}`)}
          </p>
        )}
      </div>

      <div className="space-y-1 text-xs leading-relaxed text-muted-foreground">
        <p>{t(`${K}.recordNote`)}</p>
        <p>{t(`${K}.blanksNote`)}</p>
        <p>{t(`${K}.version`, { version })}</p>
      </div>
    </section>
  );
}
