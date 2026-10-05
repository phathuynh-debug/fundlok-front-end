"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  authenticationService,
  type Passkey,
  isTotpChallenge,
  type DeviceSession,
  type LoginPayload,
  type LoginResult,
  type RegisterPayload,
  type RevokeResult,
  type SecurityEvent,
  type SelectableRole,
  type TotpDisablePayload,
  type TotpEnableResult,
  type TotpSetup,
  type TotpStatus,
  type User,
} from "@/services/authentication.service";
import {
  usersService,
  type ChangePasswordRequest,
  type ChangePasswordResponse,
  type SecurityPreferences,
} from "@/services/users.service";
import type { ApiError } from "@/lib/types";
import { createPasskey, getPasskeyAssertion } from "@/lib/passkeys";

// ---------- Query keys ----------
export const authKeys = {
  all: ["auth"] as const,
  currentUser: () => [...authKeys.all, "me"] as const,
  sessions: () => [...authKeys.all, "sessions"] as const,
  securityPreferences: () => [...authKeys.all, "security-preferences"] as const,
  securityEvents: () => [...authKeys.all, "security-events"] as const,
  twoFactor: () => [...authKeys.all, "two-factor"] as const,
  passkeys: () => [...authKeys.all, "passkeys"] as const,
};

// ---------- Mutations ----------

/**
 * Login. The backend sets httpOnly cookies — no token handling on the
 * frontend. On success the cache is seeded with the returned User.
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation<LoginResult, ApiError, LoginPayload>({
    mutationFn: (payload) => authenticationService.login(payload),
    onSuccess: (result) => {
      // A 2FA account returns a challenge, not a user — there is no session to
      // cache yet. app/login/use-login.ts drives that flow; this hook only
      // seeds the cache when a session actually exists.
      if (isTotpChallenge(result)) return;
      queryClient.setQueryData(authKeys.currentUser(), result);
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

// ---------- Two-factor authentication ----------

/**
 * Current 2FA state for the signed-in user.
 *
 * Server state, so React Query owns it — the security screen renders directly
 * from this rather than mirroring it into component state, and every mutation
 * below invalidates this key so the row cannot show a stale "off".
 */
export function useTwoFactorStatus(enabled = true) {
  return useQuery<TotpStatus, ApiError>({
    queryKey: authKeys.twoFactor(),
    queryFn: () => authenticationService.getTwoFactorStatus(),
    staleTime: 30 * 1000,
    retry: false,
    enabled,
  });
}

/**
 * Step one of enrolment: mint a secret and get the otpauth:// URI for the QR.
 *
 * Not a query: it has a side effect (it writes a new secret) and must only run
 * when the user opens the dialog, never on a refetch or a window focus.
 */
export function useStartTwoFactorSetup() {
  return useMutation<TotpSetup, ApiError, void>({
    mutationFn: () => authenticationService.startTwoFactorSetup(),
  });
}

/** Step two: prove possession of a code. Returns the one-time recovery codes. */
export function useEnableTwoFactor() {
  const queryClient = useQueryClient();

  return useMutation<TotpEnableResult, ApiError, string>({
    mutationFn: (code) => authenticationService.enableTwoFactor(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.twoFactor() });
    },
  });
}

export function useDisableTwoFactor() {
  const queryClient = useQueryClient();

  return useMutation<TotpStatus, ApiError, TotpDisablePayload>({
    mutationFn: (payload) => authenticationService.disableTwoFactor(payload),
    onSuccess: (status) => {
      // Seed then invalidate: the row flips immediately, and the count is
      // reconciled from the server.
      queryClient.setQueryData(authKeys.twoFactor(), status);
      queryClient.invalidateQueries({ queryKey: authKeys.twoFactor() });
    },
  });
}

// ---------- Passkeys ----------

export function usePasskeys(enabled = true) {
  return useQuery<Passkey[], ApiError>({
    queryKey: authKeys.passkeys(),
    queryFn: () => authenticationService.listPasskeys(),
    staleTime: 30 * 1000,
    retry: false,
    enabled,
  });
}

/**
 * Register a passkey: fetch options, run the browser ceremony, verify.
 *
 * All three steps live in one mutation because they are one user action and
 * the middle step cannot be retried independently — the challenge is consumed
 * by the attempt, so a retry has to start again from options.
 *
 * The ceremony runs against `navigator.credentials`, so this only works in a
 * secure context (https, or localhost).
 */
export function useRegisterPasskey() {
  const queryClient = useQueryClient();

  return useMutation<Passkey, ApiError | Error, string | undefined>({
    mutationFn: async (name) => {
      const options = await authenticationService.passkeyRegisterOptions();
      const credential = await createPasskey(options);
      return authenticationService.passkeyRegisterVerify({
        credential,
        name: name ?? null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.passkeys() });
    },
  });
}

export function useDeletePasskey() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (id) => authenticationService.deletePasskey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.passkeys() });
    },
  });
}

/**
 * Sign in with a passkey. No email, no password — the browser offers whatever
 * it holds for this site and the server identifies the account from the
 * credential.
 *
 * Seeds `currentUser` from the response so the redirect after sign-in does not
 * have to wait on a second /users/me round trip.
 */
export function usePasskeyLogin() {
  const queryClient = useQueryClient();

  return useMutation<User, ApiError | Error, boolean | undefined>({
    mutationFn: async (rememberMe) => {
      const options = await authenticationService.passkeyLoginOptions();
      const credential = await getPasskeyAssertion(options);
      return authenticationService.passkeyLoginVerify({
        credential,
        remember_me: rememberMe ?? false,
      });
    },
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.currentUser(), user);
    },
  });
}
