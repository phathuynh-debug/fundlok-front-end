"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { LogOut, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser, useLogout } from "@/hooks/use-authentication";
import { useToast } from "@/hooks/use-toast";
import { useTurnstile } from "@/hooks/use-turnstile";
import { useSendPhoneCode } from "@/hooks/use-users";
import { useTranslations } from "@/lib/i18n";
import { phoneVerificationErrorKey } from "@/lib/phone-verification";
import type { SendPhoneCodeResponse } from "@/services/users.service";
import { PhoneNumberStep } from "./_components/PhoneNumberStep";
import { CodeStep } from "./_components/CodeStep";

/**
 * Two steps: a number, then the code Zalo delivers to it.
 *
 * Which number the live code went to is step state, held here rather than
 * read from the mutation: a resend starts a new mutation, which clears the
 * old result, and the user must stay on the code step while it runs (and if
 * it is refused, since the earlier code may still be good). The one Turnstile
 * widget lives here, above both steps, because sending and resending each
 * spend a token and the widget only renders into a container present on mount.
 */
export function VerifyPhoneClient() {
  const { data: user } = useCurrentUser();
  const { mutate: logout } = useLogout();
  const { toast } = useToast();
  const { t } = useTranslations();
  const sendCode = useSendPhoneCode();
  const {
    turnstileToken,
    turnstileContainerRef,
    reset: resetTurnstile,
    isTurnstileDisabled,
  } = useTurnstile();
  const [sent, setSent] = useState<SendPhoneCodeResponse | null>(null);
  // Bumped per delivered code, to give the code step a fresh input and error.
  const [sendCount, setSendCount] = useState(0);
  // Seconds until another code may be requested; set from each send's answer.
  const [resendIn, setResendIn] = useState(0);
  const [sendError, setSendError] = useState<string | null>(null);

  // Count down to the next allowed resend. The state update runs in the
  // timer's callback, never in the effect body.
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [resendIn]);

  const needsCaptcha = !isTurnstileDisabled && !turnstileToken;

  const send = (phone: string) => {
    if (needsCaptcha) {
      setSendError("auth.securityCheckRequired");
      return;
    }
    setSendError(null);
    sendCode.mutate(
      { phone, turnstile_token: turnstileToken },
      {
        onSuccess: (result) => {
          setSent(result);
          setSendCount((n) => n + 1);
          setResendIn(result.resend_in);
          toast({ title: t("auth.verifyPhone.sentToast") });
        },
        onError: (error) => setSendError(phoneVerificationErrorKey(error)),
        // A Turnstile token is single use, so the next send needs a new one.
        onSettled: () => resetTurnstile(),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center space-y-4">
        <m.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.1,
          }}
          className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20"
        >
          <Smartphone className="h-8 w-8" />
        </m.div>
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
          {sent ? t("auth.verifyPhone.codeTitle") : t("auth.verifyPhone.title")}
        </h2>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={sent ? "code" : "phone"}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.18 }}
        >
          {sent ? (
            <CodeStep
              key={sendCount}
              sent={sent}
              resendIn={resendIn}
              onResend={() => send(sent.phone)}
              isResending={sendCode.isPending}
              resendError={sendError}
              canResend={!needsCaptcha}
              onChangeNumber={() => {
                setSendError(null);
                setSent(null);
              }}
            />
          ) : (
            <PhoneNumberStep
              initialPhone={user?.phone ?? ""}
              onSend={send}
              isSending={sendCode.isPending}
              sendError={sendError}
              canSend={!needsCaptcha}
            />
          )}
        </m.div>
      </AnimatePresence>

      {!isTurnstileDisabled && (
        <div className="flex justify-center">
          <div ref={turnstileContainerRef} />
        </div>
      )}

      <Button
        onClick={() => logout()}
        variant="ghost"
        className="w-full h-11 text-red-500 hover:text-red-600 hover:bg-red-50/50 dark:hover:bg-red-950/10"
      >
        <LogOut className="mr-2 h-4 w-4" />
        {t("auth.verifyPhone.logoutBtn")}
      </Button>
    </div>
  );
}
