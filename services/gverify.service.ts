import { apiClient } from '@/lib/api-client';
import { GVERIFY_ENDPOINTS } from '@/lib/endpoints';

// GVerify attempt statuses (backend spec:
// docs/specs/gverify/ekyc-kyc-verification.md). Every attempt ends terminal
// within the request that created it; "NOT_STARTED" is our synthetic value for
// a user with no attempts (the status endpoint 404s).
export type GVerifyStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FAILED';

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
  status: GVerifyStatus | 'NOT_STARTED';
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
    verification_id: '',
    status: 'NOT_STARTED',
    is_terminal: false,
    is_approved: false,
    rejection_reason: null,
    person_number: null,
    full_name: null,
    updated_at: null,
  };
}

// A verify response reshaped so it can seed the status query cache.
export function verifyResponseToStatus(data: GVerifyVerifyResponse): GVerifyStatusResponse {
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

// OCR + biometrics are slower than plain CRUD — give the verify calls more
// room than the client's default 20s.
const VERIFY_TIMEOUT_MS = 60_000;

export const gverifyService = {
  // One-shot KYC: OCR both card faces + face-match the portrait. A REJECTED
  // outcome is still a 2xx — the business verdict is in the body. Only
  // provider failures surface as 502.
  verify(payload: GVerifyVerifyPayload) {
    return apiClient.post<GVerifyVerifyResponse>(GVERIFY_ENDPOINTS.verify, payload, {
      timeout: VERIFY_TIMEOUT_MS,
    });
  },

  // Mint the phone-handoff token (requires the logged-in desktop session).
  createHandoff() {
    return apiClient.post<GVerifyHandoffResponse>(GVERIFY_ENDPOINTS.handoff);
  },

  // Same as verify, but authenticated with the handoff token — used on the
  // phone, which has no login cookie.
  verifyWithToken(payload: GVerifyVerifyPayload, token: string) {
    return apiClient.post<GVerifyVerifyResponse>(GVERIFY_ENDPOINTS.handoffVerify, payload, {
      timeout: VERIFY_TIMEOUT_MS,
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Latest attempt, read from our DB. 404 = never attempted.
  getStatus() {
    return apiClient.get<GVerifyStatusResponse>(GVERIFY_ENDPOINTS.status);
  },
};
