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
    kybCertificate,
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
                        {/* Already on file from KYB — reused rather than
                            re-collected, so the application cannot end up with
                            a different certificate from the verified one. */}
                        {kybCertificate ? (
                          <ReusedDocumentField
                            label={t("dashboard.sme.companyRegistration")}
                            url={kybCertificate.url}
                          />
                        ) : (
                          <UploadField
                            docKey="companyRegistration"
                            label={t("dashboard.sme.companyRegistration")}
                          />
                        )}
                      </div>
                    )}

                    {/* Step 2: the e-invoice zip is the revenue evidence, and
                        the revenue figures are read out of it (locked while it
                        is attached). Figures are rendered from
                        LITE_FIGURE_FIELDS so the field set is data, not markup. */}
                    {currentStep === 2 && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-bold text-foreground">
                          {t("dashboard.sme.lite.revenueTitle")}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {t("dashboard.sme.lite.revenueSubtitle")}
                        </p>
                        <UploadField
                          docKey="eInvoiceData"
                          label={t("dashboard.sme.eInvoiceData")}
                        />
                        <EInvoiceReadout />
                        <div className="space-y-5">
                          {figureFieldsForStep(2).map((field) => (
                            <FigureField key={field.key} field={field} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Step 3: the tax filings fill cost of goods sold and
                        owner withdrawal (locked); the customer shares come from
                        step 2's invoices; fixed and variable cost are typed,
                        with the statement's admin/selling lines as hints. */}
                    {currentStep === 3 && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-bold text-foreground">
                          {t("dashboard.sme.lite.costsTitle")}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {t("dashboard.sme.lite.costsSubtitle")}
                        </p>
                        <UploadField
                          docKey="taxFilings"
                          label={t("dashboard.sme.taxFilings")}
                        />
                        <TaxFilingsReadout />
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
                        <CicReadout />
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

/**
 * A document requirement already met by an earlier step.
 *
 * Deliberately offers no Remove: the SME cannot detach the certificate their
 * KYB verdict was based on from inside the loan wizard. The preview link is a
 * presigned URL that expires in ten minutes, which is why it is read from the
 * query each time the panel renders rather than being held in state.
 */
function ReusedDocumentField({ label, url }: { label: string; url: string }) {
  const { t } = useLoanApplicationContext();
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">
          {t("dashboard.sme.reusedFromKyb")}
        </span>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
        <CheckCircle2
          className="h-4 w-4 shrink-0 text-emerald-600"
          aria-hidden
        />
        <span className="flex-1 truncate text-sm text-muted-foreground">
          {t("dashboard.sme.reusedFromKybHint")}
        </span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-sm font-medium text-primary underline underline-offset-4"
        >
          {t("dashboard.sme.viewDocument")}
        </a>
      </div>
    </div>
  );
}

/**
 * What the attached e-invoice zip was read as: the months found, or that it
 * is still being read. Shown between the upload and the figures it fills, so
 * the SME sees where the locked numbers came from.
 */
function EInvoiceReadout() {
  const { eInvoicePreview, isReadingEInvoices, t } =
    useLoanApplicationContext();

  if (isReadingEInvoices) {
    return (
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {t("dashboard.sme.eInvoiceReading")}
      </p>
    );
  }
  if (!eInvoicePreview) return null;

  const partial = eInvoicePreview.revenue_last_12m === null;
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5 text-xs leading-relaxed",
        partial
          ? "border-amber-500/40 bg-amber-500/5 text-amber-800 dark:text-amber-200"
          : "border-emerald-500/40 bg-emerald-500/5 text-emerald-800 dark:text-emerald-200",
      )}
    >
      <p className="font-semibold">
        {t("dashboard.sme.eInvoiceReadSummary")
          .replace("{count}", String(eInvoicePreview.months_covered))
          .replace("{start}", eInvoicePreview.period_start)
          .replace("{end}", eInvoicePreview.period_end)}
      </p>
      <p>
        {partial
          ? t("dashboard.sme.eInvoicePartialYear")
          : t("dashboard.sme.eInvoiceFilledFigures")}
      </p>
    </div>
  );
}

/**
 * What the attached tax filings were read as: the fiscal year of the
 * statements and, when the monthly VAT declarations were included, how many
 * months. Mirrors EInvoiceReadout.
 */
function TaxFilingsReadout() {
  const { taxFilingsPreview, isReadingTaxFilings, t } =
    useLoanApplicationContext();

  if (isReadingTaxFilings) {
    return (
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {t("dashboard.sme.taxFilingsReading")}
      </p>
    );
  }
  if (!taxFilingsPreview) return null;

  // A loss year states no owner-withdrawal share, so that field stays typed.
  const noProfit = taxFilingsPreview.owner_withdrawal_pct === null;
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5 text-xs leading-relaxed",
        noProfit
          ? "border-amber-500/40 bg-amber-500/5 text-amber-800 dark:text-amber-200"
          : "border-emerald-500/40 bg-emerald-500/5 text-emerald-800 dark:text-emerald-200",
      )}
    >
      <p className="font-semibold">
        {t("dashboard.sme.taxFilingsReadSummary").replace(
          "{year}",
          String(taxFilingsPreview.fiscal_year),
        )}
        {taxFilingsPreview.vat_months > 0 &&
          ` · ${t("dashboard.sme.taxFilingsVatMonths").replace(
            "{count}",
            String(taxFilingsPreview.vat_months),
          )}`}
      </p>
      <p>
        {noProfit
          ? t("dashboard.sme.taxFilingsNoProfit")
          : t("dashboard.sme.taxFilingsFilledFigures")}
      </p>
    </div>
  );
}

