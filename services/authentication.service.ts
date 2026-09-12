import { apiClient } from "@/lib/api-client";
import { AUTH_ENDPOINTS } from "@/lib/endpoints";

export type UserRole = "SME" | "INVESTOR" | "ADMIN" | "SYSTEM_ADMIN";

// The roles a user may pick for themselves on the select-role screen.
// ADMIN / SYSTEM_ADMIN are backend-assigned and never self-selectable.
export type SelectableRole = Extract<UserRole, "SME" | "INVESTOR">;

// Roles allowed into the /admin area (mirrors the backend's require_admin).
export const ADMIN_ROLES: UserRole[] = ["ADMIN", "SYSTEM_ADMIN"];

export function isAdminRole(role?: UserRole | string | null): boolean {
  return role === "ADMIN" || role === "SYSTEM_ADMIN";
}
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type OAuthProvider = "google";

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  // Optional: users now register without a role and pick one after login on
  // the select-role screen, so a freshly created user has no role yet.
  role?: UserRole | null;
  status?: UserStatus;
  email_verified?: boolean;
  // False for OAuth-only accounts, which set a first password instead of
  // changing one — the change-password dialog uses this to decide whether to
  // ask for the current password.
  has_password?: boolean;
  created_at?: string | null;
  /**
   * When this ACCOUNT finished or skipped the first-run dashboard
   * walkthrough; null until then. Server-side rather than in browser storage
   * so onboarding follows the person across devices.
   *
   * Optional because a backend that predates the column simply omits it — the
   * tour treats "field absent" as "ask the browser instead" rather than
   * replaying itself on every load.
   */
  onboarding_tour_completed_at?: string | null;
}

/**
 * POST /auth/login returns one of two shapes.
 *
 * When the account has 2FA enabled the response carries NO session — no
 * cookies, no user — only a five-minute challenge token to trade at
 * /auth/login/2fa. `totp_required` is the discriminant; the type guard below is
 * how callers tell the two apart without inspecting fields by hand.
 */
export interface TotpChallenge {
  totp_required: true;
  challenge_token: string;
}

export type LoginResult = User | TotpChallenge;

export function isTotpChallenge(result: LoginResult): result is TotpChallenge {
  return (result as TotpChallenge)?.totp_required === true;
}

export interface TotpLoginPayload {
  challenge_token: string;
  code: string;
  remember_me?: boolean;
}

export interface TotpStatus {
  enabled: boolean;
  confirmed_at: string | null;
  recovery_codes_remaining: number;
}

export interface TotpSetup {
  /** Base32 secret, for manual entry when a camera is unavailable. */
  secret: string;
  /** otpauth:// URI — the string the QR code encodes. */
  provisioning_uri: string;
}

export interface TotpEnableResult {
  enabled: boolean;
  /** Shown exactly once. There is no endpoint that can retrieve them again. */
  recovery_codes: string[];
}

export interface TotpDisablePayload {
  password: string;
  /** A code from the app, or a recovery code — the backend accepts either. */
  code: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  turnstile_token?: string | null;
  /**
   * "Keep me signed in". Controls how long the browser holds the auth cookies,
   * not the token lifetimes: true issues them with a Max-Age so the session
   * survives a browser restart, false issues session cookies that the browser
   * drops on close. Omitted behaves as false — the safer default.
   */
  remember_me?: boolean;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  phone?: string | null;
  turnstile_token?: string | null;
}

export interface OAuthLoginPayload {
  provider: OAuthProvider;
  id_token: string;
}

export interface OAuthTokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface ForgotPasswordPayload {
  email: string;
  turnstile_token?: string | null;
}

export interface ResetPasswordPayload {
  token: string;
  new_password: string;
}

/** One live sign-in, as /auth/sessions returns it. */
export interface DeviceSession {
  session_id: string;
  /** Parsed from the user agent server-side, e.g. "Mac", "iPhone". */
  device: string;
  /** e.g. "Chrome 141". */
  browser: string;
  ip_address: string | null;
  created_at: string | null;
  last_used_at: string | null;
  /** The session making the request — cannot be revoked from here. */
  current: boolean;
}

