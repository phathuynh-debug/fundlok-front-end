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
} as const;

export const USER_ENDPOINTS = {
  me: "/users/me",
  // Sets the role for a user who registered/logged in without one.
  selectRole: "/users/me/role",
  avatarPresign: "/users/me/avatar/presign",
  avatarConfirm: "/users/me/avatar/confirm",
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
} as const;

export const ADMIN_ENDPOINTS = {
  overview: "/admin/overview",
  auditLogs: "/admin/audit-logs",
  maintenance: "/system/maintenance",
} as const;

// Identity verification (KYC) via Didit. The browser only ever talks to our
// API; the backend creates the Didit session and is the source of truth for
// the decision (set from Didit's signed webhook).
export const KYC_ENDPOINTS = {
  start: "/kyc/start",
  status: "/kyc/status",
  sync: "/kyc/sync",
} as const;
