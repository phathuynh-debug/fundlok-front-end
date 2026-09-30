"use client";

import { useMutation } from "@tanstack/react-query";
import type { ApiError } from "@/lib/types";
import {
  uploadsService,
  type ConfirmUploadsPayload,
  type ConfirmUploadsResponse,
  type EInvoicePreview,
  type CicPreview,
  type TaxFilingsPreview,
  type LoanDocumentType,
  type UploadedDocument,
} from "@/services/uploads.service";

export interface UploadLoanDocumentVariables {
  loanApplicationId: string;
  documentType: LoanDocumentType;
  file: File;
  onProgress?: (percent: number) => void;
}

// One mutation per file: init-upload + direct PUT to R2.
// Retrying after a network drop is just calling mutate again with the same
// variables — the backend reuses the document record and overwrites the object.
export function useUploadLoanDocument() {
  return useMutation<UploadedDocument, ApiError, UploadLoanDocumentVariables>({
    mutationFn: (variables) => uploadsService.uploadDocument(variables),
  });
}

// Batched confirm of all collected file_keys, called once on final submit.
// Idempotent server-side — re-sending already-confirmed keys is a no-op.
export function useConfirmUploads() {
  return useMutation<ConfirmUploadsResponse, ApiError, ConfirmUploadsPayload>({
    mutationFn: (payload) => uploadsService.confirm(payload),
  });
}

// Reads the e-invoice zip as soon as it is picked (step 2), for the prefill.
export function usePreviewEInvoice() {
  return useMutation<
    EInvoicePreview,
    ApiError,
    { loanApplicationId: string; file: File }
  >({
    mutationFn: ({ loanApplicationId, file }) =>
      uploadsService.previewEInvoice(loanApplicationId, file),
    retry: false,
  });
}

// Reads the CIC report as soon as it is picked (step 3), for its score and debt.
export function usePreviewCic() {
  return useMutation<
    CicPreview,
    ApiError,
    { loanApplicationId: string; file: File }
  >({
    mutationFn: ({ loanApplicationId, file }) =>
      uploadsService.previewCic(loanApplicationId, file),
    retry: false,
  });
}

// Reads the tax filings as soon as they are picked (step 2), for the prefill
// and the monthly VAT revenue the year before the invoices is worked out from.
export function usePreviewTaxFilings() {
  return useMutation<
    TaxFilingsPreview,
    ApiError,
    { loanApplicationId: string; file: File }
  >({
    mutationFn: ({ loanApplicationId, file }) =>
      uploadsService.previewTaxFilings(loanApplicationId, file),
    retry: false,
  });
}
