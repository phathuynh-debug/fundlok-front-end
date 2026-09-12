"use client";

import { Card } from "@/components/ui/card";
import { DocumentGuide } from "@/components/document-guide";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, AlertCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { IndustryTheme } from "../sme-dashboard-config";
import {
  LoanApplicationProvider,
  useLoanApplicationContext,
} from "./LoanApplicationContext";
import { DocumentPreviewDialog } from "./DocumentPreviewDialog";
import { StepIndicator } from "./StepIndicator";
import { UploadField } from "./UploadField";
import { FigureField } from "./FigureField";
import { figureFieldsForStep } from "./lite-grading-fields";
import { DocumentInfoPanel } from "./DocumentInfoPanel";
import { ReviewStep } from "./ReviewStep";

interface LoanApplicationUploadProps {
  loanApplicationId: string;
  locale: string;
  theme: IndustryTheme;
  t: (key: string) => string;
}

// Entry point: wires up the shared wizard state, then renders the wizard. All
// state lives in the provider, so the inner components read it via context
// instead of being handed props.
export function LoanApplicationUpload(props: LoanApplicationUploadProps) {
  return (
    <LoanApplicationProvider {...props}>
      <LoanApplicationWizard />
    </LoanApplicationProvider>
  );
}

function LoanApplicationWizard() {
  const {
    currentStep,
    reviewStep,
    totalSteps,
    busy,
    theme,
    t,
    isSending,
    isFinalizing,
    isSubmitted,
    canSend,
    uploadedCount,
    goToNextStep,
    goToPreviousStep,
    handleSend,
    previewFile,
    previewOpen,
    setPreviewOpen,
  } = useLoanApplicationContext();

  return (
    <Card
      className={cn(
        "p-6 md:p-8 border w-full shadow-md transition-all duration-300",
        theme.borderColor,
      )}
    >
      {/* Top-right rather than beside the title: the heading is centred, and
          a button in that flow would pull it off-centre. */}
      <div className="flex justify-end -mb-4">
        <DocumentGuide />
      </div>

      <div className="mb-6 text-center">
        <h3 className="text-2xl font-bold tracking-tight text-foreground">
          {t("dashboard.sme.submitLoanApplication")}
        </h3>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-lg mx-auto">
          {t("dashboard.sme.uploadNecessaryDocuments")}
        </p>
      </div>

      {/* Shown on every step, not just the review screen: the warning has to
          reach the applicant before they enter anything, not after. */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-left">
        <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
          {t("dashboard.sme.legitInfoNotice")}
        </p>
      </div>

      {/* The form never submits on its own — sending is only triggered by an
          explicit click on the Send button below. */}
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6 mt-6">
        <div data-tour="loan-steps">
          <StepIndicator />
        </div>

        {/* Step content */}
        <div className="relative overflow-hidden min-h-[360px] mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {currentStep === reviewStep ? (
                <ReviewStep />
              ) : (
                /* --- Document collection steps (split layout) --- */
                <div className="grid gap-0 md:grid-cols-[1fr_auto_1fr] items-stretch">
                  {/* Left Column: Upload File fields */}
                  <div
                    className="space-y-6 p-4 md:pr-6 flex flex-col justify-center"
                    data-tour="loan-fields"
                  >
                    {currentStep === 1 && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-bold text-foreground">
                          {t("dashboard.sme.step1Title")}
                        </h4>
                        <UploadField
                          docKey="companyCharter"
                          label={t("dashboard.sme.companyCharter")}
                        />
                        <div className="border-t border-border/60 my-5" />
                        <UploadField
                          docKey="companyRegistration"
                          label={t("dashboard.sme.companyRegistration")}
                        />
                      </div>
                    )}

                    {/* Steps 2-3 are typed figures, not uploads. Rendered from
                        LITE_FIGURE_FIELDS so the field set is data, not markup. */}
                    {currentStep === 2 && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-bold text-foreground">
                          {t("dashboard.sme.lite.revenueTitle")}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {t("dashboard.sme.lite.revenueSubtitle")}
                        </p>
                        <div className="space-y-5">
                          {figureFieldsForStep(2).map((field) => (
                            <FigureField key={field.key} field={field} />
                          ))}
                        </div>
                      </div>
                    )}

                    {currentStep === 3 && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-bold text-foreground">
                          {t("dashboard.sme.lite.costsTitle")}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {t("dashboard.sme.lite.costsSubtitle")}
                        </p>
                        <div className="space-y-5">
                          {figureFieldsForStep(3).map((field) => (
                            <FigureField key={field.key} field={field} />
                          ))}
                        </div>
                      </div>
                    )}

                    {currentStep === 4 && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-bold text-foreground">
                          {t("dashboard.sme.eInvoiceData")}
                        </h4>
                        <UploadField
                          docKey="eInvoiceData"
                          label={t("dashboard.sme.eInvoiceData")}
                        />
                      </div>
                    )}

                    {currentStep === 5 && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-bold text-foreground">
                          {t("dashboard.sme.cicCreditReport")}
                        </h4>
                        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-900/30 flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                          <div className="text-xs sm:text-sm leading-relaxed">
                            {t("dashboard.sme.cicReportHelpText")}
                          </div>
                        </div>
                        <UploadField
                          docKey="cicReport"
                          label={t("dashboard.sme.cicCreditReport")}
                        />
                      </div>
                    )}
                  </div>

                  {/* Vertical Divider Line between Upload and Info */}
                  <div className="hidden md:flex flex-col items-center py-4">
                    <div className="w-px h-full bg-gradient-to-b from-transparent via-border to-transparent relative">
                      <motion.div
                        className={cn(
                          "absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full shadow-md",
                          theme.pulseColor,
                        )}
                        animate={{
                          top: ["10%", "90%", "10%"],
                          opacity: [0.4, 1, 0.4],
                        }}
                        transition={{
                          duration: 3,
                          ease: "easeInOut",
                          repeat: Infinity,
                        }}
                      />
                    </div>
                  </div>

                  {/* Horizontal Divider for mobile */}
                  <div className="md:hidden border-t border-border/40 my-4" />

                  {/* Right Column: Why & How panel */}
                  <div className="space-y-4 p-4 md:pl-6 flex flex-col justify-center">
                    <div data-tour="loan-info">
                      <DocumentInfoPanel />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Step navigation actions */}
        <div
          className="flex justify-between items-center pt-6 border-t border-border/40"
          data-tour="loan-actions"
        >
          <Button
            type="button"
            variant="outline"
            disabled={currentStep === 1 || busy}
            onClick={goToPreviousStep}
            className="px-5 h-10 font-semibold"
          >
            {t("dashboard.sme.backBtn")}
          </Button>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-medium">
              {t("dashboard.sme.stepIndicator")
                .replace("{current}", String(currentStep))
                .replace("{total}", String(totalSteps))}
            </span>

            {currentStep < reviewStep ? (
              <Button
                type="button"
                onClick={goToNextStep}
                className="bg-black hover:bg-black/90 dark:bg-white dark:text-black text-white px-6 h-10 font-semibold shadow-xs"
              >
                {t("dashboard.sme.nextBtn")}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSend}
                disabled={isSending || isFinalizing || isSubmitted || !canSend}
                className={cn(
                  "text-white gap-2 font-medium px-6 h-10 rounded-lg transition-all border shadow-xs duration-300",
                  isSubmitted
                    ? "bg-emerald-600 hover:bg-emerald-700 border-emerald-500"
                    : "bg-black hover:bg-black/90 dark:bg-white dark:text-black border-transparent",
                )}
              >
                {isSubmitted ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-100" />
                    {t("dashboard.sme.applicationSubmitted")}
                  </>
                ) : isFinalizing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("dashboard.sme.finalizing")}
                  </>
                ) : isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("dashboard.sme.sending")}
                  </>
                ) : uploadedCount > 0 ? (
                  <>
                    <Send className="h-4 w-4" />
                    {t("dashboard.sme.resumeSending")}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {t("dashboard.sme.sendDocuments")}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>

      <DocumentPreviewDialog
        file={previewFile}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        t={t}
      />
    </Card>
  );
}
