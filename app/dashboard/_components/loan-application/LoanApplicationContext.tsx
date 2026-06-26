"use client"

import { createContext, useContext, useState } from "react"
import type { IndustryTheme } from "../sme-dashboard-config"
import { useLoanApplication, type DocumentKey } from "./useLoanApplication"

// Which wizard step collects each document (used by the review "add" links).
const STEP_FOR_DOCUMENT: Record<DocumentKey, number> = {
  companyCharter: 1,
  companyRegistration: 1,
  vatDeclarations: 2,
  financialStatement: 3,
  eInvoiceData: 4,
  cicReport: 5,
}

// The whole loan-application wizard shares one state object: the hook's state +
// the presentation context (locale/theme/t) + the preview dialog state. Child
// components read what they need from here instead of receiving props.
type LoanApplicationContextValue = ReturnType<typeof useLoanApplication> & {
  locale: string
  theme: IndustryTheme
  t: (key: string) => string
  busy: boolean
  stepLabel: (step: number) => string
  stepForDocument: (key: DocumentKey) => number
  previewFile: File | null
  previewOpen: boolean
  openPreview: (file: File) => void
  setPreviewOpen: (open: boolean) => void
}

const LoanApplicationContext = createContext<LoanApplicationContextValue | null>(null)

export function useLoanApplicationContext(): LoanApplicationContextValue {
  const ctx = useContext(LoanApplicationContext)
  if (!ctx) {
    throw new Error("useLoanApplicationContext must be used within a LoanApplicationProvider")
  }
  return ctx
}

interface LoanApplicationProviderProps {
  loanApplicationId: string
  locale: string
  theme: IndustryTheme
  t: (key: string) => string
  children: React.ReactNode
}

export function LoanApplicationProvider({
  loanApplicationId,
  locale,
  theme,
  t,
  children,
}: LoanApplicationProviderProps) {
  const loanApp = useLoanApplication({ loanApplicationId, t })

  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const openPreview = (file: File) => {
    setPreviewFile(file)
    setPreviewOpen(true)
  }

  const busy = loanApp.isSending || loanApp.isFinalizing || loanApp.isSubmitted

  const stepLabel = (step: number) => {
    if (step === 1) return locale === "vi" ? "Hồ sơ pháp lý" : "Legal Docs"
    if (step === 2) return locale === "vi" ? "Thuế GTGT" : "VAT"
    if (step === 3) return locale === "vi" ? "Báo cáo TC" : "Financials"
    if (step === 4) return locale === "vi" ? "Hóa đơn ĐT" : "E-Invoice"
    if (step === 5) return "CIC"
    return t("dashboard.sme.reviewStepLabel")
  }

  // Rebuilt each render, which is fine — the wizard re-renders on every upload
  // progress tick anyway, so there's no extra cost over the previous props.
  const value: LoanApplicationContextValue = {
    ...loanApp,
    locale,
    theme,
    t,
    busy,
    stepLabel,
    stepForDocument: (key) => STEP_FOR_DOCUMENT[key],
    previewFile,
    previewOpen,
    openPreview,
    setPreviewOpen,
  }

  return <LoanApplicationContext.Provider value={value}>{children}</LoanApplicationContext.Provider>
}
