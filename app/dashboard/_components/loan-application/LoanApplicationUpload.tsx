"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Loader2, AlertCircle, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { IndustryTheme } from "../sme-dashboard-config"
import { useLoanApplication, type DocumentKey } from "./useLoanApplication"
import { DocumentPreviewDialog } from "./DocumentPreviewDialog"
import { StepIndicator } from "./StepIndicator"
import { UploadField } from "./UploadField"
import { DocumentInfoPanel } from "./DocumentInfoPanel"
import { ReviewStep } from "./ReviewStep"

interface LoanApplicationUploadProps {
  loanApplicationId: string
  locale: string
  theme: IndustryTheme
  t: (key: string) => string
}

// Which wizard step collects each document (used by the review "add" links).
const STEP_FOR_DOCUMENT: Record<DocumentKey, number> = {
  companyCharter: 1,
  companyRegistration: 1,
  vatDeclarations: 2,
  financialStatement: 3,
  eInvoiceData: 4,
  cicReport: 5,
}

export function LoanApplicationUpload({ loanApplicationId, locale, theme, t }: LoanApplicationUploadProps) {
  const {
    documents,
    currentStep,
    totalSteps,
    reviewStep,
    isSending,
    isFinalizing,
    isSubmitted,
    canSend,
    uploadedCount,
    totalDocuments,
    documentKeys,
    handleFileChange,
    removeFile,
    retryUpload,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    handleSend,
  } = useLoanApplication({ loanApplicationId, t })

  const busy = isSending || isFinalizing || isSubmitted

  // Locally-staged document currently open in the preview dialog.
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const openPreview = (file: File) => {
    setPreviewFile(file)
    setPreviewOpen(true)
  }

  const stepLabel = (step: number) => {
    if (step === 1) return locale === "vi" ? "Hồ sơ pháp lý" : "Legal Docs"
    if (step === 2) return locale === "vi" ? "Thuế GTGT" : "VAT"
    if (step === 3) return locale === "vi" ? "Báo cáo TC" : "Financials"
    if (step === 4) return locale === "vi" ? "Hóa đơn ĐT" : "E-Invoice"
    if (step === 5) return "CIC"
    return t("dashboard.sme.reviewStepLabel")
  }

  // Shared props for every UploadField on the collection steps.
  const uploadFieldProps = (key: DocumentKey) => ({
    id: key,
    docKey: key,
    doc: documents[key],
    busy,
    locale,
    t,
    onFileChange: handleFileChange,
    onRemove: removeFile,
  })

  return (
    <Card className={cn("p-6 md:p-8 border w-full shadow-md transition-all duration-300", theme.borderColor)}>
      <div className="mb-6 text-center">
        <h3 className="text-2xl font-bold tracking-tight text-foreground">{t("dashboard.sme.submitLoanApplication")}</h3>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-lg mx-auto">{t("dashboard.sme.uploadNecessaryDocuments")}</p>
      </div>

      {/* The form never submits on its own — sending is only triggered by an
          explicit click on the Send button below. */}
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6 mt-6">
        <StepIndicator
          currentStep={currentStep}
          totalSteps={totalSteps}
          reviewStep={reviewStep}
          busy={busy}
          onStepClick={goToStep}
          stepLabel={stepLabel}
        />

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
                <ReviewStep
                  documentKeys={documentKeys}
                  documents={documents}
                  canSend={canSend}
                  busy={busy}
                  isSending={isSending}
                  isFinalizing={isFinalizing}
                  uploadedCount={uploadedCount}
                  totalDocuments={totalDocuments}
                  t={t}
                  onPreview={openPreview}
                  onRetry={retryUpload}
                  onAdd={(key) => goToStep(STEP_FOR_DOCUMENT[key])}
                />
              ) : (
                /* --- Document collection steps (split layout) --- */
                <div className="grid gap-0 md:grid-cols-[1fr_auto_1fr] items-stretch">
                  {/* Left Column: Upload File fields */}
                  <div className="space-y-6 p-4 md:pr-6 flex flex-col justify-center">
                    {currentStep === 1 && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-bold text-foreground">{t("dashboard.sme.step1Title")}</h4>
                        <UploadField {...uploadFieldProps("companyCharter")} label={t("dashboard.sme.companyCharter")} />
                        <div className="border-t border-border/60 my-5" />
                        <UploadField {...uploadFieldProps("companyRegistration")} label={t("dashboard.sme.companyRegistration")} />
                      </div>
                    )}

                    {currentStep === 2 && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-bold text-foreground">{t("dashboard.sme.vatDeclarations")}</h4>
                        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-900/30 flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                          <div className="text-xs sm:text-sm leading-relaxed">
                            <strong className="font-bold text-amber-950 dark:text-amber-100">{t("dashboard.sme.vatDeclarationsHelpTitle")}</strong> {t("dashboard.sme.vatDeclarationsHelpText")}
                          </div>
                        </div>
                        <UploadField {...uploadFieldProps("vatDeclarations")} label={t("dashboard.sme.vatZipLabel")} />
                      </div>
                    )}

                    {currentStep === 3 && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-bold text-foreground">{t("dashboard.sme.annualFinancialStatement")}</h4>
                        <UploadField {...uploadFieldProps("financialStatement")} label={t("dashboard.sme.annualFinancialStatement")} />
                      </div>
                    )}

                    {currentStep === 4 && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-bold text-foreground">{t("dashboard.sme.eInvoiceData")}</h4>
                        <UploadField {...uploadFieldProps("eInvoiceData")} label={t("dashboard.sme.eInvoiceData")} />
                      </div>
                    )}

                    {currentStep === 5 && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-bold text-foreground">{t("dashboard.sme.cicCreditReport")}</h4>
                        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-900/30 flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                          <div className="text-xs sm:text-sm leading-relaxed">
                            {t("dashboard.sme.cicReportHelpText")}
                          </div>
                        </div>
                        <UploadField {...uploadFieldProps("cicReport")} label={t("dashboard.sme.cicCreditReport")} />
                      </div>
                    )}
                  </div>

                  {/* Vertical Divider Line between Upload and Info */}
                  <div className="hidden md:flex flex-col items-center py-4">
                    <div className="w-px h-full bg-gradient-to-b from-transparent via-border to-transparent relative">
                      <motion.div
                        className={cn("absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full shadow-md", theme.pulseColor)}
                        animate={{ top: ["10%", "90%", "10%"], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
                      />
                    </div>
                  </div>

                  {/* Horizontal Divider for mobile */}
                  <div className="md:hidden border-t border-border/40 my-4" />

                  {/* Right Column: Why & How panel */}
                  <div className="space-y-4 p-4 md:pl-6 flex flex-col justify-center">
                    <DocumentInfoPanel currentStep={currentStep} theme={theme} t={t} />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Step navigation actions */}
        <div className="flex justify-between items-center pt-6 border-t border-border/40">
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
                className={cn("text-white gap-2 font-medium px-6 h-10 rounded-lg transition-all border shadow-xs duration-300",
                  isSubmitted ? "bg-emerald-600 hover:bg-emerald-700 border-emerald-500" : "bg-black hover:bg-black/90 dark:bg-white dark:text-black border-transparent"
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
  )
}
