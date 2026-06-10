import { apiClient } from '@/lib/api-client';
import { AUTH_ENDPOINTS } from '@/lib/endpoints';

export type UserRole = 'SME' | 'INVESTOR';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role: UserRole;
  status?: UserStatus;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  phone?: string | null;
  role: UserRole;
}

export const authenticationService = {
  // Backend sets httpOnly cookies and returns the User object.
  // During transition the backend may still return Token shape — we handle both.
  login(payload: LoginPayload) {
    return apiClient.post<User>(AUTH_ENDPOINTS.login, payload);
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
};
