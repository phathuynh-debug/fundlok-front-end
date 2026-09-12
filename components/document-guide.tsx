"use client";

import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TourOverlay } from "@/components/product-tour";
import { useTourEngine } from "@/hooks/use-tour-engine";
import { DOCUMENT_GUIDE_STEPS } from "@/lib/constants/tour-steps";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { CONTROL_HOVER } from "@/lib/ui-tokens";

/**
 * "What is this form?" — the walkthrough for the SME document-submission
 * wizard, plus the button that opens it.
 *
 * On demand only, and with no persistence at all: it is not onboarding, it is
 * a reference an applicant can reach for at any point, so there is nothing to
 * remember about whether they have seen it. That also keeps it entirely
 * frontend — no account column, no endpoint.
 *
 * Button and overlay ship together because nothing else opens this one.
 */
export function DocumentGuide() {
  const { t } = useTranslations();
  const engine = useTourEngine();
  const label = t("dashboard.documentGuide.open");

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => engine.open(DOCUMENT_GUIDE_STEPS)}
        aria-label={label}
        className={cn("gap-1.5 text-xs font-medium", CONTROL_HOVER)}
      >
        <HelpCircle className="h-4 w-4" />
        <span className="hidden sm:inline">{label}</span>
      </Button>

      <TourOverlay
        tour={{ ...engine, dismiss: engine.close }}
        i18nBase="dashboard.documentGuide"
      />
    </>
  );
}
