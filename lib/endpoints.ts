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
} as const;

export const USER_ENDPOINTS = {
  me: "/users/me",
  // Sets the role for a user who registered/logged in without one.
  selectRole: "/users/me/role",
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

export const FILES_ENDPOINTS = {
  presign: "/files/presign",
  commit: (fileId: string) => `/files/${fileId}/commit`,
} as const;

export const UPLOADS_ENDPOINTS = {
  initUpload: "/uploads/init-upload",
  confirm: "/uploads/confirm",
} as const;

export const LOANS_ENDPOINTS = {
  submit: (applicationId: string) =>
    `/loans/applications/${applicationId}/submit`,
  /**
   * Self-reported figures for the Lite grading path (replaces the VAT and
   * annual-financials uploads). Stored on
   * `loan_applications.self_reported_figures`.
   */
  figures: (applicationId: string) =>
    `/loans/applications/${applicationId}/figures`,
  /**
   * The indicative interest band the grading engine derives from those
   * figures. A range, never a single rate, and never an offer — the
   * applicant's CIC score is unknown before KYC, so the engine is run at both
   * ends of the range it was calibrated against.
   */
  indicativeRate: (applicationId: string) =>
    `/loans/applications/${applicationId}/indicative-rate`,
} as const;

export const ADMIN_ENDPOINTS = {
  overview: "/admin/overview",
  auditLogs: "/admin/audit-logs",
  maintenance: "/system/maintenance",
} as const;

// Identity/business verification via Didit. Two behaviourally-identical
// prefixes, gated by role server-side: investors do KYC (/kyc/*), SMEs do KYB
// (/kyb/*). Pick the prefix from the user's role — calling the wrong one 403s.
// The browser only talks to our API; the backend owns the Didit session and is
// the source of truth (set from Didit's signed webhook).
export type VerificationKind = "KYC" | "KYB";

export function verificationEndpoints(kind: VerificationKind) {
  const base = kind === "KYC" ? "/kyc" : "/kyb";
  return {
    start: `${base}/start`,
    status: `${base}/status`,
    sync: `${base}/sync`,
  } as const;
}

// GVerify (Datatrust) eKYC — the direct-API KYC provider that replaces the
// Didit hosted flow for INVESTORS. No redirect and no webhook: we submit the
// ID images + portrait in one call and the response carries the final verdict.
// SMEs (KYB) stay on the Didit flow above until GVerify eKYB lands.
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
} as const;
