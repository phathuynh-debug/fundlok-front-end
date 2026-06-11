import axios from 'axios';
import { apiClient } from '@/lib/api-client';
import { UPLOADS_ENDPOINTS } from '@/lib/endpoints';

// Document upload flow for loan applications:
// init-upload (per file) → PUT raw bytes to R2 via presigned URL → confirm (batched).
// Files never go through the API server; only metadata does.

export type LoanDocumentType =
  | 'legal_charter'
  | 'business_registration'
  | 'vat_tax_zip'
  | 'financial_report'
  | 'e_invoice_data'
  | 'cic_report';

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
  legal_charter: { extensions: ['pdf'], maxSizeMb: 25 },
  business_registration: { extensions: ['pdf'], maxSizeMb: 25 },
  vat_tax_zip: { extensions: ['zip'], maxSizeMb: 200 },
  financial_report: { extensions: ['pdf'], maxSizeMb: 25 },
  e_invoice_data: { extensions: ['zip', 'xlsx', 'csv', 'xml'], maxSizeMb: 100 },
  cic_report: { extensions: ['pdf'], maxSizeMb: 25 },
};

const CONTENT_TYPES_BY_EXTENSION: Record<string, string[]> = {
  pdf: ['application/pdf'],
  zip: ['application/zip', 'application/x-zip-compressed'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  csv: ['text/csv'],
  xml: ['application/xml', 'text/xml'],
};

function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
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
  | { code: 'invalid_extension'; allowedExtensions: string }
  | { code: 'file_too_large'; maxSizeMb: number };

export function validateLoanDocumentFile(
  documentType: LoanDocumentType,
  file: File
): FileValidationError | null {
  const rules = DOCUMENT_TYPE_RULES[documentType];
  if (!rules.extensions.includes(getExtension(file.name))) {
    return {
      code: 'invalid_extension',
      allowedExtensions: rules.extensions.map((ext) => `.${ext}`).join(', '),
    };
  }
  if (file.size > rules.maxSizeMb * 1024 * 1024) {
    return { code: 'file_too_large', maxSizeMb: rules.maxSizeMb };
  }
  return null;
}

export const uploadsService = {
  async initUpload(payload: InitUploadPayload) {
    return apiClient.post<InitUploadResponse>(
      UPLOADS_ENDPOINTS.initUpload,
      payload
    );
  },

  // Raw axios on purpose: the presigned URL is the auth (no cookies), and the
  // Content-Type must equal the one sent to init-upload or R2 rejects with 403.
  async uploadToStorage(
    uploadUrl: string,
    file: File,
    contentType: string,
    onProgress?: (percent: number) => void
  ) {
    await axios.put(uploadUrl, file, {
      headers: { 'Content-Type': contentType },
      withCredentials: false,
      timeout: 0,
      onUploadProgress: (event) => {
        if (event.total) {
          onProgress?.(Math.round((event.loaded / event.total) * 100));
        }
      },
    });
  },

  async confirm(payload: ConfirmUploadsPayload) {
    return apiClient.post<ConfirmUploadsResponse>(
      UPLOADS_ENDPOINTS.confirm,
      payload
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
        message: `Extension not allowed for ${documentType} (allowed: ${rules.extensions.join(', ')})`,
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
