import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUploadLoanDocument, useConfirmUploads } from "@/hooks/use-uploads";
import {
  useSaveLoanFigures,
  useSubmitLoanApplication,
} from "@/hooks/use-loans";
import type { LoanApplicationFiguresPayload } from "@/services/loans.service";
import {
  DOCUMENT_TYPE_RULES,
  validateLoanDocumentFile,
  type LoanDocumentType,
} from "@/services/uploads.service";
import {
  LITE_FIGURE_FIELDS,
  LITE_FIGURE_KEYS,
  figureFieldsForStep,
  parseFigure,
  validateFigure,
  type FigureError,
  type LiteFigureKey,
} from "./lite-grading-fields";

// Steps 2 (VAT) and 3 (annual financials) no longer collect documents: the SME
// types the figures instead. See lite-grading-fields.ts for why.
export type DocumentKey =
  "companyCharter" | "companyRegistration" | "eInvoiceData" | "cicReport";

export type FigureValues = Record<LiteFigureKey, string>;
export type FigureErrors = Record<LiteFigureKey, FigureError>;

// "ready" = a valid file is staged locally but not yet uploaded. Uploads are
// deferred until the user clicks Send on the review step, then run one-by-one.
export type UploadStatus =
  "idle" | "ready" | "uploading" | "uploaded" | "error";

// Distinguishes a bad file (blocks sending) from a transfer failure (resumable).
export type ErrorKind = "validation" | "upload" | null;

export interface DocumentUpload {
  file: File | null;
  status: UploadStatus;
  progress: number;
  fileKey: string | null;
  error: string | null;
  errorKind: ErrorKind;
}

export type DocumentUploads = Record<DocumentKey, DocumentUpload>;

// Wizard step → backend document_type. Exactly one file per type per application.
export const DOCUMENT_TYPES: Record<DocumentKey, LoanDocumentType> = {
  companyCharter: "legal_charter",
  companyRegistration: "business_registration",
  eInvoiceData: "e_invoice_data",
  cicReport: "cic_report",
};

// Steps 2 and 3 are absent on purpose — they are figure steps now, validated
// against LITE_FIGURE_FIELDS rather than against a staged file.
const STEP_DOCUMENTS: Record<number, DocumentKey[]> = {
  1: ["companyCharter", "companyRegistration"],
  4: ["eInvoiceData"],
  5: ["cicReport"],
};

const ALL_DOCUMENT_KEYS = Object.keys(DOCUMENT_TYPES) as DocumentKey[];

// Steps 1-5 collect the documents; step 6 is the review-and-send screen.
const REVIEW_STEP = 6;
const TOTAL_STEPS = 6;

const emptyUpload = (): DocumentUpload => ({
  file: null,
  status: "idle",
  progress: 0,
  fileKey: null,
  error: null,
  errorKind: null,
});

// A document is "staged" when it holds a file that passed validation — i.e. it
// can be sent. Covers ready (not yet sent), uploaded (already sent), and a prior
// upload failure (resumable). A validation error is the only non-staged file.
const isStaged = (doc: DocumentUpload): boolean =>
  doc.file !== null && doc.errorKind !== "validation";

export function acceptForDocument(key: DocumentKey): string {
  return DOCUMENT_TYPE_RULES[DOCUMENT_TYPES[key]].extensions
    .map((ext) => `.${ext}`)
    .join(",");
}

export function maxSizeMbForDocument(key: DocumentKey): number {
  return DOCUMENT_TYPE_RULES[DOCUMENT_TYPES[key]].maxSizeMb;
}

interface UseLoanApplicationOptions {
  loanApplicationId: string;
  t: (key: string) => string;
}

