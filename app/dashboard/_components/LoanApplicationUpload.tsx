"use client"

import { Card } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Upload, FileText, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { IndustryTheme } from "./sme-dashboard-config"
import { useLoanApplication, type DocumentFiles } from "./useLoanApplication"

interface LoanApplicationUploadProps {
  projectId: string
  locale: string
  theme: IndustryTheme
  t: (key: string) => string
}

export function LoanApplicationUpload({ projectId, locale, theme, t }: LoanApplicationUploadProps) {
  const {
    files,
    currentStep,
    isSubmitting,
    isSubmitted,
    handleFileChange,
    removeFile,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    handleSubmit,
  } = useLoanApplication({ projectId, t })

  const renderUploadField = (
    id: string,
    key: keyof DocumentFiles,
    label: string,
    required: boolean = true,
    accept: string = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
  ) => {
    const file = files[key];
    return (
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground flex items-center gap-1">
          {label}
          {required && <span className="text-destructive font-bold">*</span>}
        </label>
        <div
          onClick={() => document.getElementById(id)?.click()}
          className={cn(
            "border border-dashed rounded-xl p-4 flex flex-col sm:flex-row items-center justify-center gap-3 cursor-pointer transition-all duration-200",
            file
              ? "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/10 hover:bg-emerald-500/10"
              : "border-border hover:border-primary/50 hover:bg-accent/40 bg-muted/20"
          )}
        >
          <input
            type="file"
            id={id}
            className="hidden"
            onChange={(e) => handleFileChange(key, e)}
            accept={accept}
          />
          {file ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="text-center sm:text-left min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-destructive hover:bg-destructive/10"
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

  return (
    <Card className={cn("p-6 md:p-8 border w-full shadow-md transition-all duration-300", theme.borderColor)}>
      <div className="mb-6 text-center">
        <h3 className="text-2xl font-bold tracking-tight text-foreground">{t("dashboard.sme.submitLoanApplication")}</h3>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-lg mx-auto">{t("dashboard.sme.uploadNecessaryDocuments")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 mt-6">
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
                  animate={{ width: `${((currentStep - 1) / 4) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
                {/* Animated glow pulse on the progress tip */}
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/30 dark:bg-white/30 blur-md"
                  initial={{ left: "0%" }}
                  animate={{ left: `${((currentStep - 1) / 4) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              </div>
            </div>

            {[1, 2, 3, 4, 5].map((step) => {
              const isActive = step === currentStep;
              const isCompleted = step < currentStep;
              return (
                <div key={step} className="flex flex-col items-center space-y-2.5 relative" style={{ zIndex: 3 }}>
                  <button
                    type="button"
                    onClick={() => goToStep(step)}
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 border-2 bg-background",
                      isActive
                        ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white scale-110 shadow-lg ring-4 ring-black/10 dark:ring-white/10"
                        : isCompleted
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                          : "text-muted-foreground border-border hover:border-muted-foreground"
                    )}
                  >
                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : step}
                  </button>
                  <span className={cn(
                    "text-[10px] sm:text-xs font-semibold text-center max-w-[80px] sm:max-w-[120px] transition-colors duration-200",
                    isActive ? "text-foreground font-bold" : "text-muted-foreground"
                  )}>
                    {step === 1 && (locale === 'vi' ? 'Hồ sơ pháp lý' : 'Legal Docs')}
                    {step === 2 && (locale === 'vi' ? 'Thuế GTGT' : 'VAT')}
                    {step === 3 && (locale === 'vi' ? 'Báo cáo TC' : 'Financials')}
                    {step === 4 && (locale === 'vi' ? 'Hóa đơn ĐT' : 'E-Invoice')}
                    {step === 5 && (locale === 'vi' ? 'CIC' : 'CIC')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Split layout: Upload on Left | Divider | Info on Right */}
        <div className="relative overflow-hidden min-h-[360px] mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="grid gap-0 md:grid-cols-[1fr_auto_1fr] items-stretch"
            >
              {/* Left Column: Upload File Buttons */}
              <div className="space-y-6 p-4 md:pr-6 flex flex-col justify-center">
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-foreground">
                      {t("dashboard.sme.step1Title")}
                    </h4>
                    {renderUploadField("companyCharter", "companyCharter", t("dashboard.sme.companyCharter"), true, ".pdf,.doc,.docx,.jpg,.jpeg,.png")}

                    {/* Divider between upload fields */}
                    <div className="border-t border-border/60 my-5" />

                    {renderUploadField("companyRegistration", "companyRegistration", t("dashboard.sme.companyRegistration"), true, ".pdf,.doc,.docx,.jpg,.jpeg,.png")}
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-foreground">
                      {t("dashboard.sme.vatDeclarations")}
                    </h4>
                    {/* Yellow/Amber Warning Alert Box */}
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-900/30 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                      <div className="text-xs sm:text-sm leading-relaxed">
                        <strong className="font-bold text-amber-950 dark:text-amber-100">{t("dashboard.sme.vatDeclarationsHelpTitle")}</strong> {t("dashboard.sme.vatDeclarationsHelpText")}
                      </div>
                    </div>
                    {renderUploadField("vatDeclarations", "vatDeclarations", t("dashboard.sme.vatZipLabel"), true, ".zip")}
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-foreground">
                      {t("dashboard.sme.annualFinancialStatement")}
                    </h4>
                    {renderUploadField("financialStatement", "financialStatement", t("dashboard.sme.annualFinancialStatement"), true, ".pdf,.doc,.docx,.jpg,.jpeg,.png")}
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-foreground">
                      {t("dashboard.sme.eInvoiceData")}
                    </h4>
                    {renderUploadField("eInvoiceData", "eInvoiceData", t("dashboard.sme.eInvoiceData"), true, ".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip")}
                  </div>
                )}

                {currentStep === 5 && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-foreground">
                      {t("dashboard.sme.cicCreditReport")}
                    </h4>
                    {/* Yellow/Amber Warning Alert Box */}
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-900/30 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                      <div className="text-xs sm:text-sm leading-relaxed">
                        {t("dashboard.sme.cicReportHelpText")}
                      </div>
                    </div>
                    {renderUploadField("cicReport", "cicReport", t("dashboard.sme.cicCreditReport"), true, ".pdf")}
                  </div>
                )}
              </div>

              {/* Vertical Divider Line between Upload and Info */}
              <div className="hidden md:flex flex-col items-center py-4">
                <div className="w-px h-full bg-gradient-to-b from-transparent via-border to-transparent relative">
                  {/* Animated glowing dot on divider */}
                  <motion.div
                    className={cn("absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full shadow-md", theme.pulseColor)}
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

                  {/* Render the obtain steps list specifically for Step 5 */}
                  {currentStep === 5 && (
                    <div className="pt-2 border-t border-border/40 space-y-2">
                      <h6 className="font-bold text-xs text-foreground uppercase tracking-wide">
                        {t("dashboard.sme.howToObtainCic")}
                      </h6>
                      <ul className="space-y-2 text-xs text-muted-foreground">
                        <li className="flex items-start gap-1.5">
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-[9px] font-bold text-foreground">1</span>
                          <span>{t("dashboard.sme.cicStep1")}</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-[9px] font-bold text-foreground">2</span>
                          <span>{t("dashboard.sme.cicStep2")}</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-[9px] font-bold text-foreground">3</span>
                          <span>{t("dashboard.sme.cicStep3")}</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-[9px] font-bold text-foreground">4</span>
                          <span>{t("dashboard.sme.cicStep4")}</span>
                        </li>
                      </ul>
                    </div>
                  )}
                </Card>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Step navigation actions */}
        <div className="flex justify-between items-center pt-6 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            disabled={currentStep === 1 || isSubmitting || isSubmitted}
            onClick={goToPreviousStep}
            className="px-5 h-10 font-semibold"
          >
            {t("dashboard.sme.backBtn")}
          </Button>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-medium">
              {t("dashboard.sme.stepIndicator")
                .replace("{current}", String(currentStep))
                .replace("{total}", "5")}
            </span>

            {currentStep < 5 ? (
              <Button
                type="button"
                onClick={goToNextStep}
                className="bg-black hover:bg-black/90 dark:bg-white dark:text-black text-white px-6 h-10 font-semibold shadow-xs"
              >
                {t("dashboard.sme.nextBtn")}
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting || isSubmitted}
                className={cn("text-white gap-2 font-medium px-6 h-10 rounded-lg transition-all border shadow-xs duration-300",
                  isSubmitted ? "bg-emerald-600 hover:bg-emerald-700 border-emerald-500" : "bg-black hover:bg-black/90 dark:bg-white dark:text-black border-transparent"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("dashboard.sme.submittingApplication")}
                  </>
                ) : isSubmitted ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-100" />
                    {t("dashboard.sme.applicationSubmitted")}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 animate-bounce duration-[2000ms]" />
                    {t("dashboard.sme.submitApplication")}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Card>
  );
}
