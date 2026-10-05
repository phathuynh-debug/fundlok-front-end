import axios from "axios";
import { apiClient } from "@/lib/api-client";
import { UPLOADS_ENDPOINTS } from "@/lib/endpoints";

// Document upload flow for loan applications:
// init-upload (per file) → PUT raw bytes to R2 via presigned URL → confirm (batched).
// Files never go through the API server; only metadata does.

export type LoanDocumentType =
  | "legal_charter"
  | "business_registration"
  | "vat_tax_zip"
  | "financial_report"
  | "e_invoice_data"
  | "cic_report"
  | "tax_filings";

export interface InitUploadPayload {
  loan_application_id: string;
  document_type: LoanDocumentType;
  filename: string;
  content_type: string;
  size: number;
}

export interface InitUploadResponse {
  document_id: string;
  file_key: string;
  upload_url: string;
  expires_in: number;
}

export interface ConfirmUploadsPayload {
  loan_application_id: string;
  file_keys: string[];
}

export interface ApplicationDocument {
  id: string;
  loan_application_id: string;
  document_type: LoanDocumentType;
  file_key: string;
  original_filename: string;
  content_type: string;
  file_size_bytes: number;
  status: string;
  uploaded_at: string;
}

export interface ConfirmUploadsResponse {
  documents: ApplicationDocument[];
}

/** What the e-invoice zip says, read before Send to prefill step 2. */
export interface EInvoicePreview {
  seller_tax_code: string;
  period_start: string; // MM/YYYY
  period_end: string;
  months_covered: number;
  monthly_revenue: { period: string; revenue_vnd: number }[];
  /** Only from 12 consecutive months; null means the SME types it. */
  revenue_last_12m: number | null;
  revenue_best_month: number | null;
  revenue_worst_month: number | null;
  conc_top1_pct: number | null;
  conc_top3_pct: number | null;
  warnings: { code: string; detail: string }[];
}

/** What the tax filings say, read before Send to prefill step 2. */
export interface TaxFilingsPreview {
  fiscal_year: number;
  regime: string; // "TT133" | "TT200"
  signed: boolean;
  tax_code: string;
  cogs_y1: number;
  /** % of net profit paid to owners; null when the year made no profit. */
  owner_withdrawal_pct: number | null;
  /**
   * Fixed and variable cost, by the backend's stated rule (no filing labels a
   * cost fixed or variable): fixed = management expense + financial expense,
   * variable = selling expense.
   */
  fixed_cost_y1: number;
  variable_cost_excl_cogs_y1: number;
  /**
   * What they are made of. The management expense is line 26 on TT200 and the
   * combined line 24 on TT133, which has no selling line (0 here). The
   * financial expense is line 22 and includes the interest of line 23.
   */
  admin_expense_vnd: number;
  selling_expense_vnd: number;
  financial_expense_vnd: number;
  revenue_net_vnd: number;
  net_profit_vnd: number;
  interest_expense_vnd: number;
  vat_months: number;
  vat_period: string | null;
  /**
   * The signed monthly VAT revenue, oldest first, empty when the upload was the
   * statement alone. It is what the year BEFORE the e-invoice window is worked
   * out from. Optional so this build still runs against a backend that does not
   * send it yet: absent reads as "no declarations".
   */
  vat_monthly_revenue?: { period: string; revenue_vnd: number }[];
  warnings: { code: string; detail: string }[];
}

/** What the CIC report was read as. Amounts are CIC's unit, million đồng. */
export interface CicPreview {
  /** "individual" is a person's report — usually the owner's. */
  subject_type: "individual" | "business";
  subject_name: string | null;
  score: number | null;
  rank: number | null;
  rank_band: [number, number] | null;
  rank_label:
    "very_good" | "good" | "average" | "below_average" | "poor" | null;
  percentile: number | null;
  scored_on: string | null; // ISO date
  queried_on: string | null;
  age_days: number | null;
  lenders: number;
  debt_total_vnd_million: number | null;
  debt_attention_vnd_million: number | null;
  debt_bad_vnd_million: number | null;
  negative_history: boolean | null;
  signed: boolean;
  warnings: { code: string; detail: string }[];
}

export interface UploadedDocument {
  documentId: string;
  fileKey: string;
}

// Backend validation rules, mirrored client-side so users get instant feedback
// instead of a 400 after the init-upload round-trip.
export const DOCUMENT_TYPE_RULES: Record<
  LoanDocumentType,
  { extensions: string[]; maxSizeMb: number }
> = {
  legal_charter: { extensions: ["pdf"], maxSizeMb: 25 },
  business_registration: { extensions: ["pdf"], maxSizeMb: 25 },
  vat_tax_zip: { extensions: ["zip"], maxSizeMb: 200 },
  financial_report: { extensions: ["pdf"], maxSizeMb: 25 },
  // Handbook §5.10: the signed XML original is the only e-invoice evidence we
  // accept — a spreadsheet can be edited and proves nothing, so .xlsx and .csv
  // are rejected at upload rather than at verification. A .zip is still allowed
  // as a container for the signed XMLs. The backend mirror
  // (app/uploads/schemas.py) enforces the same list, and it is the gate that
  // actually holds.
  // One .zip: the folder of the tax portal's monthly invoice-list exports.
  // The backend opens it at confirm and reads every month, so a loose .xlsx
  // (one month) is refused here with a message saying to zip the folder.
  e_invoice_data: { extensions: ["zip"], maxSizeMb: 100 },
  cic_report: { extensions: ["pdf"], maxSizeMb: 25 },
  // The year-end statement XML (B02 package), or the .zip of the tax folder
  // holding it with the monthly VAT declarations.
  tax_filings: { extensions: ["zip", "xml"], maxSizeMb: 100 },
};

