// All API calls go through the Next.js proxy at /api/*.
// Next.js rewrites /api/* → http://127.0.0.1:8000/* server-side,
// so the browser only ever talks to localhost:3000 — same origin,
// which means httpOnly cookies are sent automatically on every request.
export const API_URL = "/api";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const AUTH_ENDPOINTS = {
  login: "/auth/login",
  register: "/auth/register",
  oauthLogin: "/auth/oauth/login",
  refresh: "/auth/refresh",
  logout: "/auth/logout",
  verifyEmail: (token: string) => `/auth/verify-email?token=${token}`,
  resendVerification: "/auth/resend-verification",
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password",
  // Security screen: live sign-ins and the account's security history.
  sessions: "/auth/sessions",
  revokeSession: (sessionId: string) => `/auth/sessions/${sessionId}/revoke`,
  revokeOtherSessions: "/auth/sessions/revoke-others",
  securityEvents: "/auth/security-events",
  // Two-factor auth. `twoFactorLogin` is the only one reachable without a
  // session: it trades the challenge token from POST /auth/login for one.
  twoFactor: "/auth/2fa",
  twoFactorSetup: "/auth/2fa/setup",
  twoFactorEnable: "/auth/2fa/enable",
  twoFactorDisable: "/auth/2fa/disable",
  twoFactorLogin: "/auth/login/2fa",
  // Passkeys (WebAuthn). The two `passkeyLogin*` routes are reachable without
  // a session — that is the point of them; everything else requires one.
  passkeys: "/auth/passkeys",
  passkeyRegisterOptions: "/auth/passkeys/register/options",
  passkeyRegisterVerify: "/auth/passkeys/register/verify",
  passkeyDelete: (id: string) => `/auth/passkeys/${id}`,
  passkeyLoginOptions: "/auth/passkeys/login/options",
  passkeyLoginVerify: "/auth/passkeys/login/verify",
} as const;

export const USER_ENDPOINTS = {
  me: "/users/me",
  // Sets the role for a user who registered/logged in without one.
  selectRole: "/users/me/role",
  // Marks the first-run dashboard walkthrough as seen for this account.
  completeOnboardingTour: "/users/me/onboarding-tour/complete",
  avatarPresign: "/users/me/avatar/presign",
  avatarConfirm: "/users/me/avatar/confirm",
  // Sets a FIRST password on an account created without one (OAuth sign-in).
  // Changing an existing password is /auth/forgot-password → reset-password.
  setPassword: "/users/me/password",
  // Changing an EXISTING password is a different endpoint: it requires the
  // current one, because a session alone must not be enough to take an account
  // over. See app/users/router.py.
  changePassword: "/users/me/password/change",
  securityPreferences: "/users/me/security-preferences",
} as const;

export const PROJECT_ENDPOINTS = {
  list: "/projects",
  create: "/projects",
  public: "/projects/public",
} as const;

// Public marketing contact form. No session needed — the backend gates it on
// Cloudflare Turnstile instead.
export const CONTACT_ENDPOINTS = {
  submit: "/contact",
} as const;

export const FILES_ENDPOINTS = {
  presign: "/files/presign",
  commit: (fileId: string) => `/files/${fileId}/commit`,
} as const;

export const UPLOADS_ENDPOINTS = {
  initUpload: "/uploads/init-upload",
  confirm: "/uploads/confirm",
  // Reads the e-invoice zip the moment it is picked, to prefill step 2.
  einvoicePreview: "/uploads/einvoice-preview",
  // Reads the tax filings (statement XML, or the folder .zip) to prefill step 2.
  taxFilingsPreview: "/uploads/tax-filings-preview",
  cicPreview: "/uploads/cic-preview",
} as const;

export const LOANS_ENDPOINTS = {
  /**
   * Indicative rate for a visitor with no account (the public /rate page).
   * Unauthenticated and stateless: it stores nothing and returns a band, never
   * a single rate. The engine runs server-side because the reference rate and
   * the rating formula are internal pricing inputs.
   */
  rateEstimate: "/loans/rate-estimate",
  submit: (applicationId: string) =>
    `/loans/applications/${applicationId}/submit`,
  /**
   * Self-reported figures for the Lite grading path (replaces the VAT and
   * annual-financials uploads). NOTE: not implemented on the backend yet —
   * `loan_applications` has no columns for these (see
   * app/lending/models.py), so this needs a migration + route before it
   * returns anything but 404.
   */
  figures: (applicationId: string) =>
    `/loans/applications/${applicationId}/figures`,
} as const;

export const RATE_CALCULATOR_ENDPOINTS = {
  calculate: "/api/v1/rates/calculate",
  inquiries: "/admin/rates/inquiries",
  inquiryDetail: (id: string) => `/admin/rates/inquiries/${id}`,
  investorTiers: "/api/v1/rates/investor/tiers",
  investorLeads: "/api/v1/rates/investor/leads",
  investorEstimate: (leadId: string) =>
    `/api/v1/rates/investor/leads/${leadId}/estimate`,
  investorSignup: (leadId: string) =>
    `/api/v1/rates/investor/leads/${leadId}/signup`,
  // Admin only. No /api/v1 alias exists for these: they hold personal data.
  investorLeadsAdmin: "/admin/rates/investor-leads",
  investorLeadAdmin: (id: string) => `/admin/rates/investor-leads/${id}`,
} as const;

