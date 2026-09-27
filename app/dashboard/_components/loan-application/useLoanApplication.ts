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
  clampPercentInput,
  validateFigureConsistency,
  type LiteFigureField,
  LITE_FIGURE_KEYS,
  figureFieldsForStep,
  parseFigure,
  validateFigure,
  type FigureError,
  type LiteFigureKey,
} from "./lite-grading-fields";

// Steps 2 and 3 each take one file that the figures are read out of: the
// e-invoice zip (revenue) and the tax filings (costs). See readEInvoices and
// readTaxFilings.
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

// Steps 2 and 3 take BOTH a file and figures: the file is the evidence and
// the figures it can state are read out of it.
const STEP_DOCUMENTS: Record<number, DocumentKey[]> = {
  1: ["companyCharter", "companyRegistration"],
  2: ["eInvoiceData"],
  3: ["taxFilings"],
  4: ["cicReport"],
};

const ALL_DOCUMENT_KEYS = Object.keys(DOCUMENT_TYPES) as DocumentKey[];

// 1 legal · 2 revenue (e-invoices) · 3 costs · 4 CIC · 5 review-and-send.
// The e-invoice upload used to be a step of its own; it now lives on the
// revenue step it is evidence for.
const REVIEW_STEP = 5;
const TOTAL_STEPS = 5;
export const EINVOICE_STEP = 2;
export const TAX_FILINGS_STEP = 3;
export const CIC_STEP = 4;

// The figures the e-invoices supply. Filled from the preview and locked while
// the zip is attached, so the figures cannot drift from the evidence they
// came from. The two customer shares are step-3 fields, but only the invoices
// know who the customers are, so step 2's upload fills them.
const EINVOICE_FIGURES: Partial<Record<LiteFigureKey, keyof EInvoicePreview>> =
  {
    revenue_last_12m: "revenue_last_12m",
    revenue_best_month: "revenue_best_month",
    revenue_worst_month: "revenue_worst_month",
    conc_top1_pct: "conc_top1_pct",
    conc_top3_pct: "conc_top3_pct",
  };

// The step-3 figures the year-end statements state outright. Fixed and
// variable cost are deliberately absent: no filing splits costs by behaviour,
// so the SME types them (the statements' admin and selling expense are shown
// as hints).
const TAX_FILINGS_FIGURES: Partial<
  Record<LiteFigureKey, keyof TaxFilingsPreview>
> = {
  cogs_y1: "cogs_y1",
  owner_withdrawal_pct: "owner_withdrawal_pct",
};

// The statement lines nearest to the two costs no filing splits by behaviour.
// Filled as a STARTING POINT, not locked: administration is mostly fixed and
// selling mostly variable, but only the SME knows the real split.
const TAX_FILINGS_SUGGESTED: Partial<
  Record<LiteFigureKey, keyof TaxFilingsPreview>
> = {
  fixed_cost_y1: "admin_expense_vnd",
  variable_cost_excl_cogs_y1: "selling_expense_vnd",
};

