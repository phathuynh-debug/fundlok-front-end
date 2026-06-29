'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  verificationService,
  verificationKindForRole,
  notStartedStatus,
  type VerificationKind,
  type VerificationStartResponse,
  type VerificationStatusResponse,
} from '@/services/verification.service';
import { useCurrentUser } from '@/hooks/use-authentication';
import type { ApiError } from '@/lib/types';

// ---------- Query keys ----------
export const verificationKeys = {
  all: ['verification'] as const,
  // Keyed by kind so KYC and KYB caches never collide.
  status: (kind: VerificationKind | null) =>
    [...verificationKeys.all, 'status', kind] as const,
};

// Resolves the prefix for the logged-in user: INVESTOR → KYC, SME → KYB.
// null for admins / roleless (they don't verify).
export function useVerificationKind(): VerificationKind | null {
  const { data: user } = useCurrentUser();
  return verificationKindForRole(user?.role);
}

interface UseVerificationStatusOptions {
  poll?: boolean;
  enabled?: boolean;
}

// Reads the latest verification for the user's kind. A 404 means they never
// started, surfaced as a synthetic "Not Started" so the UI renders from status.
export function useVerificationStatus({
  poll = false,
  enabled = true,
}: UseVerificationStatusOptions = {}) {
  const kind = useVerificationKind();
  return useQuery<VerificationStatusResponse, ApiError>({
    queryKey: verificationKeys.status(kind),
    enabled: enabled && kind !== null,
    queryFn: async () => {
      try {
        return await verificationService.getStatus(kind as VerificationKind);
      } catch (err) {
        if ((err as ApiError)?.status === 404) return notStartedStatus(kind as VerificationKind);
        throw err;
      }
    },
    staleTime: 0,
    retry: false,
    refetchInterval: poll
      ? (query) => {
        const data = query.state.data;
        if (!data) return 3000;
        // Stop once decided, under human review, or not yet started.
        if (data.is_terminal || data.status === 'In Review' || data.status === 'Not Started') {
          return false;
        }
        return 3000;
      }
      : false,
  });
}

// Begins/resumes verification for the user's kind. Caller passes the locale and
// redirects to verification_url.
export function useStartVerification() {
  const kind = useVerificationKind();
  return useMutation<VerificationStartResponse, ApiError, string | undefined>({
    mutationFn: (language) => verificationService.start(kind as VerificationKind, language),
  });
}

// Fallback refresh straight from Didit; seeds the status cache with the result.
export function useSyncVerification() {
  const kind = useVerificationKind();
  const queryClient = useQueryClient();
  return useMutation<VerificationStatusResponse, ApiError, void>({
    mutationFn: () => verificationService.sync(kind as VerificationKind),
    onSuccess: (data) => queryClient.setQueryData(verificationKeys.status(kind), data),
  });
}
