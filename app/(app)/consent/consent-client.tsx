"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { FileText, Loader2, LogOut, Mail, ShieldCheck } from "lucide-react";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLogout } from "@/hooks/use-authentication";
import { useAcceptConsent, useSendConsentCode } from "@/hooks/use-consent";
import { useToast } from "@/hooks/use-toast";
import { apiErrorMessage } from "@/lib/api-error-message";
import { useTranslations } from "@/lib/i18n";
import {
  DISCLOSURES_ARTICLE_ID,
  TERMS_ARTICLES,
  TERMS_PREVAILS,
  TERMS_TICK_BOXES,
  TERMS_TITLE,
  TERMS_VERSION,
  type Bilingual,
  type TickBox,
} from "@/lib/legal/terms";
import type { ApiError } from "@/lib/types";
import { safeNextPath } from "@/lib/safe-next-path";
import type { ConsentCodeSent } from "@/services/consent.service";

// The backend's X-Error-Code values for /consent (app/consent/service.py).
const KNOWN_ERRORS = new Set([
  "CONSENT_CODE_INVALID",
  "CONSENT_CODE_EXPIRED",
  "CONSENT_CODE_RATE_LIMITED",
  "CONSENT_VERSION_CHANGED",
]);

const BOXES: TickBox[] = ["terms", "data_processing", "data_sharing_tpv"];

// Contract 1 is signed in Vietnamese with the English beneath, as written:
// the Vietnamese prevails, so both show whatever the interface language.
function BilingualText({ text }: { text: Bilingual }) {
  return (
    <>
      <p className="text-sm leading-relaxed text-foreground">{text.vi}</p>
      <p className="mt-1 text-sm italic leading-relaxed text-muted-foreground">
        {text.en}
      </p>
    </>
  );
}

