"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useGoogleLogin } from "@react-oauth/google";
import {
  authenticationService,
  isAdminRole,
  type LoginPayload,
  type OAuthLoginPayload,
  type OAuthTokenResponse,
  type User,
} from "@/services/authentication.service";
import { usersService } from "@/services/users.service";
import { authKeys } from "@/hooks/use-authentication";
import type { ApiError } from "@/lib/types";

// /auth/login (and the OAuth exchange) may return a partial user — the cookie
// is what actually starts the session. Pull the canonical profile from
// /users/me into the cache before navigating so every component reading
// useCurrentUser (header, sidebar, …) renders correct info on first paint.
// Without this the seeded partial is treated as fresh (staleTime) and the UI
// only corrects itself after a hard refresh wipes the in-memory cache.
async function hydrateCurrentUser(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  try {
    return await queryClient.fetchQuery({
      queryKey: authKeys.currentUser(),
      queryFn: () => usersService.getCurrentUser(),
      staleTime: 0,
    });
  } catch {
    // Keep whatever is already cached; useCurrentUser refetches on mount.
    return queryClient.getQueryData<User>(authKeys.currentUser());
  }
}

// Admins (and system admins) land in the admin area. Users who don't have a
// role yet must pick one first. Everyone else goes to the dashboard, where
// middleware further routes SMEs without projects to the application form.
function landingRouteFor(user?: User | null) {
  if (isAdminRole(user?.role)) {
    return "/admin";
  }
  if (!user?.role) {
    return "/select-role";
  }
  return "/dashboard";
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const emailPasswordLogin = useMutation<User, ApiError, LoginPayload>({
    mutationFn: (payload) => authenticationService.login(payload),
    onSuccess: async (user) => {
      // Seed for an instant paint, then reconcile against /users/me.
      queryClient.setQueryData(authKeys.currentUser(), user);
      const current = await hydrateCurrentUser(queryClient);
      router.push(landingRouteFor(current ?? user));
    },
  });

  const googleLogin = useMutation<
    OAuthTokenResponse,
    ApiError,
    OAuthLoginPayload
  >({
    mutationFn: (payload) => authenticationService.oauthLogin(payload),
    onSuccess: async () => {
      const current = await hydrateCurrentUser(queryClient);
      router.push(landingRouteFor(current));
    },
  });

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      // The token shape varies by flow (implicit vs auth-code), so probe the
      // known fields without assuming one.
      const resp = tokenResponse as unknown as Record<
        string,
        string | undefined
      >;
      const idToken = resp?.credential ?? resp?.id_token ?? resp?.access_token;

      if (!idToken) {
        return;
      }

      googleLogin.mutate({ provider: "google", id_token: idToken });
    },
    onError: () => {
      // Let the UI surface the error state through the Google button.
    },
  });

  return {
    login: emailPasswordLogin.mutate,
    loginAsync: emailPasswordLogin.mutateAsync,
    googleLogin: handleGoogleLogin,
    googleLoginAsync: googleLogin.mutateAsync,
    isPending: emailPasswordLogin.isPending,
    isGooglePending: googleLogin.isPending,
  };
}
