"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTurnstile } from "@/hooks/use-turnstile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { useForgotPassword } from "@/app/forgot-password/use-forgot-password";
import { apiErrorMessage } from "@/lib/api-error-message";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");

  const {
    turnstileToken,
    turnstileContainerRef,
    reset: resetTurnstile,
  } = useTurnstile();
  const { toast } = useToast();
  const { t, locale } = useTranslations();
  const { forgotPassword, isPending, isSuccess } = useForgotPassword();

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      process.env.NEXT_PUBLIC_DISABLE_TURNSTILE !== "true" &&
      !turnstileToken
    ) {
      toast({
        variant: "destructive",
        title: t("auth.forgotPassword.failedTitle"),
        description: t("auth.securityCheckRequired"),
      });
      return;
    }

    forgotPassword(
      { email, turnstile_token: turnstileToken },
      {
        onSuccess: () => {
          toast({
            title: t("auth.forgotPassword.successTitle"),
            description: t("auth.forgotPassword.successDescription"),
          });
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: t("auth.forgotPassword.failedTitle"),
            description: apiErrorMessage(
              error,
              locale,
              t("auth.forgotPassword.failedDescription"),
            ),
          });
          resetTurnstile();
        },
      },
    );
  };

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center py-4 animate-in fade-in duration-300">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">
            {t("auth.forgotPassword.successTitle")}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {t("auth.forgotPassword.successDescription")}
          </p>
        </div>
        <div className="pt-2">
          <Button asChild className="w-full h-11">
            <Link href="/login">{t("auth.forgotPassword.backToLogin")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          {t("auth.forgotPassword.title")}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t("auth.forgotPassword.description")}
        </p>
      </div>

      <form onSubmit={handleForgotPassword} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("auth.forgotPassword.emailLabel")}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              className="pl-10"
              placeholder={t("auth.forgotPassword.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isPending}
            />
          </div>
        </div>

        {/* Cloudflare Turnstile Spam Prevention */}
        {process.env.NEXT_PUBLIC_DISABLE_TURNSTILE !== "true" && (
          <div className="flex justify-center py-2">
            <div ref={turnstileContainerRef} />
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-11"
          disabled={
            isPending ||
            (process.env.NEXT_PUBLIC_DISABLE_TURNSTILE !== "true" &&
              !turnstileToken)
          }
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("auth.forgotPassword.submitting")}
            </>
          ) : (
            t("auth.forgotPassword.submit")
          )}
        </Button>

        <div className="flex justify-center pt-2">
          <Link
            href="/login"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("auth.forgotPassword.backToLogin")}
          </Link>
        </div>
      </form>
    </div>
  );
}