export function ConsentClient() {
  const { t, locale } = useTranslations();
  const { toast } = useToast();
  const router = useRouter();
  const next = safeNextPath(useSearchParams().get("next"));
  const { mutateAsync: sendCode, isPending: sending } = useSendConsentCode();
  const { mutateAsync: accept, isPending: accepting } = useAcceptConsent();
  const { mutate: logout, isPending: loggingOut } = useLogout();

  const [ticked, setTicked] = useState<Record<TickBox, boolean>>({
    terms: false,
    data_processing: false,
    data_sharing_tpv: false,
  });
  const [sent, setSent] = useState<ConsentCodeSent | null>(null);
  const [code, setCode] = useState("");
  const [resendAt, setResendAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Ticks the "new code in Ns" countdown while one is running.
  useEffect(() => {
    if (resendAt === null) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [resendAt]);

  const allTicked = BOXES.every((box) => ticked[box]);
  const resendSeconds =
    resendAt === null ? 0 : Math.max(0, Math.ceil((resendAt - now) / 1000));
  const disclosures = TERMS_ARTICLES.find(
    (article) => article.id === DISCLOSURES_ARTICLE_ID,
  );

  const errorText = (err: unknown) => {
    const { code: errorCode } = (err as ApiError | null) ?? {};
    return errorCode && KNOWN_ERRORS.has(errorCode)
      ? t(`auth.consent.errors.${errorCode}`)
      : apiErrorMessage(err, locale, t("common.tryAgain"));
  };

  const handleSend = async () => {
    try {
      const result = await sendCode();
      setSent(result);
      setCode("");
      setNow(Date.now());
      setResendAt(Date.now() + result.resend_after_seconds * 1000);
    } catch (err) {
      toast({
        variant: "destructive",
        title: t("auth.consent.errorTitle"),
        description: errorText(err),
      });
    }
  };

  const handleAccept = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!allTicked || code.length !== 6) return;
    try {
      await accept({
        version: TERMS_VERSION,
        terms: true,
        data_processing: true,
        data_sharing_tpv: true,
        code,
      });
      toast({ title: t("auth.consent.accepted") });
      // The proxy takes it from there: role selection for a new account,
      // else where they were going.
      router.replace(next ?? "/dashboard");
    } catch (err) {
      setCode("");
      toast({
        variant: "destructive",
        title: t("auth.consent.errorTitle"),
        description: errorText(err),
      });
    }
  };

  return (
    <div className="min-h-screen bg-muted/50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
            FundLok
          </div>
          <LocaleSwitcher />
        </div>

        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("auth.consent.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("auth.consent.subtitle")}
          </p>
          <div className="rounded-md border bg-card p-3">
            <BilingualText text={TERMS_PREVAILS} />
          </div>
        </header>

        {disclosures && (
          <section
            aria-labelledby="consent-disclosures"
            className="rounded-lg border border-primary/30 bg-card p-5 sm:p-6"
          >
            <h2
              id="consent-disclosures"
              className="text-lg font-semibold text-foreground"
            >
              {t("auth.consent.disclosuresTitle")}
            </h2>
            <div className="mt-1">
              <BilingualText text={disclosures.title} />
            </div>
            <div className="mt-4 flex flex-col gap-4">
              {disclosures.paragraphs.map((paragraph, index) => (
                <div key={index}>
                  <BilingualText text={paragraph} />
                </div>
              ))}
            </div>
          </section>
        )}

        <section
          aria-labelledby="consent-full-terms"
          className="rounded-lg border bg-card p-5 sm:p-6"
        >
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" aria-hidden />
            <h2
              id="consent-full-terms"
              className="text-lg font-semibold text-foreground"
            >
              {t("auth.consent.fullTermsTitle")}
            </h2>
          </div>
          <div className="mt-1">
            <BilingualText text={TERMS_TITLE} />
          </div>
          <ScrollArea className="mt-4 h-80 rounded-md border bg-background">
            <div className="flex flex-col gap-5 p-4">
              {TERMS_ARTICLES.map((article) => (
                <article key={article.id} className="flex flex-col gap-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    {article.title.vi}
                    <span className="block font-normal italic text-muted-foreground">
                      {article.title.en}
                    </span>
                  </h3>
                  {article.id === DISCLOSURES_ARTICLE_ID ? (
                    <p className="text-sm text-muted-foreground">
                      {t("auth.consent.article3SeeAbove")}
                    </p>
                  ) : (
                    article.paragraphs.map((paragraph, index) => (
                      <div key={index}>
                        <BilingualText text={paragraph} />
                      </div>
                    ))
                  )}
                </article>
              ))}
            </div>
          </ScrollArea>
        </section>

        <form
          onSubmit={handleAccept}
          noValidate
          aria-labelledby="consent-confirm"
          className="flex flex-col gap-5 rounded-lg border bg-card p-5 sm:p-6"
        >
          <div>
            <h2
              id="consent-confirm"
              className="text-lg font-semibold text-foreground"
            >
              {t("auth.consent.confirmTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("auth.consent.confirmHelp")}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {BOXES.map((box) => (
              <div key={box} className="flex items-start gap-3">
                <Checkbox
                  id={`consent-${box}`}
                  className="mt-0.5"
                  checked={ticked[box]}
                  disabled={accepting}
                  onCheckedChange={(value) =>
                    setTicked((current) => ({
                      ...current,
                      [box]: value === true,
                    }))
                  }
                />
                <Label
                  htmlFor={`consent-${box}`}
                  className="flex cursor-pointer flex-col items-start gap-1 font-normal"
                >
                  <span className="text-sm leading-relaxed text-foreground">
                    {TERMS_TICK_BOXES[box].vi}
                  </span>
                  <span className="text-sm italic leading-relaxed text-muted-foreground">
                    {TERMS_TICK_BOXES[box].en}
                  </span>
                </Label>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4 border-t pt-5">
            {!sent ? (
              <Button
                type="button"
                className="self-start"
                disabled={!allTicked || sending}
                onClick={handleSend}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Mail className="h-4 w-4" aria-hidden />
                )}
                {sending
                  ? t("auth.consent.sending")
                  : t("auth.consent.sendCode")}
              </Button>
            ) : (
              <>
                <p role="status" className="text-sm text-muted-foreground">
                  {t("auth.consent.codeSent").replace("{email}", sent.sent_to)}
                </p>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="consent-code">
                    {t("auth.consent.codeLabel")}
                  </Label>
                  <InputOTP
                    id="consent-code"
                    maxLength={6}
                    pattern={REGEXP_ONLY_DIGITS}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={setCode}
                    disabled={accepting}
                  >
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <InputOTPSlot key={index} index={index} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="submit"
                    disabled={!allTicked || code.length !== 6 || accepting}
                  >
                    {accepting && (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    )}
                    {accepting
                      ? t("auth.consent.accepting")
                      : t("auth.consent.accept")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={resendSeconds > 0 || sending || accepting}
                    onClick={handleSend}
                  >
                    {resendSeconds > 0
                      ? t("auth.consent.resendIn").replace(
                          "{seconds}",
                          String(resendSeconds),
                        )
                      : t("auth.consent.resend")}
                  </Button>
                </div>
              </>
            )}
          </div>
        </form>

        <div className="flex justify-center pb-4">
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground"
            disabled={loggingOut}
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4" aria-hidden />
            {t("auth.consent.signOut")}
          </Button>
        </div>
      </div>
    </div>
  );
}
