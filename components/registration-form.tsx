"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTurnstile } from "@/hooks/use-turnstile";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRegister } from "@/hooks/use-authentication";
import type { UserRole } from "@/services/authentication.service";
import {
  User,
  Mail,
  Lock,
  Phone,
  Building2,
  TrendingUp,
  Check,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useTranslations } from "@/lib/i18n";

type RoleSelection = UserRole | null;

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
  onSuccess?: () => void;
}

export function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<RoleSelection>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Cloudflare Turnstile Hook
  const { turnstileToken, turnstileContainerRef } = useTurnstile();

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

    if (!role) {
      toast({
        variant: "destructive",
        title: t("auth.register.configErrorTitle"),
        description: t("auth.register.selectRole"),
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
        role,
        turnstile_token: turnstileToken,
      },
      {
        onSuccess: () => {
          toast({
            title: t("auth.register.successTitle"),
            description: t("auth.register.successDescription"),
          });
          // Use the switcher callback if available, otherwise navigate
          if (onSuccess) {
            setTimeout(() => onSuccess(), 1200);
          } else {
            setTimeout(() => router.push("/login"), 1200);
          }
        },
        onError: (error) => {
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

      <div className="space-y-3">
        <Label>{t("auth.register.rolePrompt")}</Label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setRole("SME")}
            disabled={isPending}
            className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${role === "SME"
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-muted"
              }`}
          >
            {role === "SME" && (
              <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />
            )}
            <Building2
              className={
                role === "SME" ? "text-primary" : "text-muted-foreground"
              }
            />
            <span className="font-semibold text-sm">
              {t("auth.register.roleSme")}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRole("INVESTOR")}
            disabled={isPending}
            className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${role === "INVESTOR"
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-muted"
              }`}
          >
            {role === "INVESTOR" && (
              <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />
            )}
            <TrendingUp
              className={
                role === "INVESTOR" ? "text-primary" : "text-muted-foreground"
              }
            />
            <span className="font-semibold text-sm">
              {t("auth.register.roleInvestor")}
            </span>
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
          !role ||
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
