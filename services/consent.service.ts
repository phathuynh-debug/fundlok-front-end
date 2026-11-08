import { apiClient } from "@/lib/api-client";
import { CONSENT_ENDPOINTS } from "@/lib/endpoints";

// Accepting the Terms & Services and data consent (Contract 1). Mirrors
// backend app/consent/schemas.py.

export interface ConsentStatus {
  version: string;
  // True until the user has accepted all three documents of `version`.
  required: boolean;
  accepted_at: string | null;
}

export interface ConsentCodeSent {
  // The account's address, mostly hidden: "ph***@fundlok.com".
  sent_to: string;
  expires_in_seconds: number;
  resend_after_seconds: number;
}

// Every box is its own field and must be true: the backend refuses anything
// else with 422.
export interface ConsentAcceptPayload {
  version: string;
  terms: true;
  data_processing: true;
  data_sharing_tpv: true;
  code: string;
}

export const consentService = {
  getStatus() {
    return apiClient.get<ConsentStatus>(CONSENT_ENDPOINTS.status);
  },

  sendCode() {
    return apiClient.post<ConsentCodeSent>(CONSENT_ENDPOINTS.code);
  },

  accept(payload: ConsentAcceptPayload) {
    return apiClient.post<ConsentStatus>(CONSENT_ENDPOINTS.accept, payload);
  },
};
