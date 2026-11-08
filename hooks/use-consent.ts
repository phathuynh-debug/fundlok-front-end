"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { authKeys } from "@/hooks/auth-keys";
import type { ApiError } from "@/lib/types";
import {
  consentService,
  type ConsentAcceptPayload,
  type ConsentCodeSent,
  type ConsentStatus,
} from "@/services/consent.service";

// Whether consent is still owed rides on /users/me (`consent_required`), so
// the proxy and the current-user query already have it; these hooks only
// act.

export function useSendConsentCode() {
  return useMutation<ConsentCodeSent, ApiError, void>({
    mutationFn: () => consentService.sendCode(),
  });
}

export function useAcceptConsent() {
  const queryClient = useQueryClient();
  return useMutation<ConsentStatus, ApiError, ConsentAcceptPayload>({
    mutationFn: (payload) => consentService.accept(payload),
    onSuccess: () => {
      // /users/me now says consent_required: false.
      void queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
    },
  });
}
