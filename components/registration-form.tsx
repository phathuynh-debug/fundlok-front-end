"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTurnstile } from "@/hooks/use-turnstile";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRegister } from "@/hooks/use-authentication";
import {
  User,
  Mail,
  Lock,
  Phone,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useTranslations } from "@/lib/i18n";

const normalizePhoneNumber = (value: string) =>
  value.trim().replace(/[\s().-]/g, "");

const isValidPhoneNumber = (value: string) => {
  if (!value.trim()) {
    return true;
  }

  const normalized = normalizePhoneNumber(value);

  return (
    /^(?:\+84|84|0)(?:3|5|7|8|9)\d{8}$/.test(normalized) ||
    /^\+?[1-9]\d{7,14}$/.test(normalized)
  );
};

interface RegistrationFormProps {
  // Receives the registered email so the caller can show the verify-email step.
  onSuccess?: (email: string) => void;
}

export function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Cloudflare Turnstile Hook
  const { turnstileToken, turnstileContainerRef, reset: resetTurnstile } = useTurnstile();

  const router = useRouter();
  const { toast } = useToast();
  const { mutate: register, isPending } = useRegister();
  const { t } = useTranslations();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidPhoneNumber(phone)) {
      toast({
        variant: "destructive",
        title: t("auth.register.validationErrorTitle"),
        description: t("auth.register.phoneInvalid"),
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: t("auth.register.validationErrorTitle"),
        description: t("auth.register.passwordMismatch"),
      });
      return;
    }

    if (!turnstileToken) {
      toast({
        variant: "destructive",
        title: t("auth.register.validationErrorTitle"),
        description: "Please complete the security check.",
      });
      return;
    }

    register(
      {
        full_name: fullName,
        email,
        password,
        phone: phone || null,
        turnstile_token: turnstileToken,
      },
      {
        onSuccess: () => {
          toast({
            title: t("auth.register.successTitle"),
            description: t("auth.register.successDescription"),
          });
          // Hand the email to the caller so it can show the verify-email step;
          // fall back to the login page when used without a callback.
          if (onSuccess) {
            setTimeout(() => onSuccess(email), 1200);
          } else {
            setTimeout(() => router.push("/login"), 1200);
          }
        },
        onError: (error) => {
          // Turnstile tokens are single-use: without a reset, every retry
          // re-sends the consumed token and fails verification server-side.
          resetTurnstile();
          toast({
            variant: "destructive",
            title: t("auth.register.failedTitle"),
            description: error?.message || t("auth.register.failedDescription"),
          });
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="fullName">{t("auth.register.fullNameLabel")}</Label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="fullName"
            type="text"
            placeholder={t("auth.register.fullNamePlaceholder")}
            className="pl-10"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t("auth.register.emailLabel")}</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder={t("auth.register.emailPlaceholder")}
            className="pl-10"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">{t("auth.register.phoneLabel")}</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="phone"
            type="tel"
            placeholder={t("auth.register.phonePlaceholder")}
            className="pl-10"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("auth.register.passwordLabel")}</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder={t("auth.register.passwordPlaceholder")}
            className="px-10"
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
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">
          {t("auth.register.confirmPasswordLabel")}
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder={t("auth.register.passwordPlaceholder")}
            className="px-10"
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
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
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
        disabled={
          isPending ||
          !email ||
          !password ||
          !confirmPassword ||
          !fullName ||
          !turnstileToken
        }
        className="w-full h-12 text-base font-medium"
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? t("auth.register.submitting") : t("auth.register.submit")}
      </Button>
    </form>
  );
}
