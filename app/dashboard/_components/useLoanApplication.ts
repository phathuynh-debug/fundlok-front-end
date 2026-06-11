import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useUploadLoanDocument, useConfirmUploads } from "@/hooks/use-uploads"
import { useSubmitLoanApplication } from "@/hooks/use-loans"
import {
  DOCUMENT_TYPE_RULES,
  validateLoanDocumentFile,
  type LoanDocumentType,
} from "@/services/uploads.service"

export type DocumentKey =
  | "companyCharter"
  | "companyRegistration"
  | "vatDeclarations"
  | "financialStatement"
  | "eInvoiceData"
  | "cicReport"

export type UploadStatus = "idle" | "uploading" | "uploaded" | "error"

export interface DocumentUpload {
  file: File | null
  status: UploadStatus
  progress: number
  fileKey: string | null
  error: string | null
}

export type DocumentUploads = Record<DocumentKey, DocumentUpload>

// Wizard step → backend document_type. Exactly one file per type per application.
export const DOCUMENT_TYPES: Record<DocumentKey, LoanDocumentType> = {
  companyCharter: "legal_charter",
  companyRegistration: "business_registration",
  vatDeclarations: "vat_tax_zip",
  financialStatement: "financial_report",
  eInvoiceData: "e_invoice_data",
  cicReport: "cic_report",
}

const STEP_DOCUMENTS: Record<number, DocumentKey[]> = {
  1: ["companyCharter", "companyRegistration"],
  2: ["vatDeclarations"],
  3: ["financialStatement"],
  4: ["eInvoiceData"],
  5: ["cicReport"],
}

const ALL_DOCUMENT_KEYS = Object.keys(DOCUMENT_TYPES) as DocumentKey[]

const TOTAL_STEPS = 5

const emptyUpload = (): DocumentUpload => ({
  file: null,
  status: "idle",
  progress: 0,
  fileKey: null,
  error: null,
})

export function acceptForDocument(key: DocumentKey): string {
  return DOCUMENT_TYPE_RULES[DOCUMENT_TYPES[key]].extensions
    .map((ext) => `.${ext}`)
    .join(",")
}

export function maxSizeMbForDocument(key: DocumentKey): number {
  return DOCUMENT_TYPE_RULES[DOCUMENT_TYPES[key]].maxSizeMb
}

interface UseLoanApplicationOptions {
  loanApplicationId: string
  t: (key: string) => string
}

