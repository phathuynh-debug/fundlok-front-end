"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Link from "next/link";

import Logo from "@/components/logo";
import { RegistrationForm } from "@/components/registration-form";
import { VerifyEmailNotice } from "@/components/verify-email-notice";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useTranslations } from "@/lib/i18n";

export function RegisterClient() {
  const { t } = useTranslations();
  const router = useRouter();
  // Once set, the verify-email step replaces the form in the same card.
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-6">
      {/* bg-card, not bg-white: a hardcoded white surface stays white in dark
          mode and takes its foreground text with it. */}
      <div className="w-full max-w-md space-y-6 bg-card text-card-foreground p-8 rounded-xl shadow-lg border border-border">
        {/* The brand mark doubles as the way back to the site. This screen had
            no internal links at all — a dead end for anyone who changed their
            mind, and a page with no outbound links for a crawler. */}
        <div className="flex items-center justify-between gap-4">
          <Link href="/" aria-label={t("common.backToHome")}>
            <Logo
              alt={t("common.brandName")}
              containerClassName="relative w-32 h-8"
            />
          </Link>
          <LocaleSwitcher />
        </div>

        {registeredEmail ? (
          <VerifyEmailNotice
            email={registeredEmail}
            onBackToLogin={() => router.push("/login")}
          />
        ) : (
          <>
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tight">
                {t("common.createAnAccount")}
              </h1>
              <p className="text-muted-foreground">
                {t("auth.hero.description")}
              </p>
            </div>

            {/* An H2 under the page's single H1: the page had a heading and
                then a wall of inputs, with no structure between them. */}
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("auth.switcher.registerSectionTitle")}
            </h2>

            {/* Main registration logic component */}
            <RegistrationForm
              onSuccess={(email) => setRegisteredEmail(email)}
            />

            <p className="text-center text-sm text-muted-foreground">
              {t("auth.switcher.alreadyHaveAccount")}{" "}
              <Link
                href="/login"
                className="font-semibold text-primary hover:underline"
              >
                {t("auth.switcher.signIn")}
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
