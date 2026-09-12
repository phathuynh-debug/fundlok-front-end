import { apiClient } from "@/lib/api-client";
import { CONTACT_ENDPOINTS } from "@/lib/endpoints";

export interface ContactSubmitPayload {
  name: string;
  email: string;
  /**
   * A value from `CONTACT_PURPOSE_OPTIONS` — the backend validates it against
   * its own enum and prefixes the team notification's subject with the
   * matching label.
   */
  purpose: string;
  subject: string;
  message: string;
  turnstile_token: string | null;
}

export interface ContactSubmitResponse {
  status: string;
  message: string;
}

export const contactService = {
  submit(payload: ContactSubmitPayload) {
    return apiClient.post<ContactSubmitResponse>(
      CONTACT_ENDPOINTS.submit,
      payload,
    );
  },
};
