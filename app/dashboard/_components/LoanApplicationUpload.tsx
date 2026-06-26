"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Upload, FileText, Loader2, AlertCircle, RotateCcw, Send, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { IndustryTheme } from "./sme-dashboard-config"
import {
  useLoanApplication,
  acceptForDocument,
  maxSizeMbForDocument,
  type DocumentKey,
} from "./useLoanApplication"
import { DocumentPreviewDialog, isPreviewable } from "./DocumentPreviewDialog"

interface LoanApplicationUploadProps {
  loanApplicationId: string
  locale: string
  theme: IndustryTheme
  t: (key: string) => string
}

// Review-list label per document (reuses the existing per-step strings).
const DOCUMENT_LABEL_KEYS: Record<DocumentKey, string> = {
  companyCharter: "dashboard.sme.companyCharter",
  companyRegistration: "dashboard.sme.companyRegistration",
  vatDeclarations: "dashboard.sme.vatDeclarations",
  financialStatement: "dashboard.sme.annualFinancialStatement",
  eInvoiceData: "dashboard.sme.eInvoiceData",
  cicReport: "dashboard.sme.cicCreditReport",
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

  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const openPreview = (file: File) => {
    setPreviewFile(file)
    setPreviewOpen(true)
  }

  const renderUploadField = (
    id: string,
    key: DocumentKey,
    label: string,
    required: boolean = true
  ) => {
    const doc = documents[key];
    const { file, status, progress, error } = doc;
    return (
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground flex items-center gap-1">
          {label}
          {required && <span className="text-destructive font-bold">*</span>}
          <span className="ml-auto text-[10px] font-normal text-muted-foreground">
            {t("dashboard.sme.maxFileSizeHint").replace("{maxSize}", String(maxSizeMbForDocument(key)))}
          </span>
        </label>
        <div
          onClick={() => {
            if (status !== "uploading" && !busy) document.getElementById(id)?.click()
          }}
          className={cn(
            "border border-dashed rounded-xl p-4 flex flex-col sm:flex-row items-center justify-center gap-3 transition-all duration-200",
            status === "uploading" && "border-primary/50 bg-accent/30 cursor-wait",
            status === "uploaded" && "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/10 cursor-default",
            status === "error" && "border-destructive/60 bg-destructive/5 hover:bg-destructive/10 cursor-pointer",
            status === "ready" && "border-primary/40 bg-primary/5 hover:bg-primary/10 cursor-pointer",
            status === "idle" && "border-border hover:border-primary/50 hover:bg-accent/40 bg-muted/20 cursor-pointer"
          )}
        >
          <input
            type="file"
            id={id}
            className="hidden"
            onChange={(e) => handleFileChange(key, e)}
            accept={acceptForDocument(key)}
          />
          {status === "uploading" && file ? (
            <>
              <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
              <div className="text-center sm:text-left min-w-0 flex-1 space-y-1.5">
                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("dashboard.sme.uploadingFile").replace("{percent}", String(progress))}
                </p>
              </div>
            </>
          ) : status === "uploaded" && file ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="text-center sm:text-left min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB · {t("dashboard.sme.uploadComplete")}
                </p>
              </div>
            </>
          ) : status === "error" && file ? (
            <>
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              <div className="text-center sm:text-left min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                <p className="text-xs text-destructive">{error}</p>
              </div>
            </>
          ) : status === "ready" && file ? (
            <>
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <div className="text-center sm:text-left min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB · {t("dashboard.sme.readyToSend")}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-destructive hover:bg-destructive/10"
                disabled={busy}
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(key);
                }}
              >
                {locale === 'vi' ? 'Xoá' : 'Remove'}
              </Button>
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 text-muted-foreground animate-pulse" />
              <span className="text-sm font-medium text-muted-foreground">
                {t("dashboard.sme.clickToUpload")}
              </span>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderReviewRow = (key: DocumentKey) => {
    const { file, status, progress, error } = documents[key]
    const label = t(DOCUMENT_LABEL_KEYS[key])
    return (
      <div
        key={key}
        className={cn(
          "flex items-center gap-3 rounded-xl border p-3.5 transition-colors",
          status === "uploaded" && "border-emerald-500/40 bg-emerald-500/5",
          status === "uploading" && "border-primary/40 bg-primary/5",
          status === "error" && "border-destructive/50 bg-destructive/5",
          (status === "ready" || status === "idle") && "border-border bg-muted/20"
        )}
      >
        <div className="shrink-0">
          {status === "uploaded" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          ) : status === "uploading" ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : status === "error" ? (
            <AlertCircle className="h-5 w-5 text-destructive" />
          ) : file ? (
            <FileText className="h-5 w-5 text-muted-foreground" />
          ) : (
            <AlertCircle className="h-5 w-5 text-muted-foreground/60" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">{label}</p>
          {file ? (
            <p className="text-xs text-muted-foreground truncate">
              {file.name} · {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">{t("dashboard.sme.notSelectedYet")}</p>
          )}
          {status === "uploading" && (
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          {status === "error" && error && (
            <p className="mt-0.5 text-xs text-destructive">{error}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {file && isPreviewable(file) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => openPreview(file)}
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("dashboard.sme.preview")}</span>
            </Button>
          )}
          {status === "uploaded" ? (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {t("dashboard.sme.sentStatus")}
            </span>
          ) : status === "uploading" ? (
            <span className="text-xs font-medium text-muted-foreground">{progress}%</span>
          ) : status === "error" ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              disabled={isSending || isFinalizing}
              onClick={() => retryUpload(key)}
            >
              <RotateCcw className="h-3 w-3" />
              {t("dashboard.sme.retryUpload")}
            </Button>
          ) : !file ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              disabled={busy}
              onClick={() => goToStep(reviewStepSourceFor(key))}
            >
              {t("dashboard.sme.clickToUpload")}
            </Button>
          ) : (
            <span className="text-xs font-medium text-muted-foreground">
              {t("dashboard.sme.readyToSend")}
            </span>
          )}
        </div>
      </div>
    )
  }

  // Maps a document back to the wizard step that collects it (for "add" links).
  const reviewStepSourceFor = (key: DocumentKey): number => {
    const map: Record<DocumentKey, number> = {
      companyCharter: 1,
      companyRegistration: 1,
      vatDeclarations: 2,
      financialStatement: 3,
      eInvoiceData: 4,
      cicReport: 5,
    }
    return map[key]
  }

  const stepLabel = (step: number) => {
    if (step === 1) return locale === 'vi' ? 'Hồ sơ pháp lý' : 'Legal Docs'
    if (step === 2) return locale === 'vi' ? 'Thuế GTGT' : 'VAT'
    if (step === 3) return locale === 'vi' ? 'Báo cáo TC' : 'Financials'
    if (step === 4) return locale === 'vi' ? 'Hóa đơn ĐT' : 'E-Invoice'
    if (step === 5) return 'CIC'
    return t("dashboard.sme.reviewStepLabel")
  }

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <Card className={cn("p-6 md:p-8 border w-full shadow-md transition-all duration-300", theme.borderColor)}>
      <div className="mb-6 text-center">
        <h3 className="text-2xl font-bold tracking-tight text-foreground">{t("dashboard.sme.submitLoanApplication")}</h3>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-lg mx-auto">{t("dashboard.sme.uploadNecessaryDocuments")}</p>
      </div>

      <form onSubmit={onFormSubmit} className="space-y-6 mt-6">
        {/* Elegant Step Indicator Bar with connecting line */}
        <div className="mb-8 pt-2">
          <div className="flex items-center justify-between relative">
            {/* Background connector line (full width, gray) */}
            <div className="absolute top-[18px] left-0 right-0 h-[2px] -translate-y-1/2 pointer-events-none" style={{ zIndex: 1 }}>
              <div className="mx-[18px] h-full bg-border rounded-full" />
            </div>
            {/* Active progress connector line with animated fill + glow */}
            <div className="absolute top-[18px] left-0 right-0 h-[2px] -translate-y-1/2 pointer-events-none" style={{ zIndex: 2 }}>
              <div className="mx-[18px] h-full relative overflow-hidden rounded-full">
                <motion.div
                  className="h-full bg-black dark:bg-white absolute left-0 top-0"
                  initial={{ width: "0%" }}
                  animate={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
                {/* Animated glow pulse on the progress tip */}
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/30 dark:bg-white/30 blur-md"
                  initial={{ left: "0%" }}
                  animate={{ left: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              </div>
            </div>

            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
              const isActive = step === currentStep;
              const isCompleted = step < currentStep;
              const isReviewStep = step === reviewStep;
              return (
                <div key={step} className="flex flex-col items-center space-y-2.5 relative" style={{ zIndex: 3 }}>
                  <button
                    type="button"
                    onClick={() => goToStep(step)}
                    disabled={busy}
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 border-2 bg-background disabled:cursor-not-allowed",
                      isActive
                        ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white scale-110 shadow-lg ring-4 ring-black/10 dark:ring-white/10"
                        : isCompleted
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                          : "text-muted-foreground border-border hover:border-muted-foreground"
                    )}
                  >
                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : isReviewStep ? <Send className="h-4 w-4" /> : step}
                  </button>
                  <span className={cn(
                    "text-[10px] sm:text-xs font-semibold text-center max-w-[80px] sm:max-w-[120px] transition-colors duration-200",
                    isActive ? "text-foreground font-bold" : "text-muted-foreground"
                  )}>
                    {stepLabel(step)}
                  </span>
                </div>
              );
            })}
          </div>
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
                /* --- Review & send --- */
                <div className="mx-auto max-w-2xl space-y-5 p-2">
                  <div className="text-center space-y-1.5">
                    <h4 className="text-lg font-bold text-foreground">{t("dashboard.sme.reviewTitle")}</h4>
                    <p className="text-sm text-muted-foreground">{t("dashboard.sme.reviewSubtitle")}</p>
                  </div>

                  {(isSending || isFinalizing || uploadedCount > 0) && (
                    <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-2.5">
                      <span className="text-sm font-medium text-foreground">
                        {t("dashboard.sme.sendProgress")
                          .replace("{done}", String(uploadedCount))
                          .replace("{total}", String(totalDocuments))}
                      </span>
                      <div className="h-1.5 w-32 overflow-hidden rounded-full bg-border">
                        <motion.div
                          className="h-full rounded-full bg-emerald-500"
                          animate={{ width: `${(uploadedCount / totalDocuments) * 100}%` }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2.5">
                    {documentKeys.map((key) => renderReviewRow(key))}
                  </div>

                  <p className="text-center text-xs text-muted-foreground">
                    {canSend ? t("dashboard.sme.reviewAllReadyHint") : t("dashboard.sme.reviewMissingHint")}
                  </p>
                </div>
              ) : (
                /* --- Document collection steps (split layout) --- */
                <div className="grid gap-0 md:grid-cols-[1fr_auto_1fr] items-stretch">
                  {/* Left Column: Upload File Buttons */}
                  <div className="space-y-6 p-4 md:pr-6 flex flex-col justify-center">
                    {currentStep === 1 && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-bold text-foreground">
                          {t("dashboard.sme.step1Title")}
                        </h4>
                        {renderUploadField("companyCharter", "companyCharter", t("dashboard.sme.companyCharter"))}
                        <div className="border-t border-border/60 my-5" />
                        {renderUploadField("companyRegistration", "companyRegistration", t("dashboard.sme.companyRegistration"))}
                      </div>
                    )}

                    {currentStep === 2 && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-bold text-foreground">
                          {t("dashboard.sme.vatDeclarations")}
                        </h4>
                        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-900/30 flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                          <div className="text-xs sm:text-sm leading-relaxed">
                            <strong className="font-bold text-amber-950 dark:text-amber-100">{t("dashboard.sme.vatDeclarationsHelpTitle")}</strong> {t("dashboard.sme.vatDeclarationsHelpText")}
                          </div>
                        </div>
                        {renderUploadField("vatDeclarations", "vatDeclarations", t("dashboard.sme.vatZipLabel"))}
                      </div>
                    )}

                    {currentStep === 3 && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-bold text-foreground">
                          {t("dashboard.sme.annualFinancialStatement")}
                        </h4>
                        {renderUploadField("financialStatement", "financialStatement", t("dashboard.sme.annualFinancialStatement"))}
                      </div>
                    )}

                    {currentStep === 4 && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-bold text-foreground">
                          {t("dashboard.sme.eInvoiceData")}
                        </h4>
                        {renderUploadField("eInvoiceData", "eInvoiceData", t("dashboard.sme.eInvoiceData"))}
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
                        {renderUploadField("cicReport", "cicReport", t("dashboard.sme.cicCreditReport"))}
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
                    <Card className="p-5 bg-muted/40 border border-border/50 rounded-2xl shadow-inner space-y-4">
                      <div className="space-y-1">
                        <h5 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
                          <FileText className={cn("h-4 w-4", theme.accentColor)} />
                          {t("dashboard.sme.whyWeNeedThis")}
                        </h5>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          {currentStep === 1 && t("dashboard.sme.step1Why")}
                          {currentStep === 2 && t("dashboard.sme.step2Why")}
                          {currentStep === 3 && t("dashboard.sme.step3Why")}
                          {currentStep === 4 && t("dashboard.sme.step4Why")}
                          {currentStep === 5 && t("dashboard.sme.step5Why")}
                        </p>
                      </div>

                      <div className="space-y-1 pt-3 border-t border-border/40">
                        <h5 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
                          <CheckCircle2 className={cn("h-4 w-4", theme.accentColor)} />
                          {t("dashboard.sme.howToObtainIt")}
                        </h5>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          {currentStep === 1 && t("dashboard.sme.step1How")}
                          {currentStep === 2 && t("dashboard.sme.step2How")}
                          {currentStep === 3 && t("dashboard.sme.step3How")}
                          {currentStep === 4 && t("dashboard.sme.step4How")}
                          {currentStep === 5 && t("dashboard.sme.step5How")}
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
                                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-[9px] font-bold text-foreground">{n}</span>
                                <span>{t(`dashboard.sme.cicStep${n}`)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Card>
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
  );
}
