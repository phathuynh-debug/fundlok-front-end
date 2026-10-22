import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useKybCertificate } from "@/hooks/use-gverify";
import {
  useConfirmUploads,
  usePreviewCic,
  usePreviewEInvoice,
  usePreviewTaxFilings,
  useUploadLoanDocument,
} from "@/hooks/use-uploads";
import {
  useSaveLoanFigures,
  useSubmitLoanApplication,
} from "@/hooks/use-loans";
import type { LoanApplicationFiguresPayload } from "@/services/loans.service";
import {
  DOCUMENT_TYPE_RULES,
  validateLoanDocumentFile,
  type CicPreview,
  type EInvoicePreview,
  type LoanDocumentType,
  type TaxFilingsPreview,
} from "@/services/uploads.service";
import {
  LITE_FIGURE_FIELDS,
  validateFigureConsistency,
  type LiteFigureField,
  figureFieldsForStep,
  parseFigure,
  validateFigure,
  type FigureError,
  type LiteFigureKey,
} from "./lite-grading-fields";
import { figureFilesRead, figuresFromFiles } from "./figures-from-files";
import { priorYearRevenue } from "./prior-year-revenue";

// Step 2 takes two files and every figure on it is read out of them: the
// e-invoice zip (revenue, customers) and the tax filings (costs, and, through
// the VAT declarations in them, the year of revenue before the invoices). See
// figuresFromFiles.
export type DocumentKey =
  | "companyCharter"
  | "companyRegistration"
  | "eInvoiceData"
  | "taxFilings"
  | "cicReport";

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
  taxFilings: "tax_filings",
  cicReport: "cic_report",
};

// Step 2 takes BOTH files and figures: the files are the evidence and the
// figures they can state are read out of them.
const STEP_DOCUMENTS: Record<number, DocumentKey[]> = {
  1: ["companyCharter", "companyRegistration"],
  2: ["eInvoiceData", "taxFilings"],
  3: ["cicReport"],
};

const ALL_DOCUMENT_KEYS = Object.keys(DOCUMENT_TYPES) as DocumentKey[];

