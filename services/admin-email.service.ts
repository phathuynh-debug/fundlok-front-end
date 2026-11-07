import { apiClient } from "@/lib/api-client";
import { ADMIN_EMAIL_ENDPOINTS } from "@/lib/endpoints";

// Admin > Email: each admin's own Gmail connection (Google OAuth, sent
// through the Gmail API), the org-wide policy, and templated email composed in
// the console. Mirrors app/admin/internal_email/schemas.py.

// The signed-in admin's own connection. Never carries the OAuth token: only
// whether one is stored (`configured`).
export interface EmailSettings {
  // A Google account is connected and can send.
  configured: boolean;
  enabled: boolean;
  // The connected Google account (from Google, never typed in). Also set when
  // needs_reconnect, to say which account to reconnect.
  gmail_address: string | null;
  from_name: string | null;
  // An account was connected but Google no longer accepts it: access revoked
  // in the Google account, or an App Password connection from before OAuth.
  needs_reconnect: boolean;
  // When the current Google token was granted.
  connected_at: string | null;
  last_verified_at: string | null;
  updated_at: string | null;
  signature_name: string | null;
  signature_title: string | null;
  signature_phone: string | null;
}

// What the admin edits by hand. Turning `enabled` on needs a connected
// account (400 EMAIL_NOT_CONFIGURED).
export interface EmailSettingsPayload {
  from_name: string;
  enabled: boolean;
  signature_name?: string | null;
  signature_title?: string | null;
  signature_phone?: string | null;
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
  include_signature: boolean;
}

export interface SendEmailPayload extends EmailContentPayload {
  to: string[];
}

export interface EmailPreview {
  subject: string;
  html: string;
}

// Where to send the browser to connect a Google account.
export interface EmailOAuthStart {
  authorization_url: string;
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

// A send waits for Google: a token refresh, then one Gmail API call per
// recipient, each with the backend's 20 s timeout (the whole loop capped at
// 25 s). The client's default 20 s would give up first and report a failure
// for an email that may still go out.
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

  // Google's consent URL. Also sets the short-lived cookie that binds the
  // flow to this browser, so the browser must go there itself.
  startGoogleConnect() {
    return apiClient.get<EmailOAuthStart>(ADMIN_EMAIL_ENDPOINTS.oauthAuthorize);
  },

  // Forgets the Google account (sender name and signature stay) and revokes
  // its token at Google.
  disconnect() {
    return apiClient.post<EmailSettings>(ADMIN_EMAIL_ENDPOINTS.disconnect);
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

  listMessages(params?: { limit?: number; offset?: number } | number) {
    const limit = typeof params === "number" ? params : (params?.limit ?? 100);
    const offset = typeof params === "object" ? params?.offset : undefined;
    return apiClient.get<InternalEmail[]>(ADMIN_EMAIL_ENDPOINTS.messages, {
      params: { limit, offset },
    });
  },
};
