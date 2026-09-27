"use client";

import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { AlertCircle, Check, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectLoanApplication } from "@/services/projects.service";
import type { LoanDocumentType } from "@/services/uploads.service";
import type { IndustryTheme } from "../sme-dashboard-config";
import { formatDate } from "@/lib/format-date";
import { ApprovalCelebration, ApprovalSummary } from "./ApprovalSummary";

interface LoanApplicationStatusProps {
  loanApplication: ProjectLoanApplication;
  /** For the approval celebration's greeting. */
  companyName?: string | null;
  locale: string;
  theme: IndustryTheme;
  t: (key: string) => string;
}

// Display order + concise labels for the six expected document types.
const DOCUMENT_LABELS: Record<LoanDocumentType, { en: string; vi: string }> = {
  legal_charter: { en: "Company Charter", vi: "Điều lệ công ty" },
  business_registration: {
    en: "Business Registration",
    vi: "Giấy phép kinh doanh",
  },
  vat_tax_zip: { en: "VAT Declarations", vi: "Tờ khai thuế GTGT" },
  financial_report: { en: "Financial Statement", vi: "Báo cáo tài chính" },
  e_invoice_data: { en: "E-Invoice Data", vi: "Dữ liệu hóa đơn điện tử" },
  cic_report: { en: "CIC Credit Report", vi: "Báo cáo tín dụng CIC" },
  tax_filings: {
    en: "Financial statements & VAT filings",
    vi: "Báo cáo tài chính & tờ khai thuế GTGT",
  },
};

const DOCUMENT_ORDER = Object.keys(DOCUMENT_LABELS) as LoanDocumentType[];

/**
 * What the wizard actually asks for today (`DOCUMENT_TYPES` in
 * useLoanApplication).
 *
 * Steps 2 and 3 became typed figures, so VAT declarations and the annual
 * financial statement are no longer uploaded by anyone. Counting them as
 * expected is what made a complete application report "4/6 received" with two
 * gaps the applicant had no way to close — and it would have put two
 * impossible items at the top of the missing list below.
 */
const EXPECTED_DOCUMENT_TYPES: LoanDocumentType[] = [
  "legal_charter",
  "business_registration",
  "e_invoice_data",
  "tax_filings",
  "cic_report",
];

// DAILY is the only repayment a facility has. The others are kept so
// applications submitted before that was enforced still render a label.
const REPAYMENT_LABELS: Record<string, { en: string; vi: string }> = {
  DAILY: {
    en: "Fixed amount each business day",
    vi: "Khoản cố định mỗi ngày làm việc",
  },
  MONTHLY: { en: "Monthly", vi: "Hàng tháng" },
  QUARTERLY: { en: "Quarterly", vi: "Hàng quý" },
  END_OF_TERM: { en: "End of term", vi: "Cuối kỳ" },
};

type StepState = "done" | "active" | "pending" | "rejected";

/**
 * How a decided application presents itself.
 *
 * Keyed by `loan_applications.status`; anything else (SUBMITTED, UNDER_REVIEW)
 * falls through to the in-progress presentation. The operator's
 * `decision_note` is deliberately NOT shown — it is an internal review note,
 * and the handbook keeps internal reasoning off applicant surfaces. The
 * applicant gets the outcome and a way to ask about it.
 */
const DECIDED_PRESENTATION: Record<
  string,
  {
    titleKey: string;
    subtitleKey: string;
    badgeKey: string;
    noteKey: string;
    finalStep: StepState;
    reasonClass: string;
    badgeClass: string;
    badgeTextClass: string;
    dotClass: string;
  }
