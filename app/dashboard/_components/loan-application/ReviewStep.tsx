"use client";

import { CheckCircle2 } from "lucide-react";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReviewRow } from "./ReviewRow";
import { useLoanApplicationContext } from "./LoanApplicationContext";
import type { DocumentKey } from "./useLoanApplication";
import { LITE_FIGURE_FIELDS, parseFigure } from "./lite-grading-fields";

// Review-list label per document (reuses the existing per-step strings).
const DOCUMENT_LABEL_KEYS: Record<DocumentKey, string> = {
  companyCharter: "dashboard.sme.companyCharter",
  companyRegistration: "dashboard.sme.companyRegistration",
  eInvoiceData: "dashboard.sme.eInvoiceData",
  cicReport: "dashboard.sme.cicCreditReport",
};

// The final wizard step: lists every document with its status and an overall
// send-progress bar. Sending is triggered from the orchestrator's Send button.
export function ReviewStep() {
  const {
    documentKeys,
    kybCertificate,
    figures,
    canSend,
    isSending,
    isFinalizing,
    uploadedCount,
    totalDocuments,
    goToStep,
    locale,
    t,
  } = useLoanApplicationContext();

  const showProgress = isSending || isFinalizing || uploadedCount > 0;

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-2">
      <div className="text-center space-y-1.5">
        <h4 className="text-lg font-bold text-foreground">
          {t("dashboard.sme.reviewTitle")}
        </h4>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.sme.reviewSubtitle")}
        </p>
      </div>

      {showProgress && (
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
        {/* Already on file from KYB — shown so the review reads as complete,
            rather than listing it as missing when it was never asked for. */}
        {kybCertificate && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-sm">
            <CheckCircle2
              className="h-4 w-4 shrink-0 text-emerald-600"
              aria-hidden
            />
            <span className="flex-1 text-foreground">
              {t("dashboard.sme.companyRegistration")}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("dashboard.sme.reusedFromKyb")}
            </span>
          </div>
        )}
        {documentKeys.map((key) => (
          <ReviewRow
            key={key}
            docKey={key}
            label={t(DOCUMENT_LABEL_KEYS[key])}
          />
        ))}
      </div>

      {/* The typed figures. These are the grading inputs, so they get read back
          verbatim before sending — a mistyped zero is the likeliest error in
          the whole flow and the only place to catch it is here. */}
      <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-4">
        <h5 className="text-sm font-bold text-foreground">
          {t("dashboard.sme.lite.reviewFiguresTitle")}
        </h5>
        <dl className="divide-y divide-border/60">
          {LITE_FIGURE_FIELDS.map((field) => {
            const value = parseFigure(figures[field.key], field.unit);
            return (
              <div
                key={field.key}
                className="flex items-baseline justify-between gap-3 py-1.5"
              >
                <dt className="text-xs text-muted-foreground">
                  {t(field.labelKey)}
                </dt>
                <dd
                  className={cn(
                    "shrink-0 text-sm tabular-nums",
                    value === null
                      ? "text-muted-foreground italic"
                      : "font-semibold text-foreground",
                  )}
                >
                  {value === null
                    ? t("dashboard.sme.lite.notProvided")
                    : field.unit === "pct"
                      ? `${value}%`
                      : `${value.toLocaleString(
                          locale === "vi" ? "vi-VN" : "en-US",
                        )} ₫`}
                </dd>
              </div>
            );
          })}
        </dl>
        <button
          type="button"
          onClick={() => goToStep(2)}
          className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
        >
          {t("dashboard.sme.lite.editFigures")}
        </button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {canSend
          ? t("dashboard.sme.reviewAllReadyHint")
          : t("dashboard.sme.reviewMissingHint")}
      </p>
    </div>
  );
}
