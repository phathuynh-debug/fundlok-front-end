'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  authenticationService,
  type LoginPayload,
  type RegisterPayload,
  type User,
} from '@/services/authentication.service';
import { usersService } from '@/services/users.service';
import type { ApiError } from '@/lib/types';

// ---------- Query keys ----------
export const authKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authKeys.all, 'me'] as const,
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
      router.push('/login');
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
export function useRequireAuth(redirectTo = '/login') {
  const router = useRouter();
  const { data: user, isLoading, isError, isFetched } = useCurrentUser();

  useEffect(() => {
    // Fallback client-side redirect in case middleware cookie check passes
    // but the token is actually expired (middleware can't verify JWT signature).
    if (isFetched && isError) {
      router.push(redirectTo);
    }
  }, [isFetched, isError, router, redirectTo]);

  return { user, isLoading: !isFetched };
}