> = {
  APPROVED: {
    titleKey: "dashboard.sme.statusApprovedTitle",
    subtitleKey: "dashboard.sme.statusApprovedSubtitle",
    badgeKey: "dashboard.sme.statusApprovedBadge",
    noteKey: "dashboard.sme.statusApprovedNote",
    finalStep: "done",
    reasonClass: "border-emerald-500/30 bg-emerald-500/5",
    badgeClass: "border-emerald-500/30 bg-emerald-500/10",
    badgeTextClass: "text-emerald-700 dark:text-emerald-300",
    dotClass: "bg-emerald-500",
  },
  REJECTED: {
    titleKey: "dashboard.sme.statusRejectedTitle",
    subtitleKey: "dashboard.sme.statusRejectedSubtitle",
    badgeKey: "dashboard.sme.statusRejectedBadge",
    noteKey: "dashboard.sme.statusRejectedNote",
    finalStep: "rejected",
    reasonClass: "border-destructive/30 bg-destructive/5",
    badgeClass: "border-destructive/30 bg-destructive/10",
    badgeTextClass: "text-destructive",
    dotClass: "bg-destructive",
  },
};

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function extOf(filename: string): string {
  const ext = filename.split(".").pop()?.toUpperCase();
  return ext && ext.length <= 4 ? ext : "FILE";
}