const CONTENT_TYPES_BY_EXTENSION: Record<string, string[]> = {
  pdf: ["application/pdf"],
  zip: ["application/zip", "application/x-zip-compressed"],
  // No xlsx/csv entry: no document type accepts a spreadsheet any more, and
  // resolveContentType() returning null for one is what makes the rejection
  // stick rather than falling through to a guessed type.
  xml: ["application/xml", "text/xml"],
};

function getExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

// The content_type sent to init-upload must match the file's extension, and the
// R2 PUT must reuse it verbatim. Browsers report inconsistent MIME types
// (e.g. .zip as application/x-zip-compressed, .csv as application/vnd.ms-excel),
// so derive from the extension and only keep file.type when it's an accepted alias.
export function resolveContentType(file: File): string | null {
  const allowed = CONTENT_TYPES_BY_EXTENSION[getExtension(file.name)];
  if (!allowed) return null;
  return allowed.includes(file.type) ? file.type : allowed[0];
}

export type FileValidationError =
  | { code: "invalid_extension"; allowedExtensions: string }
  | { code: "file_too_large"; maxSizeMb: number };

export function validateLoanDocumentFile(
  documentType: LoanDocumentType,
  file: File,
): FileValidationError | null {
  const rules = DOCUMENT_TYPE_RULES[documentType];
  if (!rules.extensions.includes(getExtension(file.name))) {
    return {
      code: "invalid_extension",
      allowedExtensions: rules.extensions.map((ext) => `.${ext}`).join(", "),
    };
  }
  if (file.size > rules.maxSizeMb * 1024 * 1024) {
    return { code: "file_too_large", maxSizeMb: rules.maxSizeMb };
  }
  return null;
}

export const uploadsService = {
  async initUpload(payload: InitUploadPayload) {
    return apiClient.post<InitUploadResponse>(
      UPLOADS_ENDPOINTS.initUpload,
      payload,
    );
  },

  // Raw axios on purpose: the presigned URL is the auth (no cookies), and the
  // Content-Type must equal the one sent to init-upload or R2 rejects with 403.
  async uploadToStorage(
    uploadUrl: string,
    file: File,
    contentType: string,
    onProgress?: (percent: number) => void,
  ) {
    await axios.put(uploadUrl, file, {
      headers: { "Content-Type": contentType },
      withCredentials: false,
      timeout: 0,
      onUploadProgress: (event) => {
        if (event.total) {
          onProgress?.(Math.round((event.loaded / event.total) * 100));
        }
      },
    });
  },

  // The raw zip as the request body — the backend reads it and stores
  // nothing. Advisory: confirm re-parses the stored file at Send.
  async previewEInvoice(loanApplicationId: string, file: File) {
    return apiClient.post<EInvoicePreview>(
      UPLOADS_ENDPOINTS.einvoicePreview,
      file,
      {
        params: { loan_application_id: loanApplicationId },
        headers: { "Content-Type": "application/zip" },
      },
    );
  },

  // Raw body again: a .zip of the folder or the statement .xml alone.
  async previewTaxFilings(loanApplicationId: string, file: File) {
    const isZip = file.name.toLowerCase().endsWith(".zip");
    return apiClient.post<TaxFilingsPreview>(
      UPLOADS_ENDPOINTS.taxFilingsPreview,
      file,
      {
        params: { loan_application_id: loanApplicationId },
        headers: {
          "Content-Type": isZip ? "application/zip" : "application/xml",
        },
      },
    );
  },

  async previewCic(loanApplicationId: string, file: File) {
    return apiClient.post<CicPreview>(UPLOADS_ENDPOINTS.cicPreview, file, {
      params: { loan_application_id: loanApplicationId },
      headers: { "Content-Type": "application/pdf" },
    });
  },

  async confirm(payload: ConfirmUploadsPayload) {
    return apiClient.post<ConfirmUploadsResponse>(
      UPLOADS_ENDPOINTS.confirm,
      payload,
    );
  },

  // init-upload + PUT for a single file. Re-running this for the same
  // document_type is the official replace flow — the new object overwrites
  // the old one, no delete call needed. On failure just call it again.
  async uploadDocument(params: {
    loanApplicationId: string;
    documentType: LoanDocumentType;
    file: File;
    onProgress?: (percent: number) => void;
  }): Promise<UploadedDocument> {
    const { loanApplicationId, documentType, file, onProgress } = params;

    const contentType = resolveContentType(file);
    if (!contentType) {
      const rules = DOCUMENT_TYPE_RULES[documentType];
      throw {
        message: `Extension not allowed for ${documentType} (allowed: ${rules.extensions.join(", ")})`,
      };
    }

    const init = await this.initUpload({
      loan_application_id: loanApplicationId,
      document_type: documentType,
      filename: file.name,
      content_type: contentType,
      size: file.size,
    });

    // upload_url expires in 15 minutes — use it immediately.
    await this.uploadToStorage(init.upload_url, file, contentType, onProgress);

    // Never construct file_key ourselves; always keep the returned value.
    return { documentId: init.document_id, fileKey: init.file_key };
  },
};