export type SecurityEventSeverity = "info" | "warning" | "critical";

export interface SecurityEvent {
  id: string;
  /** e.g. SIGN_IN, SESSION_REVOKED. Translated at the call site. */
  action: string;
  entity_type?: string;
  severity: SecurityEventSeverity;
  ip_address?: string | null;
  created_at?: string | null;
  device?: string | null;
  location?: string | null;
  details?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

export interface RevokeResult {
  revoked: number;
}

export const authenticationService = {
  // Backend sets httpOnly cookies and returns the User object.
  // During transition the backend may still return Token shape — we handle both.
  login(payload: LoginPayload) {
    // LoginResult, not User: an account with 2FA enabled answers with a
    // challenge instead. Callers narrow with isTotpChallenge().
    return apiClient.post<LoginResult>(AUTH_ENDPOINTS.login, payload);
  },

  completeTotpLogin(payload: TotpLoginPayload) {
    return apiClient.post<User>(AUTH_ENDPOINTS.twoFactorLogin, payload);
  },

  getTwoFactorStatus() {
    return apiClient.get<TotpStatus>(AUTH_ENDPOINTS.twoFactor);
  },

  startTwoFactorSetup() {
    return apiClient.post<TotpSetup>(AUTH_ENDPOINTS.twoFactorSetup, {});
  },

  enableTwoFactor(code: string) {
    return apiClient.post<TotpEnableResult>(AUTH_ENDPOINTS.twoFactorEnable, {
      code,
    });
  },

  disableTwoFactor(payload: TotpDisablePayload) {
    return apiClient.post<TotpStatus>(AUTH_ENDPOINTS.twoFactorDisable, payload);
  },

  oauthLogin(payload: OAuthLoginPayload) {
    return apiClient.post<OAuthTokenResponse>(
      AUTH_ENDPOINTS.oauthLogin,
      payload,
    );
  },

  // Returns the created User. No tokens — caller redirects to login.
  listSessions() {
    return apiClient.get<DeviceSession[]>(AUTH_ENDPOINTS.sessions);
  },

  revokeSession(sessionId: string) {
    return apiClient.post<RevokeResult>(
      AUTH_ENDPOINTS.revokeSession(sessionId),
    );
  },

  revokeOtherSessions() {
    return apiClient.post<RevokeResult>(AUTH_ENDPOINTS.revokeOtherSessions);
  },

  listSecurityEvents() {
    return apiClient.get<SecurityEvent[]>(AUTH_ENDPOINTS.securityEvents);
  },

  register(payload: RegisterPayload) {
    return apiClient.post<User>(AUTH_ENDPOINTS.register, payload);
  },

  // Backend clears the cookies server-side.
  logout() {
    return apiClient.post<void>(AUTH_ENDPOINTS.logout);
  },

  // Rotates the access + refresh cookies using the existing refresh cookie.
  // No payload needed — the cookie is sent automatically.
  refresh() {
    return apiClient.post<void>(AUTH_ENDPOINTS.refresh);
  },

  verifyEmail(token: string) {
    return apiClient.get<{ status: string; message: string }>(
      AUTH_ENDPOINTS.verifyEmail(token),
    );
  },

  resendVerification(email: string) {
    return apiClient.post<{ status: string; message: string }>(
      AUTH_ENDPOINTS.resendVerification,
      { email },
    );
  },

  forgotPassword(payload: ForgotPasswordPayload) {
    return apiClient.post<{ status: string; message: string }>(
      AUTH_ENDPOINTS.forgotPassword,
      payload,
    );
  },

  resetPassword(payload: ResetPasswordPayload) {
    return apiClient.post<{ status: string; message: string }>(
      AUTH_ENDPOINTS.resetPassword,
      payload,
    );
  },
};