export function LoanApplicationStatus({
  loanApplication,
  companyName = null,
  locale,
  theme,
  t,
}: LoanApplicationStatusProps) {
  const isVi = locale === "vi";
  const documents = loanApplication.documents ?? [];
  const receivedByType = new Map(
    documents.map((doc) => [doc.document_type, doc]),
  );

  const repayment = loanApplication.repayment_preference;
  const repaymentLabel = repayment
    ? (REPAYMENT_LABELS[repayment]?.[isVi ? "vi" : "en"] ?? repayment)
    : null;

  const requestedAmount = Number(loanApplication.requested_amount);
  const submittedAt = loanApplication.submitted_at
    ? new Date(loanApplication.submitted_at)
    : null;

  // Anything outside the expected four is still shown when it was actually
  // uploaded — an application that predates the typed-figure steps has a VAT
  // zip on file, and hiding it would tell the applicant we lost it.
  const extraTypes = DOCUMENT_ORDER.filter(
    (type) =>
      !EXPECTED_DOCUMENT_TYPES.includes(type) && receivedByType.has(type),
  );
  const listedTypes = [...EXPECTED_DOCUMENT_TYPES, ...extraTypes];
  const missingTypes = EXPECTED_DOCUMENT_TYPES.filter(
    (type) => !receivedByType.has(type),
  );
  const receivedExpected = EXPECTED_DOCUMENT_TYPES.length - missingTypes.length;

  // This panel used to be hardcoded to "awaiting review" for every status
  // that was not DRAFT, so a decided application kept telling the applicant
  // their documents were still being read. The three outcomes it can now
  // show are the three the backend can put on `status` after submission.
  // An operator approval does not move `status` (it is one half of the
  // two-approval gate); it arrives as `approval`, and the applicant sees the
  // approved presentation from then on.
  const approval = loanApplication.approval ?? null;
  const decided =
    DECIDED_PRESENTATION[loanApplication.status] ??
    (approval ? DECIDED_PRESENTATION.APPROVED : null);
  // "Still missing — send these for a re-review" belongs to a refusal. An
  // approval required the documents, and the registration is normally the
  // verified certificate rather than an upload, so listing it there would
  // tell an approved applicant they are missing something they are not.
  const showMissing =
    decided?.finalStep === "rejected" && missingTypes.length > 0;
  // Trimmed: an operator who tabbed through the field leaves whitespace, and
  // an empty reason box is worse than no reason box.
  const decisionNote = loanApplication.decision_note?.trim() || null;

  // Three-stage tracker. Undecided: submission done, review running, decision
  // still ahead. Decided: the third node carries the verdict.
  const steps = [
    { label: t("dashboard.sme.statusStepSubmitted"), state: "done" as const },
    {
      label: t("dashboard.sme.statusStepReview"),
      state: decided ? ("done" as const) : ("active" as const),
    },
    {
      label: t("dashboard.sme.statusStepDecision"),
      state: decided ? decided.finalStep : ("pending" as const),
    },
  ];

  return (
    <Card className="w-full overflow-hidden border-border/70 shadow-sm">
      {/* Header band */}
      <div className="flex flex-col gap-4 border-b border-border/60 bg-muted/30 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div className="space-y-1">
          <span className="eyebrow block text-muted-foreground">
            {t("dashboard.sme.statusSubmittedEyebrow")}
          </span>
          <h3 className="text-xl font-bold tracking-tight text-foreground">
            {t(decided?.titleKey ?? "dashboard.sme.statusSubmittedTitle")}
          </h3>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            {t(decided?.subtitleKey ?? "dashboard.sme.statusSubmittedSubtitle")}
          </p>
        </div>

        <div
          className={cn(
            "flex shrink-0 items-center gap-2 self-start rounded-full border px-3 py-1.5 sm:self-center",
            decided?.badgeClass ?? "border-amber-500/30 bg-amber-500/10",
          )}
        >
          <span className="relative flex h-2 w-2">
            {/* The pulse means "something is still happening". A decided
                application is not still happening, so it gets a steady dot. */}
            {!decided && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500/70" />
            )}
            <span
              className={cn(
                "relative inline-flex h-2 w-2 rounded-full",
                decided?.dotClass ?? "bg-amber-500",
              )}
            />
          </span>
          <span
            className={cn(
              "text-xs font-semibold",
              decided?.badgeTextClass ?? "text-amber-700 dark:text-amber-300",
            )}
          >
            {t(decided?.badgeKey ?? "dashboard.sme.statusUnderReviewBadge")}
          </span>
        </div>
      </div>

      <div className="space-y-7 p-5 md:p-6">
        {/* Status tracker */}
        <div className="flex items-center">
          {steps.map((step, i) => (
            <div
              key={step.label}
              className="flex flex-1 items-center last:flex-none"
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                    step.state === "done" &&
                      "border-emerald-500 bg-emerald-500 text-white",
                    step.state === "active" &&
                      "border-amber-500 bg-background text-amber-600 dark:text-amber-400",
                    step.state === "pending" &&
                      "border-border bg-background text-muted-foreground",
                    step.state === "rejected" &&
                      "border-destructive bg-destructive text-white",
                  )}
                >
                  {step.state === "rejected" ? (
                    <X className="h-4 w-4" />
                  ) : step.state === "done" ? (
                    <Check className="h-4 w-4" />
                  ) : step.state === "active" ? (
                    <motion.span
                      className="h-2.5 w-2.5 rounded-full bg-amber-500"
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0.6, 1] }}
                      transition={{ duration: 1.6, repeat: Infinity }}
                    />
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={cn(
                    "text-[11px] font-medium sm:text-xs",
                    step.state === "pending" && "text-muted-foreground",
                    step.state === "rejected" && "text-destructive",
                    (step.state === "done" || step.state === "active") &&
                      "text-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector to the next node */}
              {i < steps.length - 1 && (
                <div className="mx-1 -mt-5 h-0.5 flex-1 rounded-full bg-border sm:mx-2">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      step.state === "done"
                        ? "bg-emerald-500"
                        : "bg-transparent",
                    )}
                    style={{ width: step.state === "done" ? "100%" : "0%" }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {approval && (
          <>
            <ApprovalSummary
              approval={approval}
              requestedAmount={requestedAmount}
              locale={locale}
              t={t}
            />
            <ApprovalCelebration
              applicationId={loanApplication.id}
              approval={approval}
              companyName={companyName}
              t={t}
            />
          </>
        )}

        {/* Why the answer is what it is. An outcome with no explanation is
            the thing an applicant phones about, so the operator's reason and
            any gap in the file are stated here rather than left to email. */}
        {decided && (decisionNote || showMissing) && (
          <div
            className={cn(
              "space-y-3 rounded-xl border p-4",
              decided.reasonClass,
            )}
          >
            {decisionNote && (
              <div className="space-y-1">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  {t("dashboard.sme.statusReasonHeading")}
                </h4>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {decisionNote}
                </p>
              </div>
            )}

            {showMissing && (
              <div className="space-y-1">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  {t("dashboard.sme.statusMissingHeading")}
                </h4>
                <ul className="space-y-1">
                  {missingTypes.map((type) => (
                    <li
                      key={type}
                      className="flex items-center gap-2 text-sm text-foreground/90"
                    >
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                      {DOCUMENT_LABELS[type][isVi ? "vi" : "en"]}
                    </li>
                  ))}
                </ul>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t("dashboard.sme.statusMissingHint")}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Key facts row */}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 rounded-xl border border-border/60 bg-muted/20 p-4 sm:grid-cols-4">
          <div className="space-y-0.5">
            <dt className="stat-label">
              {t("dashboard.sme.statusRequestedAmount")}
            </dt>
            <dd className="text-sm font-bold text-foreground">
              {Number.isFinite(requestedAmount)
                ? `${requestedAmount.toLocaleString(isVi ? "vi-VN" : "en-US")} VND`
                : t("common.na")}
            </dd>
          </div>
          {repaymentLabel && (
            <div className="space-y-0.5">
              <dt className="stat-label">
                {t("dashboard.sme.statusRepaymentPreference")}
              </dt>
              <dd className="text-sm font-bold text-foreground">
                {repaymentLabel}
              </dd>
            </div>
          )}
          {submittedAt && (
            <div className="space-y-0.5">
              <dt className="stat-label">
                {t("dashboard.sme.statusStepSubmitted")}
              </dt>
              <dd className="text-sm font-bold text-foreground">
                {formatDate(submittedAt, locale)}
              </dd>
            </div>
          )}
          <div className="space-y-0.5">
            <dt className="stat-label">{t("dashboard.sme.statusReference")}</dt>
            <dd className="font-mono text-sm font-bold uppercase text-foreground">
              {loanApplication.id.slice(0, 8)}
            </dd>
          </div>
        </dl>

        {/* Documents */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText className={cn("h-4 w-4", theme.accentColor)} />
              {t("dashboard.sme.statusDocuments")}
            </h4>
            <span className="text-xs font-medium text-muted-foreground">
              {t("dashboard.sme.statusDocumentsReceivedCount")
                .replace("{count}", String(receivedExpected))
                .replace("{total}", String(EXPECTED_DOCUMENT_TYPES.length))}
            </span>
          </div>

          <ul className="divide-y divide-border/60">
            {listedTypes.map((type) => {
              const doc = receivedByType.get(type);
              const label = DOCUMENT_LABELS[type][isVi ? "vi" : "en"];
              return (
                <li key={type} className="flex items-center gap-3 py-3">
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-md font-mono text-[10px] font-bold",
                      doc
                        ? "bg-foreground/5 text-foreground/70"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {doc ? extOf(doc.original_filename) : "—"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-medium text-foreground">
                      {label}
                    </p>
                    {doc && (
                      <p className="truncate text-xs text-muted-foreground">
                        {doc.original_filename} ·{" "}
                        {formatBytes(doc.file_size_bytes)}
                      </p>
                    )}
                  </div>
                  {doc ? (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      <Check className="h-3 w-3" />
                      {t("dashboard.sme.statusReceived")}
                    </span>
                  ) : (
                    <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
                      —
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Footnote */}
        {/* "No action is needed from you right now" is only true while a
            review is running. */}
        <p className="border-t border-border/60 pt-4 text-xs leading-relaxed text-muted-foreground">
          {t(decided?.noteKey ?? "dashboard.sme.statusReviewNote")}
        </p>
      </div>
    </Card>
  );
}
