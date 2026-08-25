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

export const authenticationService = {
  // Backend sets httpOnly cookies and returns the User object.
  // During transition the backend may still return Token shape — we handle both.
  login(payload: LoginPayload) {
    return apiClient.post<User>(AUTH_ENDPOINTS.login, payload);
  },

  oauthLogin(payload: OAuthLoginPayload) {
    return apiClient.post<OAuthTokenResponse>(
      AUTH_ENDPOINTS.oauthLogin,
      payload,
    );
  },

  // Returns the created User. No tokens — caller redirects to login.
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
