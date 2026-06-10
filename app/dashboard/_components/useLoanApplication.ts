import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { filesService } from "@/services/files.service"

export type DocumentFiles = {
  companyCharter: File | null
  companyRegistration: File | null
  vatDeclarations: File | null
  financialStatement: File | null
  eInvoiceData: File | null
  cicReport: File | null
}

type FileKey = keyof DocumentFiles

const TOTAL_STEPS = 5

interface UseLoanApplicationOptions {
  projectId: string
  t: (key: string) => string
}

export function useLoanApplication({ projectId, t }: UseLoanApplicationOptions) {
  const { toast } = useToast()

  const [files, setFiles] = useState<DocumentFiles>({
    companyCharter: null,
    companyRegistration: null,
    vatDeclarations: null,
    financialStatement: null,
    eInvoiceData: null,
    cicReport: null,
  })

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // --- File Handlers ---

  const handleFileChange = (key: FileKey, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFiles((prev) => ({
        ...prev,
        [key]: e.target.files![0],
      }))
    }
  }

  const removeFile = (key: FileKey) => {
    setFiles((prev) => ({ ...prev, [key]: null }))
  }

  // --- Step Validation ---

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(files.companyCharter && files.companyRegistration)
      case 2:
        return !!files.vatDeclarations
      case 3:
        return !!files.financialStatement
      case 4:
        return !!files.eInvoiceData
      case 5:
        return !!files.cicReport
      default:
        return false
    }
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

  const allFilesUploaded =
    !!files.companyCharter &&
    !!files.companyRegistration &&
    !!files.vatDeclarations &&
    !!files.financialStatement &&
    !!files.eInvoiceData &&
    !!files.cicReport

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!allFilesUploaded) {
      toast({
        variant: "destructive",
        title: t("dashboard.sme.requiredDocsMissingTitle"),
        description: t("dashboard.sme.requiredDocsMissingDescription"),
      })
      return
    }

    setIsSubmitting(true)
    try {
      const uploadPromises = []

      if (files.companyCharter) {
        uploadPromises.push(filesService.uploadDocument(projectId, "KYC_BUSINESS_REG", files.companyCharter))
      }
      if (files.companyRegistration) {
        uploadPromises.push(filesService.uploadDocument(projectId, "KYC_BUSINESS_REG", files.companyRegistration))
      }
      if (files.vatDeclarations) {
        uploadPromises.push(filesService.uploadDocument(projectId, "KYC_BUSINESS_REG", files.vatDeclarations))
      }
      if (files.financialStatement) {
        uploadPromises.push(filesService.uploadDocument(projectId, "BANK_STATEMENT", files.financialStatement))
      }
      if (files.eInvoiceData) {
        uploadPromises.push(filesService.uploadDocument(projectId, "BANK_STATEMENT", files.eInvoiceData))
      }
      if (files.cicReport) {
        uploadPromises.push(filesService.uploadDocument(projectId, "OTHER", files.cicReport))
      }

      await Promise.all(uploadPromises)

      setIsSubmitted(true)
      toast({
        title: t("dashboard.sme.applicationSubmittedTitle"),
        description: t("dashboard.sme.applicationSubmittedDescription"),
      })
    } catch (error: unknown) {
      console.error("Document upload sequence failed:", error)
      toast({
        variant: "destructive",
        title: t("dashboard.sme.uploadFailedTitle"),
        description: error instanceof Error ? error.message : t("dashboard.sme.uploadFailedDescription"),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    // State
    files,
    currentStep,
    isSubmitting,
    isSubmitted,
    totalSteps: TOTAL_STEPS,

    // File actions
    handleFileChange,
    removeFile,

    // Step navigation
    goToStep,
    goToNextStep,
    goToPreviousStep,
    isStepValid,

    // Submission
    handleSubmit,
  }
}
