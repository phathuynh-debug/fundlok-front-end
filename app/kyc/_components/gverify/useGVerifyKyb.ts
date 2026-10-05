"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGVerifyKybVerify } from "@/hooks/use-gverify";
import type {
  GVerifyKybDocumentType,
  GVerifyKybVerifyResponse,
} from "@/services/gverify.service";
import { compressImage, fileToBase64 } from "./useGVerifyKyc";

// Mirror of the backend limits (app/gverify/kyb_service.py re-validates).
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
export const KYB_ACCEPT = ACCEPTED_TYPES.join(",");

// i18n key suffix under kyc.kyb.* / kyc.gv.* — translated where rendered.
export type KybDocumentError =
  "invalidTypeDoc" | "tooLarge" | "processFailed" | null;

export interface StagedDocument {
  file: File | null;
  previewUrl: string | null; // images only — PDFs render as an icon tile
  error: KybDocumentError;
}

const empty = (): StagedDocument => ({
  file: null,
  previewUrl: null,
  error: null,
});
export interface KybDeclaredDetails {
  taxCode: string;
  licenseCode: string;
}

const emptyDetails = (): KybDeclaredDetails => ({
  taxCode: "",
  licenseCode: "",
});

// Local capture state for the GVerify KYB screen: one staged registration
// certificate (photo or PDF) + the certificate variant, and the submit that
// turns them into the base64 payload. Photos are downscaled like the KYC
// images; PDFs pass through untouched (only size-checked).
export function useGVerifyKyb() {
  const [document, setDocument] = useState<StagedDocument>(empty());
  const [documentType, setDocumentType] =
    useState<GVerifyKybDocumentType>("COMPANY");
  const [details, setDetails] = useState<KybDeclaredDetails>(emptyDetails);
  const { mutateAsync: verify, isPending: submitting } = useGVerifyKybVerify();

  // Update one declared field by key, e.g. setDetail('taxCode', value).
  const setDetail = useCallback(
    <K extends keyof KybDeclaredDetails>(
      field: K,
      value: KybDeclaredDetails[K],
    ) => setDetails((prev) => ({ ...prev, [field]: value })),
    [],
  );

  const urlsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const pickSeqRef = useRef(0);

  const setFile = useCallback((file: File | null) => {
    const seq = ++pickSeqRef.current;

    const stage = (next: StagedDocument) => {
      if (pickSeqRef.current !== seq) return; // superseded by a newer pick
      setDocument((prev) => {
        if (prev.previewUrl) {
          URL.revokeObjectURL(prev.previewUrl);
          urlsRef.current.delete(prev.previewUrl);
        }
        return next;
      });
    };

    if (!file) {
      stage(empty());
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      stage({ file: null, previewUrl: null, error: "invalidTypeDoc" });
      return;
    }
    if (file.type === "application/pdf") {
      if (file.size > MAX_DOCUMENT_BYTES) {
        stage({ file: null, previewUrl: null, error: "tooLarge" });
        return;
      }
      stage({ file, previewUrl: null, error: null });
      return;
    }

    void compressImage(file)
      .catch(() => file)
      .then((staged) => {
        if (staged.size > MAX_DOCUMENT_BYTES) {
          stage({ file: null, previewUrl: null, error: "tooLarge" });
          return;
        }
        const previewUrl = URL.createObjectURL(staged);
        urlsRef.current.add(previewUrl);
        stage({ file: staged, previewUrl, error: null });
      })
      .catch(() =>
        stage({ file: null, previewUrl: null, error: "processFailed" }),
      );
  }, []);

  const reset = useCallback(() => setFile(null), [setFile]);

  // A different certificate type means a different physical document — clear
  // any staged file so a COMPANY cert can't be submitted as HOUSEHOLD.
  const selectDocumentType = useCallback(
    (value: GVerifyKybDocumentType) => {
      if (value !== documentType) setFile(null);
      setDocumentType(value);
    },
    [documentType, setFile],
  );

  const ready = document.file !== null;

  const submit = useCallback(async (): Promise<GVerifyKybVerifyResponse> => {
    const document_b64 = await fileToBase64(document.file as File);
    const trimmedTax = details.taxCode.trim();
    const trimmedLicense = details.licenseCode.trim();
    return verify({
      document_b64,
      document_type: documentType,
      ...(trimmedTax ? { tax_code: trimmedTax } : {}),
      ...(trimmedLicense ? { license_code: trimmedLicense } : {}),
    });
  }, [document, documentType, details, verify]);

  return {
    document,
    setFile,
    reset,
    documentType,
    selectDocumentType,
    details,
    setDetail,
    ready,
    submit,
    submitting,
  };
}