export const ADMIN_ENDPOINTS = {
  overview: "/admin/overview",
  auditLogs: "/admin/audit-logs",
  maintenance: "/system/maintenance",
  rateInquiries: "/admin/rates/inquiries",
  rateInquiryDetail: (id: string) => `/admin/rates/inquiries/${id}`,
  // The project preview: one company, its funding requests, and the owner's
  // latest KYB attempt — both halves of the two-approval gate in one payload.
  projectDetail: (id: string) => `/admin/projects/${id}`,
  // The operator's two decisions. Both are admin-only server-side and both are
  // one-way: a decided record answers 409, never a silent overwrite.
  resolveKybVerification: (id: string) =>
    `/admin/kyb-verifications/${id}/resolve`,
  // Investor KYC attempts the engine parked in MANUAL_REVIEW (an ID number
  // already verified on another account). The list defaults to that queue.
  kycVerifications: "/admin/kyc-verifications",
  kycVerification: (id: string) => `/admin/kyc-verifications/${id}`,
  // A 10-minute read URL for one submitted image.
  kycImage: (id: string, name: string) =>
    `/admin/kyc-verifications/${id}/images/${name}`,
  resolveKycVerification: (id: string) =>
    `/admin/kyc-verifications/${id}/resolve`,
  // The business-verification queue: KYB attempts parked in MANUAL_REVIEW
  // (every submission while verification mode is MANUAL), with a 10-minute
  // read URL for the submitted certificate.
  kybVerifications: "/admin/kyb-verifications",
  kybVerification: (id: string) => `/admin/kyb-verifications/${id}`,
  kybCertificate: (id: string) => `/admin/kyb-verifications/${id}/certificate`,
  // KYC/KYB verification mode. Reading it with who/when is SYSTEM_ADMIN only,
  // and so is changing it.
  verificationModeAdmin: "/system/verification-mode/admin",
  setVerificationMode: "/system/verification-mode",
  applicationDecision: (id: string) => `/admin/applications/${id}/decision`,
  // Account status. SUSPENDED is a real deny server-side, not a label.
  userStatus: (id: string) => `/admin/users/${id}/status`,
  // SYSTEM_ADMIN only. Creates an ADMIN account with no password and emails
  // the invitee a single-use link to choose one.
  inviteAdmin: "/admin/users/admins",
  // A 10-minute read URL for one uploaded application document.
  documentUrl: (id: string) => `/admin/documents/${id}/url`,
} as const;

// Underwriting. Admin-only server-side (require_roles(Role.ADMIN) — note that
// is ADMIN specifically, not SYSTEM_ADMIN). A score run is a dated, audited
// artefact: it writes an append-only score_run_inputs row for exact replay and
// records the board-set bank rate in force, so it is started deliberately
// rather than as a side effect of an upload.
export const UNDERWRITING_ENDPOINTS = {
  scoreRuns: "/underwriting/score-runs",
  scoreRun: (id: string) => `/underwriting/score-runs/${id}`,
  approveScoreRun: (id: string) => `/underwriting/score-runs/${id}/approve`,
} as const;

// GVerify (Datatrust) — identity/business verification for both roles, gated
// by role server-side: investors do KYC, SMEs do KYB (calling the wrong one
// 403s). Direct API, so no redirect and no webhook: we submit the images in
// one call and the response carries the final verdict. The browser only talks
// to our API; the backend owns the provider session and is the source of truth.
export const GVERIFY_ENDPOINTS = {
  verify: "/gverify/kyc/verify",
  status: "/gverify/kyc/status",
  // Phone handoff: desktop mints a 10-minute token (shown as a QR), the phone
  // submits the images with it as a Bearer credential — no login cookie needed.
  handoff: "/gverify/kyc/handoff",
  handoffVerify: "/gverify/kyc/handoff/verify",
  // KYB — business verification for SMEs: registration certificate OCR +
  // state tax-registry cross-check, synchronous verdict.
  kybVerify: "/gverify/kyb/verify",
  kybStatus: "/gverify/kyb/status",
  // A 10-minute read URL for the certificate the SME already submitted for
  // KYB, so the loan application does not ask for the same file twice.
  kybCertificate: "/gverify/kyb/certificate",
  // Any signed-in user: whether results come from the provider (AUTOMATIC)
  // or from an admin (MANUAL), so the screens can say so up front.
  verificationMode: "/system/verification-mode",
} as const;

// In-app notifications — the bell in the sidebar. Every route is scoped to the
// signed-in user server-side; there is no "all notifications" read.
export const NOTIFICATION_ENDPOINTS = {
  list: "/notifications",
  markRead: (id: string) => `/notifications/${id}/read`,
  markAllRead: "/notifications/read-all",
  realtimeToken: "/notifications/realtime-token",
} as const;
