"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  authenticationService,
  type DeviceSession,
  type LoginPayload,
  type RegisterPayload,
  type RevokeResult,
  type SecurityEvent,
  type SelectableRole,
  type User,
} from "@/services/authentication.service";
import {
  usersService,
  type ChangePasswordRequest,
  type ChangePasswordResponse,
  type SecurityPreferences,
} from "@/services/users.service";
import type { ApiError } from "@/lib/types";

// ---------- Query keys ----------
export const authKeys = {
  all: ["auth"] as const,
  currentUser: () => [...authKeys.all, "me"] as const,
  sessions: () => [...authKeys.all, "sessions"] as const,
  securityPreferences: () => [...authKeys.all, "security-preferences"] as const,
  securityEvents: () => [...authKeys.all, "security-events"] as const,
};

// ---------- Mutations ----------

/**
 * Login. The backend sets httpOnly cookies — no token handling on the
 * frontend. On success the cache is seeded with the returned User.
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation<User, ApiError, LoginPayload>({
    mutationFn: (payload) => authenticationService.login(payload),
    onSuccess: (user) => {
      // Seed the cache immediately so useCurrentUser doesn't need to refetch.
      queryClient.setQueryData(authKeys.currentUser(), user);
    },
  });
}

/**
 * Register. Returns the created User. No session is started — the caller
 * should redirect to /login or trigger the login form.
 */
export function useRegister() {
  return useMutation<User, ApiError, RegisterPayload>({
    mutationFn: (payload) => authenticationService.register(payload),
  });
}

/**
 * Select role. For users who registered/logged in without one. Persists the
 * choice via PATCH /users/me/role and seeds the cache with the refreshed user
 * so the rest of the app sees the new role immediately.
 */
export function useSelectRole() {
  const queryClient = useQueryClient();

  return useMutation<User, ApiError, SelectableRole>({
    mutationFn: (role) => usersService.selectRole(role),
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.currentUser(), user);
    },
  });
}

/**
 * Logout. Calls the backend to clear the httpOnly cookies, then wipes the
 * local cache and redirects to /login.
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<void, ApiError, void>({
    mutationFn: () => authenticationService.logout(),
    onSettled: () => {
      // Clear cache regardless of server response — session must end locally.
      queryClient.removeQueries({ queryKey: authKeys.all });
      router.push("/login");
    },
  });
}

/**
 * Returns the currently authenticated user by calling /users/me.
 * The cookie is sent automatically by the browser — no token needed.
 * Returns undefined when not authenticated (401 → query disabled).
 */
export function useCurrentUser() {
  return useQuery<User, ApiError>({
    queryKey: authKeys.currentUser(),
    queryFn: () => usersService.getCurrentUser(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

/**
 * Auth guard for protected pages.
 * Middleware handles the redirect server-side before the page loads.
 * This hook just provides the user data and loading state.
 */
export function useRequireAuth(redirectTo = "/login") {
  const router = useRouter();
  const { data: user, isError, isFetched } = useCurrentUser();

  useEffect(() => {
    // Fallback client-side redirect in case middleware cookie check passes
    // but the token is actually expired (middleware can't verify JWT signature).
    if (isFetched && isError) {
      router.push(redirectTo);
    }
  }, [isFetched, isError, router, redirectTo]);

  return { user, isLoading: !isFetched };
}

// ---------- Security screen ----------

/**
 * Devices currently signed in. Short staleTime: revoking on another tab (or
 * another device signing in) should show up quickly, and the payload is small.
 */
export function useSessions(enabled = true) {
  return useQuery<DeviceSession[], ApiError>({
    queryKey: authKeys.sessions(),
    queryFn: () => authenticationService.listSessions(),
    staleTime: 30 * 1000,
    retry: false,
    enabled,
  });
}

export function useSecurityEvents(enabled = true) {
  return useQuery<SecurityEvent[], ApiError>({
    queryKey: authKeys.securityEvents(),
    queryFn: () => authenticationService.listSecurityEvents(),
    staleTime: 60 * 1000,
    retry: false,
    enabled,
  });
}

/**
 * Sign one device out. Both lists are invalidated: revoking is itself an
 * audited event, so the activity feed changes too.
 */
export function useRevokeSession() {
  const queryClient = useQueryClient();

  return useMutation<RevokeResult, ApiError, string>({
    mutationFn: (sessionId) => authenticationService.revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: authKeys.securityEvents() });
    },
  });
}

export function useRevokeOtherSessions() {
  const queryClient = useQueryClient();

  return useMutation<RevokeResult, ApiError, void>({
    mutationFn: () => authenticationService.revokeOtherSessions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: authKeys.securityEvents() });
    },
  });
}

/** Sign-in alert preference. */
export function useSecurityPreferences(enabled = true) {
  return useQuery<SecurityPreferences, ApiError>({
    queryKey: authKeys.securityPreferences(),
    queryFn: () => usersService.getSecurityPreferences(),
    staleTime: 60 * 1000,
    retry: false,
    enabled,
  });
}

export function useUpdateSecurityPreferences() {
  const queryClient = useQueryClient();

  return useMutation<SecurityPreferences, ApiError, SecurityPreferences>({
    mutationFn: (payload) => usersService.updateSecurityPreferences(payload),
    onSuccess: (prefs) => {
      queryClient.setQueryData(authKeys.securityPreferences(), prefs);
      // Toggling is audited, so the activity feed changes too.
      queryClient.invalidateQueries({ queryKey: authKeys.securityEvents() });
    },
  });
}

/**
 * Change an existing password. The backend revokes every other session as part
 * of the change, so the sessions list is invalidated alongside the history.
 */
export function useChangePassword() {
  const queryClient = useQueryClient();

  return useMutation<ChangePasswordResponse, ApiError, ChangePasswordRequest>({
    mutationFn: (payload) => usersService.changePassword(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: authKeys.securityEvents() });
    },
  });
}
