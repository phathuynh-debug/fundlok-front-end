import { apiClient } from "@/lib/api-client";
import { ADMIN_EMAIL_ENDPOINTS } from "@/lib/endpoints";

// Admin > Email: each admin's own Gmail connection (App Password), the
// org-wide policy, and templated email composed in the console. Mirrors
// app/admin/internal_email/schemas.py.

// The signed-in admin's own connection. Never carries the password: only
// whether one is stored.
export interface EmailSettings {
  configured: boolean;
  enabled: boolean;
  gmail_address: string | null;
  from_name: string | null;
  has_app_password: boolean;
  last_verified_at: string | null;
  updated_at: string | null;
}

export interface EmailSettingsPayload {
  gmail_address: string;
  from_name: string;
  // null keeps the stored password.
  app_password: string | null;
  enabled: boolean;
}

// Rules every admin's sends follow. Empty allowed_domains means any domain.
export interface EmailPolicy {
  allowed_domains: string[];
  updated_at: string | null;
  updated_by: string | null;
}

export type EmailTemplate = "general" | "announcement" | "action_required";

export interface EmailContentPayload {
  template: EmailTemplate;
  subject: string;
  heading: string | null;
  body: string;
  button_label: string | null;
  button_url: string | null;
}

export interface SendEmailPayload extends EmailContentPayload {
  to: string[];
}

export interface EmailPreview {
  subject: string;
  html: string;
}

export interface EmailTestResult {
  sent_to: string;
  last_verified_at: string;
}

export type InternalEmailStatus = "PENDING" | "SENT" | "FAILED";

export interface InternalEmail {
  id: string;
  sent_by: string | null;
  from_address: string;
  recipients: string[];
  template: EmailTemplate | "test";
  subject: string;
  status: InternalEmailStatus;
  error_code: string | null;
  // Recipients whose copy did not go out; everyone else got theirs. Optional
  // so a frontend deployed ahead of the backend migration still renders.
  undelivered?: string[];
  created_at: string;
  sent_at: string | null;
}

// A user the composer can add to the To list.
export interface EmailRecipient {
  id: string;
  full_name: string | null;
  email: string;
  role: string | null;
  // On a FundLok domain (backend FUNDLOK_EMAIL_DOMAINS).
  is_fundlok: boolean;
}

// Per email. Each recipient gets their own copy, so nobody sees the others.
export const MAX_RECIPIENTS = 50;

// A send waits for Gmail: connect, login and DATA can each take up to the
// backend's 20 s SMTP timeout. The client's default 20 s would give up first
// and report a failure for an email that may still go out.
const SEND_TIMEOUT_MS = 120_000;

export const adminEmailService = {
  getSettings() {
    return apiClient.get<EmailSettings>(ADMIN_EMAIL_ENDPOINTS.settings);
  },

  saveSettings(payload: EmailSettingsPayload) {
    return apiClient.put<EmailSettings>(
      ADMIN_EMAIL_ENDPOINTS.settings,
      payload,
    );
  },

  // Disconnects the account and deletes the stored password.
  clearSettings() {
    return apiClient.delete<EmailSettings>(ADMIN_EMAIL_ENDPOINTS.settings);
  },

  getPolicy() {
    return apiClient.get<EmailPolicy>(ADMIN_EMAIL_ENDPOINTS.policy);
  },

  // SYSTEM_ADMIN only.
  savePolicy(allowedDomains: string[]) {
    return apiClient.put<EmailPolicy>(ADMIN_EMAIL_ENDPOINTS.policy, {
      allowed_domains: allowedDomains,
    });
  },

  sendTestEmail() {
    return apiClient.post<EmailTestResult>(
      ADMIN_EMAIL_ENDPOINTS.testEmail,
      undefined,
      {
        timeout: SEND_TIMEOUT_MS,
      },
    );
  },

  preview(payload: EmailContentPayload) {
    return apiClient.post<EmailPreview>(ADMIN_EMAIL_ENDPOINTS.preview, payload);
  },

  send(payload: SendEmailPayload) {
    return apiClient.post<InternalEmail>(ADMIN_EMAIL_ENDPOINTS.send, payload, {
      timeout: SEND_TIMEOUT_MS,
    });
  },

  listRecipients(params: { q?: string; fundlokOnly?: boolean } = {}) {
    return apiClient.get<EmailRecipient[]>(ADMIN_EMAIL_ENDPOINTS.recipients, {
      params: {
        q: params.q?.trim() || undefined,
        fundlok_only: params.fundlokOnly || undefined,
        limit: 500,
      },
    });
  },

  listMessages(limit = 20) {
    return apiClient.get<InternalEmail[]>(ADMIN_EMAIL_ENDPOINTS.messages, {
      params: { limit },
    });
  },
};
