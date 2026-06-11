'use client';

import { useMutation } from '@tanstack/react-query';
import type { ApiError } from '@/lib/types';
import {
  uploadsService,
  type ConfirmUploadsPayload,
  type ConfirmUploadsResponse,
  type LoanDocumentType,
  type UploadedDocument,
} from '@/services/uploads.service';

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
