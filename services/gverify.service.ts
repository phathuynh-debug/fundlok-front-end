import { apiClient } from "@/lib/api-client";
import { GVERIFY_ENDPOINTS } from "@/lib/endpoints";

// GVerify attempt statuses (backend spec:
// docs/specs/gverify/ekyc-kyc-verification.md). Every attempt ends terminal
// within the request that created it; "NOT_STARTED" is our synthetic value for
// a user with no attempts (the status endpoint 404s). MANUAL_REVIEW is
// KYB-only: borderline results parked for an ops decision.
export type GVerifyStatus =
  "PENDING" | "APPROVED" | "REJECTED" | "FAILED" | "MANUAL_REVIEW";

export interface GVerifyVerifyPayload {
  id_front_b64: string;
  id_back_b64: string;
  portrait_b64: string;
}

// POST /gverify/kyc/verify — synchronous verdict (APPROVED | REJECTED).
export interface GVerifyVerifyResponse {
  verification_id: string;
  status: GVerifyStatus;
  is_approved: boolean;
  rejection_reason: string | null;
  person_number: string | null;
  full_name: string | null;
  date_of_birth: string | null;
  face_match_score: number | null;
  created_at: string | null;
}

// GET /gverify/kyc/status — the caller's latest attempt.
export interface GVerifyStatusResponse {
  verification_id: string;
  status: GVerifyStatus | "NOT_STARTED";
  is_terminal: boolean;
  is_approved: boolean;
  rejection_reason: string | null;
  person_number: string | null;
  full_name: string | null;
  updated_at: string | null;
}

// Synthetic status for a user who has never attempted (the endpoint 404s).
export function gverifyNotStarted(): GVerifyStatusResponse {
  return {
    verification_id: "",
    status: "NOT_STARTED",
    is_terminal: false,
    is_approved: false,
    rejection_reason: null,
    person_number: null,
    full_name: null,
    updated_at: null,
  };
}

// A verify response reshaped so it can seed the status query cache.
export function verifyResponseToStatus(
  data: GVerifyVerifyResponse,
): GVerifyStatusResponse {
  return {
    verification_id: data.verification_id,
    status: data.status,
    is_terminal: true,
    is_approved: data.is_approved,
    rejection_reason: data.rejection_reason,
    person_number: data.person_number,
    full_name: data.full_name,
    updated_at: data.created_at,
  };
}

// POST /gverify/kyc/handoff — short-lived token for the phone capture flow.
export interface GVerifyHandoffResponse {
  token: string;
  expires_in_seconds: number;
}

// ---------- KYB (business verification, SME) ----------

// Certificate variant, matching GVerify OCR X's `type` parameter.
export type GVerifyKybDocumentType = "COMPANY" | "COMPANY_BRANCH";

export interface GVerifyKybVerifyPayload {
  document_b64: string; // JPEG | PNG | PDF, decoded size ≤ 10MB
  document_type: GVerifyKybDocumentType;
  tax_code?: string;
  license_code?: string;
}

export interface GVerifyKybRepresentative {
  name: string | null;
  id_number: string | null;
  title: string | null;
}

// POST /gverify/kyb/verify — synchronous verdict (APPROVED | REJECTED).
export interface GVerifyKybVerifyResponse {
  verification_id: string;
  status: GVerifyStatus;
  is_approved: boolean;
  rejection_reason: string | null;
  tax_code: string | null;
  business_name: string | null;
  business_type: string | null;
  business_status: string | null;
  representatives: GVerifyKybRepresentative[];
  created_at: string | null;
}

// GET /gverify/kyb/status — the caller's latest attempt.
export interface GVerifyKybStatusResponse {
  verification_id: string;
  status: GVerifyStatus | "NOT_STARTED";
  is_terminal: boolean;
  is_approved: boolean;
  rejection_reason: string | null;
  tax_code: string | null;
  business_name: string | null;
  // Read verbatim off the certificate — one free-text line, not structured
  // parts (the provider's Decode Address API is out of scope backend-side).
  // Optional: older backends omit both, so treat absent as "not available"
  // rather than assuming null.
  company_address?: string | null;
  date_of_establishment?: string | null;
  updated_at: string | null;
}

// Synthetic status for an SME who has never attempted (the endpoint 404s).
export function gverifyKybNotStarted(): GVerifyKybStatusResponse {
  return {
    verification_id: "",
    status: "NOT_STARTED",
    is_terminal: false,
    is_approved: false,
    rejection_reason: null,
    tax_code: null,
    business_name: null,
    updated_at: null,
  };
}

// A KYB verify response reshaped to seed the status query cache.
export function kybVerifyResponseToStatus(
  data: GVerifyKybVerifyResponse,
): GVerifyKybStatusResponse {
  return {
    verification_id: data.verification_id,
    status: data.status,
    is_terminal: true,
    is_approved: data.is_approved,
    rejection_reason: data.rejection_reason,
    tax_code: data.tax_code,
    business_name: data.business_name,
    updated_at: data.created_at,
  };
}

// OCR + biometrics are slower than plain CRUD — give the verify calls more
// room than the client's default 20s.
const VERIFY_TIMEOUT_MS = 60_000;

export const gverifyService = {
  // One-shot KYC: OCR both card faces + face-match the portrait. A REJECTED
  // outcome is still a 2xx — the business verdict is in the body. Only
  // provider failures surface as 502.
  verify(payload: GVerifyVerifyPayload) {
    return apiClient.post<GVerifyVerifyResponse>(
      GVERIFY_ENDPOINTS.verify,
      payload,
      {
        timeout: VERIFY_TIMEOUT_MS,
      },
    );
  },

  // Mint the phone-handoff token (requires the logged-in desktop session).
  createHandoff() {
    return apiClient.post<GVerifyHandoffResponse>(GVERIFY_ENDPOINTS.handoff);
  },

  // Same as verify, but authenticated with the handoff token — used on the
  // phone, which has no login cookie.
  verifyWithToken(payload: GVerifyVerifyPayload, token: string) {
    return apiClient.post<GVerifyVerifyResponse>(
      GVERIFY_ENDPOINTS.handoffVerify,
      payload,
      {
        timeout: VERIFY_TIMEOUT_MS,
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  },

  // Latest attempt, read from our DB. 404 = never attempted.
  getStatus() {
    return apiClient.get<GVerifyStatusResponse>(GVERIFY_ENDPOINTS.status);
  },

  // KYB: OCR the registration certificate + tax-registry cross-check.
  kybVerify(payload: GVerifyKybVerifyPayload) {
    return apiClient.post<GVerifyKybVerifyResponse>(
      GVERIFY_ENDPOINTS.kybVerify,
      payload,
      {
        timeout: VERIFY_TIMEOUT_MS,
      },
    );
  },

  kybGetStatus() {
    return apiClient.get<GVerifyKybStatusResponse>(GVERIFY_ENDPOINTS.kybStatus);
  },
};