export function useLoanApplication({ loanApplicationId, t }: UseLoanApplicationOptions) {
  const { toast } = useToast()

  const uploadDocument = useUploadLoanDocument()
  const confirmUploads = useConfirmUploads()
  const submitApplication = useSubmitLoanApplication()

  const [documents, setDocuments] = useState<DocumentUploads>(() =>
    Object.fromEntries(ALL_DOCUMENT_KEYS.map((key) => [key, emptyUpload()])) as DocumentUploads
  )

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const updateDocument = (key: DocumentKey, patch: Partial<DocumentUpload>) => {
    setDocuments((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }))
  }

  const validationMessage = (key: DocumentKey, file: File): string | null => {
    const error = validateLoanDocumentFile(DOCUMENT_TYPES[key], file)
    if (!error) return null
    if (error.code === "invalid_extension") {
      return t("dashboard.sme.invalidFileType").replace(
        "{extensions}",
        error.allowedExtensions
      )
    }
    return t("dashboard.sme.fileTooLargeError").replace(
      "{maxSize}",
      String(error.maxSizeMb)
    )
  }

  // --- Upload (runs immediately when a file is picked) ---

  const startUpload = (key: DocumentKey, file: File) => {
    updateDocument(key, {
      file,
      status: "uploading",
      progress: 0,
      fileKey: null,
      error: null,
    })

    uploadDocument.mutate(
      {
        loanApplicationId,
        documentType: DOCUMENT_TYPES[key],
        file,
        onProgress: (percent) => updateDocument(key, { progress: percent }),
      },
      {
        onSuccess: ({ fileKey }) => {
          updateDocument(key, { status: "uploaded", progress: 100, fileKey })
        },
        onError: (error) => {
          updateDocument(key, {
            status: "error",
            error: error.message || t("dashboard.sme.fileUploadFailed"),
          })
        },
      }
    )
  }

  const handleFileChange = (key: DocumentKey, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Reset so picking the same file again re-triggers onChange (retry case).
    e.target.value = ""
    if (!file) return

    const message = validationMessage(key, file)
    if (message) {
      updateDocument(key, { ...emptyUpload(), file, status: "error", error: message })
      return
    }

    startUpload(key, file)
  }

  // Failed transfers are retried individually: redo init-upload + PUT for that file.
  const retryUpload = (key: DocumentKey) => {
    const { file } = documents[key]
    if (!file) return
    const message = validationMessage(key, file)
    if (message) return
    startUpload(key, file)
  }

  const removeFile = (key: DocumentKey) => {
    updateDocument(key, emptyUpload())
  }

  // --- Step Validation ---

  const isStepValid = (step: number): boolean => {
    const keys = STEP_DOCUMENTS[step]
    if (!keys) return false
    return keys.every((key) => documents[key].status === "uploaded")
  }

  const canNavigateToStep = (targetStep: number): boolean => {
    for (let s = 1; s < targetStep; s++) {
      if (!isStepValid(s)) return false
    }
    return true
  }

  // --- Step Navigation ---

  const goToStep = (step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step)
    } else if (canNavigateToStep(step)) {
      setCurrentStep(step)
    } else {
      toast({
        variant: "destructive",
        title: t("dashboard.sme.requiredDocsMissingTitle"),
        description: t("dashboard.sme.requiredDocsMissingDescription"),
      })
    }
  }

  const goToNextStep = () => {
    if (isStepValid(currentStep)) {
      setCurrentStep((prev) => Math.min(TOTAL_STEPS, prev + 1))
    } else {
      toast({
        variant: "destructive",
        title: t("dashboard.sme.requiredDocsMissingTitle"),
        description: t("dashboard.sme.requiredDocsMissingDescription"),
      })
    }
  }

  const goToPreviousStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1))
  }

  // --- Submission ---

  const allFilesUploaded = ALL_DOCUMENT_KEYS.every(
    (key) => documents[key].status === "uploaded"
  )

  const isUploadingAny = ALL_DOCUMENT_KEYS.some(
    (key) => documents[key].status === "uploading"
  )

  const isSubmitting = confirmUploads.isPending || submitApplication.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isUploadingAny) {
      toast({
        variant: "destructive",
        title: t("dashboard.sme.documentsStillUploadingTitle"),
        description: t("dashboard.sme.documentsStillUploadingDescription"),
      })
      return
    }

    const fileKeys = ALL_DOCUMENT_KEYS.map((key) => documents[key].fileKey)
    if (!allFilesUploaded || fileKeys.some((key) => !key)) {
      toast({
        variant: "destructive",
        title: t("dashboard.sme.requiredDocsMissingTitle"),
        description: t("dashboard.sme.requiredDocsMissingDescription"),
      })
      return
    }

    try {
      await confirmUploads.mutateAsync({
        loan_application_id: loanApplicationId,
        file_keys: fileKeys as string[],
      })

      await submitApplication.mutateAsync(loanApplicationId)

      setIsSubmitted(true)
      toast({
        title: t("dashboard.sme.applicationSubmittedTitle"),
        description: t("dashboard.sme.applicationSubmittedDescription"),
      })
    } catch (error) {
      const message = (error as { message?: string })?.message
      toast({
        variant: "destructive",
        title: t("dashboard.sme.uploadFailedTitle"),
        description: message || t("dashboard.sme.uploadFailedDescription"),
      })
    }
  }

  return {
    // State
    documents,
    currentStep,
    isSubmitting,
    isSubmitted,
    allFilesUploaded,
    totalSteps: TOTAL_STEPS,

    // File actions
    handleFileChange,
    removeFile,
    retryUpload,

    // Step navigation
    goToStep,
    goToNextStep,
    goToPreviousStep,
    isStepValid,

    // Submission
    handleSubmit,
  }
}