// 1 legal · 2 revenue and costs (e-invoices + tax filings) · 3 CIC · 4 review
// and send. Revenue and costs used to be two steps, each with a file of its
// own. The second file also answers the first step's last question (the year
// of revenue before the invoices), so they are asked together.
const REVIEW_STEP = 4;
const TOTAL_STEPS = 4;
export const EINVOICE_STEP = 2;
export const TAX_FILINGS_STEP = 2;
export const CIC_STEP = 3;

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

  // The SME already submitted their business registration certificate for KYB.
  // Asking for the same PDF again is busywork, and a second copy can disagree
  // with the one that was actually verified. When it is on file, that document
  // requirement is met and the wizard offers a preview instead of an upload.
  const { data: kybCertificate } = useKybCertificate();
  const isSatisfiedByKyb = (key: DocumentKey): boolean =>
    key === "companyRegistration" && !!kybCertificate;

  const uploadDocument = useUploadLoanDocument();
  const confirmUploads = useConfirmUploads();
  const submitApplication = useSubmitLoanApplication();
  const saveFigures = useSaveLoanFigures();
  const previewEInvoice = usePreviewEInvoice();
  const previewTaxFilings = usePreviewTaxFilings();
  const previewCic = usePreviewCic();
  // What the attached CIC report says. Shown only: the score feeds grading
  // from the stored file at Send, and there is no figure on the CIC step to fill.
  const [cicPreview, setCicPreview] = useState<CicPreview | null>(null);
  // What each attached evidence file says. Every step-2 figure is worked out
  // from these two at read time (see figuresFromFiles), so removing or replacing
  // a file takes its figures with it and nothing is left behind looking typed.
  const [eInvoicePreview, setEInvoicePreview] =
    useState<EInvoicePreview | null>(null);
  const [taxFilingsPreview, setTaxFilingsPreview] =
    useState<TaxFilingsPreview | null>(null);

  const [documents, setDocuments] = useState<DocumentUploads>(
    () =>
      Object.fromEntries(
        ALL_DOCUMENT_KEYS.map((key) => [key, emptyUpload()]),
      ) as DocumentUploads,
  );

  // Every step-2 figure, read out of the two files. There is no state behind
  // it, so there is nothing to type into and nothing on the step can be edited.
  const figures: FigureValues = figuresFromFiles(
    eInvoicePreview,
    taxFilingsPreview,
  );
  // Whether, and why not, the year before the invoices could be worked out.
  const priorYear = priorYearRevenue(eInvoicePreview, taxFilingsPreview);

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
    // The e-invoice file is a whole folder of monthly exports. A single loose
    // export is the likeliest mistake, so name the fix, not the extensions.
    if (error.code === "invalid_extension" && key === "eInvoiceData") {
      return t("dashboard.sme.eInvoiceZipFolder");
    }
    if (error.code === "invalid_extension" && key === "taxFilings") {
      return t("dashboard.sme.taxFilingsFormat");
    }
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
    if (key === "eInvoiceData") void readEInvoices(file);
    if (key === "taxFilings") void readTaxFilings(file);
    if (key === "cicReport") void readCic(file);
  };

  // Reads the zip on the server as soon as it is picked and fills step 2 from
  // it. Advisory: confirm re-parses the STORED file at Send, so a preview can
  // not plant a figure the evidence does not support.
  const readEInvoices = async (file: File) => {
    setEInvoicePreview(null);
    try {
      setEInvoicePreview(
        await previewEInvoice.mutateAsync({ loanApplicationId, file }),
      );
    } catch (err) {
      const { message, code } = (err ?? {}) as {
        message?: string;
        code?: string;
      };
      updateDocument("eInvoiceData", {
        status: "error",
        errorKind: "validation",
        error: evidenceErrorCopy(code, message),
      });
    }
  };

  // Reads the tax filings as soon as they are picked and fills the statutory
  // figures (cost of goods sold, owner withdrawal). Its VAT series is also what
  // the year before the invoices is worked out from (see priorYear). Same
  // contract as readEInvoices: advisory, re-parsed from storage at Send.
  const readTaxFilings = async (file: File) => {
    setTaxFilingsPreview(null);
    try {
      setTaxFilingsPreview(
        await previewTaxFilings.mutateAsync({ loanApplicationId, file }),
      );
    } catch (err) {
      const { message, code } = (err ?? {}) as {
        message?: string;
        code?: string;
      };
      updateDocument("taxFilings", {
        status: "error",
        errorKind: "validation",
        error: evidenceErrorCopy(code, message),
      });
    }
  };

  // Reads the CIC report as soon as it is picked, so the SME sees the score
  // and debt position CIC reports — and a scan or the wrong PDF is caught
  // here rather than at Send.
  const readCic = async (file: File) => {
    setCicPreview(null);
    try {
      setCicPreview(await previewCic.mutateAsync({ loanApplicationId, file }));
    } catch (err) {
      const { message, code } = (err ?? {}) as {
        message?: string;
        code?: string;
      };
      updateDocument("cicReport", {
        status: "error",
        errorKind: "validation",
        error: evidenceErrorCopy(code, message),
      });
    }
  };

  // The server's refusal of an evidence file, in the SME's language when the
  // code is known (EINVOICE_* and TAXFILINGS_* for step 2, CIC_* for step 3).
  const evidenceErrorCopy = (code?: string, message?: string): string => {
    const prefixes: [string, string][] = [
      ["EINVOICE_", "dashboard.sme.eInvoiceError."],
      ["TAXFILINGS_", "dashboard.sme.taxFilingsError."],
      ["CIC_", "dashboard.sme.cicError."],
    ];
    for (const [prefix, base] of prefixes) {
      if (code?.startsWith(prefix)) {
        const key = base + code.slice(prefix.length);
        const translated = t(key);
        if (translated !== key) return translated;
      }
    }
    return message || t("dashboard.sme.fileUploadFailed");
  };

  const removeFile = (key: DocumentKey) => {
    updateDocument(key, emptyUpload());
    if (key === "eInvoiceData") setEInvoicePreview(null);
    if (key === "taxFilings") setTaxFilingsPreview(null);
    if (key === "cicReport") setCicPreview(null);
  };

  // --- Figures ---

  // Cross-field rules, worked out once per render and blamed on the field they
  // show under (see validateFigureConsistency).
  const consistency = validateFigureConsistency(figures);

  // A figure's own problem first, then the rules that involve several figures.
  const figureErrorFor = (field: LiteFigureField): FigureError =>
    validateFigure(field, figures[field.key]) ?? consistency[field.key] ?? null;

  const isFigureStepValid = (step: number): boolean =>
    figureFieldsForStep(step).every((field) => figureErrorFor(field) === null);

  // What to show under each figure. Only once the file(s) it is read from have
  // been read: before that, a blank figure is just a file not yet chosen and
  // the upload tile is the thing to act on.
  const figureErrors = Object.fromEntries(
    LITE_FIGURE_FIELDS.map((field) => [
      field.key,
      figureFilesRead(field, eInvoicePreview, taxFilingsPreview)
        ? figureErrorFor(field)
        : null,
    ]),
  ) as FigureErrors;

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
      // Nothing to send for a requirement already met by KYB — there is no
      // staged file, and uploadOne would fail on the null. The certificate is
      // already in storage against the verification attempt.
      if (isSatisfiedByKyb(key)) continue;
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
          LITE_FIGURE_FIELDS.map((field) => [
            field.key,
            parseFigure(figures[field.key], field.unit),
          ]),
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
      const { message, code } = (error ?? {}) as {
        message?: string;
        code?: string;
      };
      // The backend reads the e-invoice zip at confirm and refuses one it
      // cannot use (not this company's invoices, a month twice, a quarter
      // instead of a month...). That file has to be replaced, so mark it
      // like a bad pick and send the SME back to the step it came from.
      const refused = code?.startsWith("EINVOICE_")
        ? ({ key: "eInvoiceData", step: EINVOICE_STEP } as const)
        : code?.startsWith("TAXFILINGS_")
          ? ({ key: "taxFilings", step: TAX_FILINGS_STEP } as const)
          : code?.startsWith("CIC_")
            ? ({ key: "cicReport", step: CIC_STEP } as const)
            : null;
      if (refused) {
        const reason = evidenceErrorCopy(code, message);
        updateDocument(refused.key, {
          status: "error",
          errorKind: "validation",
          error: reason,
        });
        setCurrentStep(refused.step);
        toast({
          variant: "destructive",
          title: t("dashboard.sme.eInvoiceRefusedTitle"),
          description: reason,
        });
        return;
      }
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
  const areStepDocumentsReady = (step: number): boolean =>
    (STEP_DOCUMENTS[step] ?? []).every(
      (key) => isStaged(documents[key]) || isSatisfiedByKyb(key),
    );

  // A step is satisfied when its documents hold valid staged files AND its
  // figures parse. Step 2 has both; a step with neither can never pass.
  const isStepValid = (step: number): boolean => {
    if (step === REVIEW_STEP) return canSend;
    const hasDocs = !!STEP_DOCUMENTS[step];
    const hasFigures = figureFieldsForStep(step).length > 0;
    if (!hasDocs && !hasFigures) return false;
    // Still reading a zip: the figures it will fill are not in yet.
    if (step === EINVOICE_STEP && previewEInvoice.isPending) return false;
    if (step === TAX_FILINGS_STEP && previewTaxFilings.isPending) return false;
    if (step === CIC_STEP && previewCic.isPending) return false;
    return (
      (!hasDocs || areStepDocumentsReady(step)) &&
      (!hasFigures || isFigureStepValid(step))
    );
  };

  const canNavigateToStep = (targetStep: number): boolean => {
    for (let s = 1; s < targetStep; s++) {
      if (!isStepValid(s)) return false;
    }
    return true;
  };

  // With both files in, a blocked figure step is a figure the files did not
  // state; the fields say which, and the toast says what to do about it.
  const reportBlockedStep = (step: number) => {
    // A missing or refused file is the thing to fix first on a mixed step.
    if (figureFieldsForStep(step).length && areStepDocumentsReady(step)) {
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
    (field) => figureErrorFor(field) === null,
  );
  const canSend =
    ALL_DOCUMENT_KEYS.every(
      (key) => isStaged(documents[key]) || isSatisfiedByKyb(key),
    ) && allFiguresValid;
  const allFilesUploaded = ALL_DOCUMENT_KEYS.every(
    (key) => documents[key].status === "uploaded",
  );
  // Documents this application still has to send. A requirement met by KYB is
  // not one of them, so it must not count toward the progress bar either —
  // otherwise "3 of 4" can never reach 4 and the wizard looks stuck.
  const sendableKeys = ALL_DOCUMENT_KEYS.filter(
    (key) => !isSatisfiedByKyb(key),
  );
  const uploadedCount = sendableKeys.filter(
    (key) => documents[key].status === "uploaded",
  ).length;
  // Confirm + submit running after every file is up.
  const isFinalizing =
    saveFigures.isPending ||
    confirmUploads.isPending ||
    submitApplication.isPending;

  return {
    // The stored KYB certificate, or null when nothing was retained. Drives
    // both the "already provided" state and its preview link.
    kybCertificate: kybCertificate ?? null,
    isSatisfiedByKyb,
    // State
    documents,
    eInvoicePreview,
    isReadingEInvoices: previewEInvoice.isPending,
    taxFilingsPreview,
    isReadingTaxFilings: previewTaxFilings.isPending,
    cicPreview,
    isReadingCic: previewCic.isPending,
    figures,
    figureErrors,
    // Whether, and why not, the year before the invoices could be worked out.
    priorYear,
    currentStep,
    totalSteps: TOTAL_STEPS,
    reviewStep: REVIEW_STEP,
    isSending,
    isFinalizing,
    isSubmitted,
    canSend,
    allFilesUploaded,
    uploadedCount,
    totalDocuments: sendableKeys.length,
    documentKeys: sendableKeys,

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
    handleSend,
  };
}
