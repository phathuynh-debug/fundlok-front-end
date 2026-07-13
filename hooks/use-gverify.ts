'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  gverifyService,
  gverifyNotStarted,
  verifyResponseToStatus,
  type GVerifyHandoffResponse,
  type GVerifyVerifyPayload,
  type GVerifyVerifyResponse,
  type GVerifyStatusResponse,
} from '@/services/gverify.service';
import type { ApiError } from '@/lib/types';

// ---------- Query keys ----------
export const gverifyKeys = {
  all: ['gverify'] as const,
  status: () => [...gverifyKeys.all, 'status'] as const,
};

interface UseGVerifyStatusOptions {
  enabled?: boolean;
  // Poll while waiting for another device (the phone handoff) to submit.
  // Same-device verifies don't need it — the mutation seeds this cache.
  poll?: boolean;
}

// Latest GVerify KYC attempt for the logged-in investor. A 404 means they
// never attempted, surfaced as a synthetic NOT_STARTED so the UI renders from
// status.
export function useGVerifyStatus({ enabled = true, poll = false }: UseGVerifyStatusOptions = {}) {
  return useQuery<GVerifyStatusResponse, ApiError>({
    queryKey: gverifyKeys.status(),
    enabled,
    queryFn: async () => {
      try {
        return await gverifyService.getStatus();
      } catch (err) {
        if ((err as ApiError)?.status === 404) return gverifyNotStarted();
        throw err;
      }
    },
    staleTime: 0,
    retry: false,
    // While polling, never self-stop on a terminal status: the current
    // attempt may already be terminal (e.g. an earlier rejection) and the
    // phone's submission creates a NEW attempt. The caller stops the poll by
    // clearing the flag once it sees a fresh verdict.
    refetchInterval: poll ? 3000 : false,
  });
}

// Submits the three images and returns the synchronous verdict. Seeds the
// status cache on success; a provider failure (502) leaves a FAILED attempt
// server-side, so the cache is invalidated to pick it up.
export function useGVerifyVerify() {
  const queryClient = useQueryClient();
  return useMutation<GVerifyVerifyResponse, ApiError, GVerifyVerifyPayload>({
    mutationFn: (payload) => gverifyService.verify(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(gverifyKeys.status(), verifyResponseToStatus(data));
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: gverifyKeys.status() });
    },
  });
}

// Mints the 10-minute phone-handoff token (desktop session required). The
// caller renders it as a QR pointing at /kyc/mobile?token=…
export function useGVerifyHandoff() {
  return useMutation<GVerifyHandoffResponse, ApiError, void>({
    mutationFn: () => gverifyService.createHandoff(),
  });
}

interface TokenVerifyInput {
  payload: GVerifyVerifyPayload;
  token: string;
}

// The phone-side submit: authenticated by the handoff token, not a cookie.
// No cache seeding — the phone session has no meaningful query cache; the
// desktop discovers the verdict through its polling status query.
export function useGVerifyVerifyWithToken() {
  return useMutation<GVerifyVerifyResponse, ApiError, TokenVerifyInput>({
    mutationFn: ({ payload, token }) => gverifyService.verifyWithToken(payload, token),
  });
}
