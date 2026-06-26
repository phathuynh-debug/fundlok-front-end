"use client"

import { motion } from "framer-motion"
import { ReviewRow } from "./ReviewRow"
import type { DocumentKey, DocumentUploads } from "./useLoanApplication"

// Review-list label per document (reuses the existing per-step strings).
const DOCUMENT_LABEL_KEYS: Record<DocumentKey, string> = {
  companyCharter: "dashboard.sme.companyCharter",
  companyRegistration: "dashboard.sme.companyRegistration",
  vatDeclarations: "dashboard.sme.vatDeclarations",
  financialStatement: "dashboard.sme.annualFinancialStatement",
  eInvoiceData: "dashboard.sme.eInvoiceData",
  cicReport: "dashboard.sme.cicCreditReport",
}

interface ReviewStepProps {
  documentKeys: DocumentKey[]
  documents: DocumentUploads
  canSend: boolean
  busy: boolean
  isSending: boolean
  isFinalizing: boolean
  uploadedCount: number
  totalDocuments: number
  t: (key: string) => string
  onPreview: (file: File) => void
  onRetry: (key: DocumentKey) => void
  onAdd: (key: DocumentKey) => void
}

// The final wizard step: lists every document with its status and an overall
// send-progress bar. Sending is triggered from the orchestrator's Send button.
export function ReviewStep({
  documentKeys,
  documents,
  canSend,
  busy,
  isSending,
  isFinalizing,
  uploadedCount,
  totalDocuments,
  t,
  onPreview,
  onRetry,
  onAdd,
}: ReviewStepProps) {
  const showProgress = isSending || isFinalizing || uploadedCount > 0

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-2">
      <div className="text-center space-y-1.5">
        <h4 className="text-lg font-bold text-foreground">{t("dashboard.sme.reviewTitle")}</h4>
        <p className="text-sm text-muted-foreground">{t("dashboard.sme.reviewSubtitle")}</p>
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
        {documentKeys.map((key) => (
          <ReviewRow
            key={key}
            docKey={key}
            doc={documents[key]}
            label={t(DOCUMENT_LABEL_KEYS[key])}
            busy={busy}
            isSending={isSending}
            isFinalizing={isFinalizing}
            t={t}
            onPreview={onPreview}
            onRetry={onRetry}
            onAdd={onAdd}
          />
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {canSend ? t("dashboard.sme.reviewAllReadyHint") : t("dashboard.sme.reviewMissingHint")}
      </p>
    </div>
  )
}
