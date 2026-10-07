"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  gverifyService,
  gverifyNotStarted,
  gverifyKybNotStarted,
  kybVerifyResponseToStatus,
  verifyResponseToStatus,
  type GVerifyHandoffResponse,
  type GVerifyVerifyPayload,
  type GVerifyVerifyResponse,
  type GVerifyStatusResponse,
  type GVerifyKybVerifyPayload,
  type GVerifyKybVerifyResponse,
  type GVerifyKybCertificate,
  type GVerifyKybStatusResponse,
  type VerificationModeStatus,
} from "@/services/gverify.service";
import type { ApiError } from "@/lib/types";

// ---------- Query keys ----------
export const gverifyKeys = {
  all: ["gverify"] as const,
  status: () => [...gverifyKeys.all, "status"] as const,
  kybCertificate: () => [...gverifyKeys.all, "kyb-certificate"] as const,
  kybStatus: () => [...gverifyKeys.all, "kyb-status"] as const,
  verificationMode: () => [...gverifyKeys.all, "verification-mode"] as const,
  handoff: () => [...gverifyKeys.all, "handoff"] as const,
};

interface UseGVerifyStatusOptions {
  enabled?: boolean;
  // Poll while waiting for another device (the phone handoff) to submit.
  // Same-device verifies don't need it — the mutation seeds this cache.
  poll?: boolean;
}

// Whether a person (MANUAL) or the provider (AUTOMATIC) decides KYC/KYB right
// now. Short staleTime: a system admin can flip it at any moment. Failing to
// read it is not worth an error on a KYC screen, so callers treat a missing
// value as AUTOMATIC (the default) and simply show no notice.
export function useVerificationMode(enabled = true) {
  return useQuery<VerificationModeStatus, ApiError>({
    queryKey: gverifyKeys.verificationMode(),
    queryFn: () => gverifyService.getVerificationMode(),
    staleTime: 30 * 1000,
    retry: false,
    enabled,
  });
}

// Latest GVerify KYC attempt for the logged-in investor. A 404 means they
// never attempted, surfaced as a synthetic NOT_STARTED so the UI renders from
// status.
export function useGVerifyStatus({
  enabled = true,
  poll = false,
}: UseGVerifyStatusOptions = {}) {
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
      queryClient.setQueryData(
        gverifyKeys.status(),
        verifyResponseToStatus(data),
      );
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

export function useGVerifyHandoffToken(enabled = true) {
  return useQuery<GVerifyHandoffResponse, ApiError>({
    queryKey: gverifyKeys.handoff(),
    queryFn: () => gverifyService.createHandoff(),
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled,
  });
}

// ---------- KYB (business verification, SME) ----------

// Latest GVerify KYB attempt for the logged-in SME. 404 = never attempted,
// surfaced as synthetic NOT_STARTED. No polling — KYB is same-device only.
export function useGVerifyKybStatus(enabled = true) {
  return useQuery<GVerifyKybStatusResponse, ApiError>({
    queryKey: gverifyKeys.kybStatus(),
    enabled,
    queryFn: async () => {
      try {
        return await gverifyService.kybGetStatus();
      } catch (err) {
        if ((err as ApiError)?.status === 404) return gverifyKybNotStarted();
        throw err;
      }
    },
    staleTime: 0,
    retry: false,
  });
}

// Submits the certificate and returns the synchronous verdict; seeds the KYB
// status cache. A 502 leaves a FAILED attempt server-side → invalidate.
export function useGVerifyKybVerify() {
  const queryClient = useQueryClient();
  return useMutation<
    GVerifyKybVerifyResponse,
    ApiError,
    GVerifyKybVerifyPayload
  >({
    mutationFn: (payload) => gverifyService.kybVerify(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(
        gverifyKeys.kybStatus(),
        kybVerifyResponseToStatus(data),
      );
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: gverifyKeys.kybStatus() });
    },
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
    mutationFn: ({ payload, token }) =>
      gverifyService.verifyWithToken(payload, token),
  });
}

/**
 * The certificate the SME already gave us for KYB, as a short-lived URL.
 *
 * 404 means "nothing stored" — an ordinary outcome, since retention is
 * best-effort — so it resolves to null rather than throwing. The caller then
 * asks for an upload instead of rendering a broken preview.
 *
 * Not cached for long: the URL expires in 10 minutes, and serving a dead link
 * from cache is worse than refetching.
 */
export function useKybCertificate(enabled = true) {
  return useQuery<GVerifyKybCertificate | null, ApiError>({
    queryKey: gverifyKeys.kybCertificate(),
    enabled,
    queryFn: async () => {
      try {
        return await gverifyService.kybGetCertificate();
      } catch (err) {
        if ((err as ApiError)?.status === 404) return null;
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
