"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Loader2, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/lib/i18n";
import { authenticationService } from "@/services/authentication.service";

interface VerifyEmailNoticeProps {
  // Email the verification link was sent to (the address just registered).
  email: string;
  // Called when the user wants to head to the sign-in form.
  onBackToLogin: () => void;
}

// Shown right after a successful registration. Registration doesn't start a
// session, so this is a self-contained "check your inbox" panel — the actual
// verification happens when the user clicks the link in their email, which
// opens /verify-email?token=… . Resend only needs the email address.
export function VerifyEmailNotice({
  email,
  onBackToLogin,
}: VerifyEmailNoticeProps) {
  const { toast } = useToast();
  const { t } = useTranslations();
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    try {
      const res = await authenticationService.resendVerification(email);
      toast({
        title: t("auth.verifyEmail.resendSuccess"),
        description: res.message,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: t("auth.verifyEmail.resendFailed"),
        description:
          err instanceof Error
            ? err.message
            : t("auth.verifyEmail.resendFailed"),
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center text-center space-y-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.1,
          }}
          className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
        >
          <Mail className="h-8 w-8" />
        </motion.div>

        <h2 className="text-2xl font-bold text-foreground lg:text-3xl">
          {t("auth.verifyEmail.title")}
        </h2>

        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground lg:text-base">
          {t("auth.verifyEmail.description")}
        </p>

        {email ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-slate-100 px-3 py-1.5 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300 lg:text-sm">
            <span className="font-semibold text-muted-foreground">
              {t("auth.verifyEmail.statusLabel")}:
            </span>
            <span className="font-mono">{email}</span>
          </div>
        ) : null}
      </div>

      <div className="space-y-3 pt-2">
        <Button
          onClick={handleResend}
          disabled={isResending}
          variant="outline"
          className="h-11 w-full"
        >
          {isResending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("common.processing")}
            </>
          ) : (
            t("auth.verifyEmail.resendBtn")
          )}
        </Button>

        <Button onClick={onBackToLogin} className="h-11 w-full">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("common.signIn")}
        </Button>
      </div>
    </div>
  );
}