export function useLoanApplication({
  loanApplicationId,
  t,
}: UseLoanApplicationOptions) {
  const { toast } = useToast();

  const uploadDocument = useUploadLoanDocument();
  const confirmUploads = useConfirmUploads();
  const submitApplication = useSubmitLoanApplication();
  const saveFigures = useSaveLoanFigures();

  const [documents, setDocuments] = useState<DocumentUploads>(
    () =>
      Object.fromEntries(
        ALL_DOCUMENT_KEYS.map((key) => [key, emptyUpload()]),
      ) as DocumentUploads,
  );

  // Typed figures for steps 2-3. Local UI state, like the staged files: they
  // do not round-trip to the server until Send.
  const [figures, setFigures] = useState<FigureValues>(
    () =>
      Object.fromEntries(LITE_FIGURE_KEYS.map((k) => [k, ""])) as FigureValues,
  );
  // Only populated once a field has been visited, so the form does not open
  // covered in "required" errors.
  const [figureErrors, setFigureErrors] = useState<FigureErrors>(
    () =>
      Object.fromEntries(
        LITE_FIGURE_KEYS.map((k) => [k, null]),
      ) as FigureErrors,
  );

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  // True while the sequential send loop is running.
  const [isSending, setIsSending] = useState(false);

  const updateDocument = (key: DocumentKey, patch: Partial<DocumentUpload>) => {
    setDocuments((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const validationMessage = (key: DocumentKey, file: File): string | null => {
    const error = validateLoanDocumentFile(DOCUMENT_TYPES[key], file);
    if (!error) return null;
    if (error.code === "invalid_extension") {
      return t("dashboard.sme.invalidFileType").replace(
        "{extensions}",
        error.allowedExtensions,
      );
    }
    return t("dashboard.sme.fileTooLargeError").replace(
      "{maxSize}",
      String(error.maxSizeMb),
    );
  };

  // --- File selection (stages the file; no upload yet) ---

  const handleFileChange = (
    key: DocumentKey,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    // Reset so picking the same file again re-triggers onChange.
    e.target.value = "";
    if (!file) return;

    const message = validationMessage(key, file);
    if (message) {
      updateDocument(key, {
        ...emptyUpload(),
        file,
        status: "error",
        errorKind: "validation",
        error: message,
      });
      return;
    }

    // Valid file — stage it. The actual upload happens on Send.
    updateDocument(key, { ...emptyUpload(), file, status: "ready" });
  };

  const removeFile = (key: DocumentKey) => {
    updateDocument(key, emptyUpload());
  };

  // --- Typed figures ---

  const setFigure = (key: LiteFigureKey, raw: string) => {
    setFigures((prev) => ({ ...prev, [key]: raw }));
    // Clear a stale error as soon as the value becomes valid; don't introduce
    // a new one mid-typing (that fires "not a number" on an empty string).
    setFigureErrors((prev) => (prev[key] ? { ...prev, [key]: null } : prev));
  };

  /** Validate on blur — the point at which the user has finished the value. */
  const blurFigure = (key: LiteFigureKey) => {
    const field = LITE_FIGURE_FIELDS.find((f) => f.key === key);
    if (!field) return;
    setFigureErrors((prev) => ({
      ...prev,
      [key]: validateFigure(field, figures[key]),
    }));
  };

  const isFigureStepValid = (step: number): boolean =>
    figureFieldsForStep(step).every(
      (field) => validateFigure(field, figures[field.key]) === null,
    );

  /** Marks every invalid field on a step so the user can see what is missing. */
  const revealFigureErrors = (step: number) => {
    const fields = figureFieldsForStep(step);
    if (!fields.length) return;
    setFigureErrors((prev) => {
      const next = { ...prev };
      for (const field of fields) {
        next[field.key] = validateFigure(field, figures[field.key]);
      }
      return next;
    });
  };

  // --- Uploading ---

  // Uploads a single staged document. Resolves with its file_key, or throws
  // after marking the document as a (resumable) upload error.
  const uploadOne = async (key: DocumentKey): Promise<string> => {
    const file = documents[key].file;
    if (!file) {
      throw new Error("No file staged");
    }

    updateDocument(key, {
      status: "uploading",
      progress: 0,
      error: null,
      errorKind: null,
    });

    try {
      const { fileKey } = await uploadDocument.mutateAsync({
        loanApplicationId,
        documentType: DOCUMENT_TYPES[key],
        file,
        onProgress: (percent) => updateDocument(key, { progress: percent }),
      });
      updateDocument(key, { status: "uploaded", progress: 100, fileKey });
      return fileKey;
    } catch (err) {
      const message =
        (err as { message?: string })?.message ||
        t("dashboard.sme.fileUploadFailed");
      updateDocument(key, {
        status: "error",
        errorKind: "upload",
        error: message,
      });
      throw err;
    }
  };

  // Sends every document one by one, then confirms + submits. Already-uploaded
  // documents are skipped, so this doubles as resume-after-failure. Stops at the
  // first transfer that fails and leaves the rest for a retry.
  const handleSend = async () => {
    if (!canSend || isSending) {
      if (!canSend) {
        toast({
          variant: "destructive",
          title: t("dashboard.sme.requiredDocsMissingTitle"),
          description: t("dashboard.sme.requiredDocsMissingDescription"),
        });
      }
      return;
    }

    setIsSending(true);

    const fileKeys: string[] = [];
    for (const key of ALL_DOCUMENT_KEYS) {
      const doc = documents[key];
      if (doc.status === "uploaded" && doc.fileKey) {
        fileKeys.push(doc.fileKey);
        continue;
      }
      try {
        fileKeys.push(await uploadOne(key));
      } catch {
        // uploadOne already marked the document; halt the queue here.
        toast({
          variant: "destructive",
          title: t("dashboard.sme.uploadFailedTitle"),
          description: t("dashboard.sme.fileUploadFailed"),
        });
        setIsSending(false);
        return;
      }
    }

    try {
      await saveFigures.mutateAsync({
        applicationId: loanApplicationId,
        payload: Object.fromEntries(
          LITE_FIGURE_KEYS.map((key) => [key, parseFigure(figures[key])]),
        ) as unknown as LoanApplicationFiguresPayload,
      });
      await confirmUploads.mutateAsync({
        loan_application_id: loanApplicationId,
        file_keys: fileKeys,
      });
      await submitApplication.mutateAsync(loanApplicationId);
      setIsSubmitted(true);
      toast({
        title: t("dashboard.sme.applicationSubmittedTitle"),
        description: t("dashboard.sme.applicationSubmittedDescription"),
      });
    } catch (error) {
      const message = (error as { message?: string })?.message;
      toast({
        variant: "destructive",
        title: t("dashboard.sme.uploadFailedTitle"),
        description: message || t("dashboard.sme.uploadFailedDescription"),
      });
    } finally {
      setIsSending(false);
    }
  };

  // Re-send a single failed document from the review list.
  const retryUpload = async (key: DocumentKey) => {
    if (isSending) return;
    try {
      await uploadOne(key);
    } catch {
      toast({
        variant: "destructive",
        title: t("dashboard.sme.uploadFailedTitle"),
        description:
          documents[key].error || t("dashboard.sme.fileUploadFailed"),
      });
    }
  };

  // --- Step validation & navigation ---

  // A step is satisfied when its documents hold valid staged files, or — for
  // the figure steps — when every required figure parses.
  const isStepValid = (step: number): boolean => {
    if (step === REVIEW_STEP) return canSend;
    const keys = STEP_DOCUMENTS[step];
    if (keys) return keys.every((key) => isStaged(documents[key]));
    if (figureFieldsForStep(step).length) return isFigureStepValid(step);
    return false;
  };

  const canNavigateToStep = (targetStep: number): boolean => {
    for (let s = 1; s < targetStep; s++) {
      if (!isStepValid(s)) return false;
    }
    return true;
  };

  // A figure step's problem is per-field, so surface it on the fields rather
  // than in a toast that cannot say which number is missing.
  const reportBlockedStep = (step: number) => {
    if (figureFieldsForStep(step).length) {
      revealFigureErrors(step);
      toast({
        variant: "destructive",
        title: t("dashboard.sme.lite.missingFiguresTitle"),
        description: t("dashboard.sme.lite.missingFiguresDescription"),
      });
      return;
    }
    toast({
      variant: "destructive",
      title: t("dashboard.sme.requiredDocsMissingTitle"),
      description: t("dashboard.sme.requiredDocsMissingDescription"),
    });
  };

  const goToStep = (step: number) => {
    if (step <= currentStep || canNavigateToStep(step)) {
      setCurrentStep(step);
    } else {
      reportBlockedStep(currentStep);
    }
  };

  const goToNextStep = () => {
    if (isStepValid(currentStep)) {
      setCurrentStep((prev) => Math.min(TOTAL_STEPS, prev + 1));
    } else {
      reportBlockedStep(currentStep);
    }
  };

  const goToPreviousStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  // --- Derived flags ---

  // Every document holds a sendable file (no missing files, no bad files) and
  // every required figure parses.
  const allFiguresValid = LITE_FIGURE_FIELDS.every(
    (field) => validateFigure(field, figures[field.key]) === null,
  );
  const canSend =
    ALL_DOCUMENT_KEYS.every((key) => isStaged(documents[key])) &&
    allFiguresValid;
  const allFilesUploaded = ALL_DOCUMENT_KEYS.every(
    (key) => documents[key].status === "uploaded",
  );
  const uploadedCount = ALL_DOCUMENT_KEYS.filter(
    (key) => documents[key].status === "uploaded",
  ).length;
  // Confirm + submit running after every file is up.
  const isFinalizing =
    saveFigures.isPending ||
    confirmUploads.isPending ||
    submitApplication.isPending;

  return {
    // State
    documents,
    figures,
    figureErrors,
    currentStep,
    totalSteps: TOTAL_STEPS,
    reviewStep: REVIEW_STEP,
    isSending,
    isFinalizing,
    isSubmitted,
    canSend,
    allFilesUploaded,
    uploadedCount,
    totalDocuments: ALL_DOCUMENT_KEYS.length,
    documentKeys: ALL_DOCUMENT_KEYS,

    // File actions
    handleFileChange,
    removeFile,
    retryUpload,

    // Typed-figure actions
    setFigure,
    blurFigure,

    // Step navigation
    goToStep,
    goToNextStep,
    goToPreviousStep,
    isStepValid,

    // Submission
    handleSend,
  };
}
