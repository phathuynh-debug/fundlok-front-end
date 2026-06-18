"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTurnstile } from "@/hooks/use-turnstile";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLogin } from "@/app/login/use-login";
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { turnstileToken, turnstileContainerRef } = useTurnstile();

  const { toast } = useToast();
  const { login, googleLogin, isPending, isGooglePending } = useLogin();
  const { t } = useTranslations();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!turnstileToken) {
      toast({
        variant: "destructive",
        title: t("auth.login.failedTitle"),
        description: "Please complete the security check.",
      });
      return;
    }

    login(
      { email, password, turnstile_token: turnstileToken },
      {
        onSuccess: () => {
          toast({
            title: t("auth.login.successTitle"),
            description: t("auth.login.successDescription"),
          });
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: t("auth.login.failedTitle"),
            description: error?.message || t("auth.login.failedDescription"),
          });
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <Button
        type="button"
        onClick={() => googleLogin()}
        disabled={isGooglePending}
        className="w-full h-11 bg-white text-black flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors"
      >
        <svg
          className="mr-3 h-4 w-4"
          viewBox="0 0 533.5 544.3"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            fill="#4285F4"
            d="M533.5 278.4c0-18.5-1.5-37.3-4.7-55.3H272v104.8h147.5c-6.3 34.1-25.1 62.9-53.6 82.2v68.2h86.6c50.7-46.7 80-115.4 80-199.9z"
          />
          <path
            fill="#34A853"
            d="M272 544.3c72.6 0 133.6-23.9 178.2-64.8l-86.6-68.2c-24.1 16.2-55 25.8-91.6 25.8-70 0-129.3-47.2-150.5-110.5H32.3v69.5C76.9 489.5 167.6 544.3 272 544.3z"
          />
          <path
            fill="#FBBC05"
            d="M121.5 325c-10.7-32-10.7-66.2 0-98.2V157.3H32.3c-43 85.4-43 187.2 0 272.6l89.2-69.9z"
          />
          <path
            fill="#EA4335"
            d="M272 109.7c38.8 0 73.6 13.4 101 39l75.7-75.7C405.8 28.2 349.6 0 272 0 167.6 0 76.9 54.8 32.3 137.8l89.2 69.5c21.2-63.3 80.5-110.5 150.5-110.5z"
          />
        </svg>
        <span>{t("auth.login.signInWithGoogle")}</span>
      </Button>

      <div className="flex items-center gap-3">
        <span className="flex-1 h-px bg-border" />
        <span className="text-sm text-muted-foreground">
          {t("auth.login.or")}
        </span>
        <span className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("auth.login.emailLabel")}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              className="pl-10"
              placeholder={t("auth.login.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isPending}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("auth.login.passwordLabel")}</Label>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              className="px-10"
              placeholder={t("auth.login.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isPending}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors"
              >
                {t("auth.login.forgotPassword")}
              </Link>
            </div>
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
          disabled={isPending || !turnstileToken || isGooglePending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("auth.login.submitting")}
            </>
          ) : (
            t("auth.login.submit")
          )}
        </Button>
      </form>
    </div>
  );
}
