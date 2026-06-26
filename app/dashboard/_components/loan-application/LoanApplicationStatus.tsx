"use client";

import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Check, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectLoanApplication } from "@/services/projects.service";
import type { LoanDocumentType } from "@/services/uploads.service";
import type { IndustryTheme } from "../sme-dashboard-config";

interface LoanApplicationStatusProps {
  loanApplication: ProjectLoanApplication;
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
};

const DOCUMENT_ORDER = Object.keys(DOCUMENT_LABELS) as LoanDocumentType[];

const REPAYMENT_LABELS: Record<string, { en: string; vi: string }> = {
  MONTHLY: { en: "Monthly", vi: "Hàng tháng" },
  QUARTERLY: { en: "Quarterly", vi: "Hàng quý" },
  END_OF_TERM: { en: "End of term", vi: "Cuối kỳ" },
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

  // Three-stage tracker — submission is done, review is in progress, decision pending.
  const steps = [
    { label: t("dashboard.sme.statusStepSubmitted"), state: "done" as const },
    { label: t("dashboard.sme.statusStepReview"), state: "active" as const },
    { label: t("dashboard.sme.statusStepDecision"), state: "pending" as const },
  ];

  return (
    <Card className="w-full overflow-hidden border-border/70 shadow-sm">
      {/* Header band */}
      <div className="flex flex-col gap-4 border-b border-border/60 bg-muted/30 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {t("dashboard.sme.statusSubmittedEyebrow")}
          </span>
          <h3 className="text-xl font-bold tracking-tight text-foreground">
            {t("dashboard.sme.statusSubmittedTitle")}
          </h3>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            {t("dashboard.sme.statusSubmittedSubtitle")}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 self-start rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 sm:self-center">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500/70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
          </span>
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
            {t("dashboard.sme.statusUnderReviewBadge")}
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
                  )}
                >
                  {step.state === "done" ? (
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
                    step.state === "pending"
                      ? "text-muted-foreground"
                      : "text-foreground",
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

        {/* Key facts row */}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 rounded-xl border border-border/60 bg-muted/20 p-4 sm:grid-cols-4">
          <div className="space-y-0.5">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
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
              <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {t("dashboard.sme.statusRepaymentPreference")}
              </dt>
              <dd className="text-sm font-bold text-foreground">
                {repaymentLabel}
              </dd>
            </div>
          )}
          {submittedAt && (
            <div className="space-y-0.5">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {t("dashboard.sme.statusStepSubmitted")}
              </dt>
              <dd className="text-sm font-bold text-foreground">
                {submittedAt.toLocaleDateString(locale)}
              </dd>
            </div>
          )}
          <div className="space-y-0.5">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {t("dashboard.sme.statusReference")}
            </dt>
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
                .replace("{count}", String(receivedByType.size))
                .replace("{total}", String(DOCUMENT_ORDER.length))}
            </span>
          </div>

          <ul className="divide-y divide-border/60">
            {DOCUMENT_ORDER.map((type) => {
              const doc = receivedByType.get(type);
              const label = DOCUMENT_LABELS[type][isVi ? "vi" : "en"];
              return (
                <li key={type} className="flex items-center gap-3 py-3">
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[9px] font-bold tracking-wide",
                      doc
                        ? "bg-foreground/5 text-foreground/70"
                        : "bg-muted text-muted-foreground/60",
                    )}
                  >
                    {doc ? extOf(doc.original_filename) : "—"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
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
        <p className="border-t border-border/60 pt-4 text-xs leading-relaxed text-muted-foreground">
          {t("dashboard.sme.statusReviewNote")}
        </p>
      </div>
    </Card>
  );
}
