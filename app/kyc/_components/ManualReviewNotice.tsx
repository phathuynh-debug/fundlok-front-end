"use client";

import { Clock } from "lucide-react";

import { useVerificationMode } from "@/hooks/use-gverify";
import { useTranslations } from "@/lib/i18n";

// Shown above a KYC/KYB capture form while a system admin has switched
// verification to MANUAL: the submission will wait for a person instead of
// returning a verdict, so the user should know that before uploading.
// Renders nothing in AUTOMATIC mode, while loading, or if the mode can't be
// read — the form itself works the same either way.
export function ManualReviewNotice() {
  const { t } = useTranslations();
  const { data } = useVerificationMode();
  if (data?.mode !== "MANUAL") return null;

  return (
    <p
      role="status"
      className="flex items-start gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-left text-sm leading-relaxed text-foreground"
    >
      <Clock
        className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
        aria-hidden
      />
      <span>{t("kyc.manualModeNotice")}</span>
    </p>
  );
}
