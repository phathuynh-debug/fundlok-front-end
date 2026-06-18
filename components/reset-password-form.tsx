"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { authenticationService } from "@/services/authentication.service";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { toast } = useToast();
  const { t } = useTranslations();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast({
        variant: "destructive",
        title: t("auth.resetPassword.failedTitle"),
        description: t("auth.resetPassword.invalidToken"),
      });
      return;
    }

    if (password.length < 8) {
      toast({
        variant: "destructive",
        title: t("auth.resetPassword.failedTitle"),
        description: "Password must be at least 8 characters long.",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: t("auth.resetPassword.failedTitle"),
        description: t("auth.resetPassword.passwordMismatch"),
      });
      return;
    }

    setIsPending(true);

    try {
      await authenticationService.resetPassword({
        token,
        new_password: password,
      });

      setIsSuccess(true);
      toast({
        title: t("auth.resetPassword.successTitle"),
        description: t("auth.resetPassword.successDescription"),
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("auth.resetPassword.failedTitle"),
        description: error?.message || t("auth.resetPassword.failedDescription"),
      });
    } finally {
      setIsPending(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-6 text-center py-4 animate-in fade-in duration-300">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">
            {t("auth.resetPassword.failedTitle")}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {t("auth.resetPassword.invalidToken")}
          </p>
        </div>
        <div className="pt-2">
          <Button asChild className="w-full h-11" variant="outline">
            <Link href="/login">{t("auth.forgotPassword.backToLogin")}</Link>
          </Button>
        </div>
      </div>
    );
  }

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
            {t("auth.resetPassword.successTitle")}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {t("auth.resetPassword.successDescription")}
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
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
          {t("auth.resetPassword.title")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t("auth.resetPassword.description")}
        </p>
      </div>

      <form onSubmit={handleResetPassword} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">{t("auth.resetPassword.passwordLabel")}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              className="px-10"
              placeholder={t("auth.resetPassword.passwordPlaceholder")}
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
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t("auth.resetPassword.confirmPasswordLabel")}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              className="px-10"
              placeholder={t("auth.resetPassword.confirmPasswordPlaceholder")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isPending}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full h-11" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("auth.resetPassword.submitting")}
            </>
          ) : (
            t("auth.resetPassword.submit")
          )}
        </Button>
      </form>
    </div>
  );
}
