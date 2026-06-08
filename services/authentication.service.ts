import { apiClient } from '@/lib/api-client';
import { AUTH_ENDPOINTS } from '@/lib/endpoints';

export type UserRole = 'SME' | 'INVESTOR';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type OAuthProvider = 'google';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role: UserRole;
  status?: UserStatus;
  email_verified?: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
  turnstile_token?: string | null;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  phone?: string | null;
  role: UserRole;
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

export const authenticationService = {
  // Backend sets httpOnly cookies and returns the User object.
  // During transition the backend may still return Token shape — we handle both.
  login(payload: LoginPayload) {
    return apiClient.post<User>(AUTH_ENDPOINTS.login, payload);
  },

  oauthLogin(payload: OAuthLoginPayload) {
    return apiClient.post<OAuthTokenResponse>(AUTH_ENDPOINTS.oauthLogin, payload);
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
      AUTH_ENDPOINTS.verifyEmail(token)
    );
  },

  resendVerification(email: string) {
    return apiClient.post<{ status: string; message: string }>(
      AUTH_ENDPOINTS.resendVerification,
      { email }
    );
  },
};
