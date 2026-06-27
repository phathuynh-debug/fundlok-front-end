'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  kycService,
  KYC_NOT_STARTED,
  type KycStartResponse,
  type KycStatusResponse,
} from '@/services/kyc.service';
import type { ApiError } from '@/lib/types';

// ---------- Query keys ----------
export const kycKeys = {
  all: ['kyc'] as const,
  status: () => [...kycKeys.all, 'status'] as const,
};

interface UseKycStatusOptions {
  // Poll while the verification is still in flight (used on the callback page).
  poll?: boolean;
  enabled?: boolean;
}

// Reads the latest verification. A 404 means the user never started KYC, which
// we surface as a synthetic "Not Started" rather than an error so the UI can
// just render from `status`.
export function useKycStatus({ poll = false, enabled = true }: UseKycStatusOptions = {}) {
  return useQuery<KycStatusResponse, ApiError>({
    queryKey: kycKeys.status(),
    queryFn: async () => {
      try {
        return await kycService.getStatus();
      } catch (err) {
        if ((err as ApiError)?.status === 404) return KYC_NOT_STARTED;
        throw err;
      }
    },
    enabled,
    staleTime: 0,
    retry: false,
    // Poll every 3s until the decision is terminal. We also stop on "In Review"
    // — a human reviews it, so there's nothing to poll for; the UI shows a
    // "we'll notify you" state and a later refresh picks up the result.
    refetchInterval: poll
      ? (query) => {
          const data = query.state.data;
          if (!data) return 3000;
          // Nothing to poll once it's decided, under human review, or not yet
          // started (the consent screen — the user hasn't begun a session).
          if (data.is_terminal || data.status === 'In Review' || data.status === 'Not Started') {
            return false;
          }
          return 3000;
        }
      : false,
  });
}

// Begins/resumes verification. The caller redirects to verification_url.
export function useStartKyc() {
  return useMutation<KycStartResponse, ApiError, void>({
    mutationFn: () => kycService.start(),
  });
}

// Fallback refresh straight from Didit; seeds the status cache with the result.
export function useSyncKyc() {
  const queryClient = useQueryClient();
  return useMutation<KycStatusResponse, ApiError, void>({
    mutationFn: () => kycService.sync(),
    onSuccess: (data) => queryClient.setQueryData(kycKeys.status(), data),
  });
}
