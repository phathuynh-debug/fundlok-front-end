import { apiClient } from '@/lib/api-client';
import { KYC_ENDPOINTS } from '@/lib/endpoints';

// Didit's exact, case-sensitive status strings.
export type KycStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Awaiting User'
  | 'In Review'
  | 'Approved'
  | 'Declined'
  | 'Resubmitted'
  | 'Abandoned'
  | 'Expired'
  | 'Kyc Expired';

// POST /kyc/start — optional body. `language` is the user's locale (e.g. "vi"),
// passed through so Didit's hosted flow renders in that language.
export interface KycStartRequest {
  language?: string;
}

// POST /kyc/start — creates (or resumes) a Didit session.
export interface KycStartResponse {
  verification_id: string;
  session_id: string;
  status: KycStatus;
  verification_url: string;
}

// GET /kyc/status and POST /kyc/sync return this shape.
export interface KycStatusResponse {
  verification_id: string;
  session_id: string;
  status: KycStatus;
  is_terminal: boolean;
  is_approved: boolean;
  verification_url?: string;
  updated_at?: string | null;
}

// Synthetic status for a user who has never started KYC (GET /kyc/status 404s).
export const KYC_NOT_STARTED: KycStatusResponse = {
  verification_id: '',
  session_id: '',
  status: 'Not Started',
  is_terminal: false,
  is_approved: false,
};

export const kycService = {
  // Begin or resume verification. Open the returned verification_url.
  // Pass the current locale so Didit shows the flow in the user's language;
  // the backend falls back to its DIDIT_LANGUAGE default when omitted.
  start(language?: string) {
    return apiClient.post<KycStartResponse>(
      KYC_ENDPOINTS.start,
      language ? { language } : undefined,
    );
  },

  // Latest decision, read from our DB (cheap — use this for polling).
  getStatus() {
    return apiClient.get<KycStatusResponse>(KYC_ENDPOINTS.status);
  },

  // Force-refresh directly from Didit (fallback when the webhook is delayed).
  sync() {
    return apiClient.post<KycStatusResponse>(KYC_ENDPOINTS.sync);
  },
};
