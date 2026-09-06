"use client";

import { Card } from "@/components/ui/card";
import { CheckCircle2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLoanApplicationContext } from "./LoanApplicationContext";
import { LITE_FIGURE_STEPS } from "./lite-grading-fields";

// The "why we need this / how to obtain it" panel shown beside each collection
// step. Content is keyed off the current step.
export function DocumentInfoPanel() {
  const { currentStep, theme, t } = useLoanApplicationContext();

  // Steps 2 and 3 ask for typed figures, so there is no document to obtain.
  // Keeping the "how to obtain it" heading there left the panel telling people
  // to zip 48 VAT files beside a form that accepts no files at all.
  const isFigureStep = LITE_FIGURE_STEPS.includes(currentStep);
  const secondHeading = isFigureStep
    ? t("dashboard.sme.whereToFindThese")
    : t("dashboard.sme.howToObtainIt");

  return (
    <Card className="p-5 bg-muted/40 border border-border/50 rounded-2xl shadow-inner space-y-4">
      <div className="space-y-1">
        <h5 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
          <FileText className={cn("h-4 w-4", theme.accentColor)} />
          {t("dashboard.sme.whyWeNeedThis")}
        </h5>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {t(`dashboard.sme.step${currentStep}Why`)}
        </p>
      </div>

      <div className="space-y-1 pt-3 border-t border-border/40">
        <h5 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
          <CheckCircle2 className={cn("h-4 w-4", theme.accentColor)} />
          {secondHeading}
        </h5>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {t(`dashboard.sme.step${currentStep}How`)}
        </p>
      </div>

      {currentStep === 5 && (
        <div className="pt-2 border-t border-border/40 space-y-2">
          <h6 className="font-bold text-xs text-foreground uppercase tracking-wide">
            {t("dashboard.sme.howToObtainCic")}
          </h6>
          <ul className="space-y-2 text-xs text-muted-foreground">
            {[1, 2, 3, 4].map((n) => (
              <li key={n} className="flex items-start gap-1.5">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-[9px] font-bold text-foreground">
                  {n}
                </span>
                <span>{t(`dashboard.sme.cicStep${n}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