/**
 * What the attached CIC report was read as: CIC's score and rank, when it
 * was scored, and the current debt position. Nothing on step 4 is filled from
 * it; this is so the SME sees what underwriting will see, and catches the
 * wrong report (or a scan) before Send.
 */
function CicReadout() {
  const { cicPreview, isReadingCic, t, locale } = useLoanApplicationContext();

  if (isReadingCic) {
    return (
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {t("dashboard.sme.cicReading")}
      </p>
    );
  }
  if (!cicPreview) return null;

  const has = (code: string) =>
    cicPreview.warnings.some((w) => w.code === code);
  const notes = [
    cicPreview.score === null && t("dashboard.sme.cicNote.NO_SCORE"),
    has("INDIVIDUAL_REPORT") && t("dashboard.sme.cicNote.INDIVIDUAL_REPORT"),
    has("STALE_REPORT") &&
      t("dashboard.sme.cicNote.STALE_REPORT").replace(
        "{days}",
        String(cicPreview.age_days ?? ""),
      ),
    (has("BAD_DEBT") || has("ATTENTION_DEBT") || has("NEGATIVE_HISTORY")) &&
      t("dashboard.sme.cicNote.DEBT_ISSUES"),
  ].filter(Boolean) as string[];

  const formatDate = (iso: string | null) =>
    iso
      ? new Date(`${iso}T00:00:00`).toLocaleDateString(
          locale === "vi" ? "vi-VN" : "en-GB",
        )
      : "—";
  const million = (n: number | null) =>
    n === null
      ? "—"
      : `${n.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")} ${t("dashboard.sme.cicMillionVnd")}`;

  const rows: [string, string][] = [
    [
      t("dashboard.sme.cicScore"),
      cicPreview.score === null ? "—" : String(cicPreview.score),
    ],
    [
      t("dashboard.sme.cicRank"),
      cicPreview.rank === null
        ? "—"
        : `${cicPreview.rank}${
            cicPreview.rank_label
              ? ` · ${t(`dashboard.sme.cicRankLabel.${cicPreview.rank_label}`)}`
              : ""
          }`,
    ],
    [
      t("dashboard.sme.cicPercentile"),
      cicPreview.percentile === null
        ? "—"
        : t("dashboard.sme.cicPercentileValue").replace(
            "{pct}",
            String(cicPreview.percentile),
          ),
    ],
    [t("dashboard.sme.cicScoredOn"), formatDate(cicPreview.scored_on)],
    [
      t("dashboard.sme.cicTotalDebt"),
      million(cicPreview.debt_total_vnd_million),
    ],
  ];

  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5 text-xs leading-relaxed space-y-2",
        notes.length
          ? "border-amber-500/40 bg-amber-500/5 text-amber-800 dark:text-amber-200"
          : "border-emerald-500/40 bg-emerald-500/5 text-emerald-800 dark:text-emerald-200",
      )}
    >
      <p className="font-semibold">{t("dashboard.sme.cicReadSummary")}</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium tabular-nums text-foreground">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      {notes.map((note) => (
        <p key={note}>{note}</p>
      ))}
    </div>
  );
}