/** The numeric values a preview supplies for a figure map. */
function prefillFrom<P>(
  map: Partial<Record<LiteFigureKey, keyof P>>,
  preview: P,
): { values: Partial<FigureValues>; filled: LiteFigureKey[] } {
  const values: Partial<FigureValues> = {};
  const filled: LiteFigureKey[] = [];
  for (const [figure, source] of Object.entries(map) as [
    LiteFigureKey,
    keyof P,
  ][]) {
    const value = preview[source];
    if (typeof value === "number") {
      values[figure] = String(value);
      filled.push(figure);
    }
  }
  return { values, filled };
}

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
  // from the stored file at Send, and there is no figure on step 4 to fill.
  const [cicPreview, setCicPreview] = useState<CicPreview | null>(null);
  // What each attached evidence file says, and which figures it filled. Kept
  // per source so removing one file clears only its own figures.
  const [eInvoicePreview, setEInvoicePreview] =
    useState<EInvoicePreview | null>(null);
  const [eInvoiceLocked, setEInvoiceLocked] = useState<LiteFigureKey[]>([]);
  const [taxFilingsPreview, setTaxFilingsPreview] =
    useState<TaxFilingsPreview | null>(null);
  const [taxLocked, setTaxLocked] = useState<LiteFigureKey[]>([]);
  // What the filings suggested for the editable costs, to clear them with
  // the file only while the SME has left them as suggested.
  const [taxSuggested, setTaxSuggested] = useState<Partial<FigureValues>>({});
  const lockedFigures = [...eInvoiceLocked, ...taxLocked];
  // Which file a locked figure was read from, for the note under it.
  const figureLockSource = (
    key: LiteFigureKey,
  ): "invoices" | "filings" | null =>
    eInvoiceLocked.includes(key)
      ? "invoices"
      : taxLocked.includes(key)
        ? "filings"
        : null;

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
    // Step 4 reads a whole folder of monthly exports. A single loose export is
    // the likeliest mistake, so name the fix rather than list extensions.
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

  const clearFigures = (keys: LiteFigureKey[]) =>
    setFigures((prev) => {
      const next = { ...prev };
      for (const k of keys) next[k] = "";
      return next;
    });

  const fillFigures = (
    values: Partial<FigureValues>,
    keys: LiteFigureKey[],
  ) => {
    setFigures((prev) => ({ ...prev, ...values }));
    setFigureErrors((prev) => {
      const next = { ...prev };
      for (const k of keys) next[k] = null;
      return next;
    });
  };

  // Clears the figures a file filled in, so removing or replacing it can
  // never leave its numbers behind looking typed.
  const releaseEInvoiceFigures = () => {
    setEInvoicePreview(null);
    clearFigures(eInvoiceLocked);
    setEInvoiceLocked([]);
  };

  const releaseTaxFilingsFigures = () => {
    setTaxFilingsPreview(null);
    clearFigures([
      ...taxLocked,
      ...(Object.keys(taxSuggested) as LiteFigureKey[]).filter(
        (k) => figures[k] === taxSuggested[k],
      ),
    ]);
    setTaxLocked([]);
    setTaxSuggested({});
  };

  // Reads the zip on the server as soon as it is picked and fills step 2 from
  // it. Advisory: confirm re-parses the STORED file at Send, so a preview can
  // not plant a figure the evidence does not support.
  const readEInvoices = async (file: File) => {
    releaseEInvoiceFigures();
    try {
      const preview = await previewEInvoice.mutateAsync({
        loanApplicationId,
        file,
      });
      const { values, filled } = prefillFrom(EINVOICE_FIGURES, preview);
      fillFigures(values, filled);
      setEInvoiceLocked(filled);
      setEInvoicePreview(preview);
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

  // Reads the tax filings as soon as they are picked and fills step 3's
  // statutory figures (cost of goods sold, owner withdrawal). Same contract as
  // readEInvoices: advisory, re-parsed from storage at Send.
  const readTaxFilings = async (file: File) => {
    releaseTaxFilingsFigures();
    try {
      const preview = await previewTaxFilings.mutateAsync({
        loanApplicationId,
        file,
      });
      const { values, filled } = prefillFrom(TAX_FILINGS_FIGURES, preview);
      // Suggestions only fill blanks: never overwrite what the SME typed.
      const suggested = prefillFrom(TAX_FILINGS_SUGGESTED, preview);
      const blanks = suggested.filled.filter(
        (k) => !figures[k].trim() || figures[k] === taxSuggested[k],
      );
      const suggestedValues = Object.fromEntries(
        blanks.map((k) => [k, suggested.values[k]]),
      ) as Partial<FigureValues>;
      fillFigures({ ...values, ...suggestedValues }, [...filled, ...blanks]);
      setTaxLocked(filled);
      setTaxSuggested(suggestedValues);
      setTaxFilingsPreview(preview);
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
  // code is known (EINVOICE_* for step 2, TAXFILINGS_* for step 3, CIC_* for
  // step 4).
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
    if (key === "eInvoiceData") releaseEInvoiceFigures();
    if (key === "taxFilings") releaseTaxFilingsFigures();
    if (key === "cicReport") setCicPreview(null);
  };

  // --- Typed figures ---

  const setFigure = (key: LiteFigureKey, raw: string) => {
    // Read from the attached e-invoices: remove the zip to type it instead.
    if (lockedFigures.includes(key)) return;
    // Percentages are held inside 0-100 as they are typed, so an impossible
    // share never survives to become a 422 at Send. Applied here rather than
    // in the input so every caller of setFigure gets it.
    const field = LITE_FIGURE_FIELDS.find((f) => f.key === key);
    const next = field?.unit === "pct" ? clampPercentInput(raw) : raw;
    setFigures((prev) => ({ ...prev, [key]: next }));
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

  // Per-field errors plus the cross-field rules. The consistency errors are
  // blamed on a specific input so they can render under it, rather than in a
  // toast naming a snake_case field the applicant never saw.
  const figureErrorFor = (field: LiteFigureField): FigureError =>
    validateFigure(field, figures[field.key]) ??
    validateFigureConsistency(figures)[field.key] ??
    null;

  const isFigureStepValid = (step: number): boolean =>
    figureFieldsForStep(step).every((field) => figureErrorFor(field) === null);

  /** Marks every invalid field on a step so the user can see what is missing. */
  const revealFigureErrors = (step: number) => {
    const fields = figureFieldsForStep(step);
    if (!fields.length) return;
    setFigureErrors((prev) => {
      const next = { ...prev };
      for (const field of fields) {
        next[field.key] = figureErrorFor(field);
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
    // Still reading the zip: the figures it will fill are not in yet.
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

  // A figure step's problem is per-field, so surface it on the fields rather
  // than in a toast that cannot say which number is missing.
  const reportBlockedStep = (step: number) => {
    // A missing or refused file is the thing to fix first on a mixed step.
    if (figureFieldsForStep(step).length && areStepDocumentsReady(step)) {
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
    lockedFigures,
    figureLockSource,
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
    totalDocuments: sendableKeys.length,
    documentKeys: sendableKeys,

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
