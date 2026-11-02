"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  sepayService,
  type SepayBankAccount,
  type SepayCallbackPayload,
  type SepayConnectStart,
  type SepayStatus,
} from "@/services/sepay.service";
import type { ApiError } from "@/lib/types";

export const sepayKeys = {
  all: ["sepay"] as const,
  status: () => [...sepayKeys.all, "status"] as const,
  bankAccounts: () => [...sepayKeys.all, "bank-accounts"] as const,
};

export function useSepayStatus(enabled = true) {
  return useQuery<SepayStatus, ApiError>({
    queryKey: sepayKeys.status(),
    queryFn: () => sepayService.getStatus(),
    staleTime: 60 * 1000,
    retry: false,
    enabled,
  });
}

// Only fetched while the connection is active.
export function useSepayBankAccounts(enabled = true) {
  return useQuery<SepayBankAccount[], ApiError>({
    queryKey: sepayKeys.bankAccounts(),
    queryFn: () => sepayService.listBankAccounts(),
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled,
  });
}

// Gets the SePay approval URL; the caller sends the browser there.
export function useStartSepayConnect() {
  return useMutation<SepayConnectStart, ApiError, void>({
    mutationFn: () => sepayService.startConnect(),
  });
}

export function useFinishSepayConnect() {
  const queryClient = useQueryClient();
  return useMutation<SepayStatus, ApiError, SepayCallbackPayload>({
    mutationFn: (payload) => sepayService.finishConnect(payload),
    onSuccess: (status) => {
      queryClient.setQueryData(sepayKeys.status(), status);
      queryClient.removeQueries({ queryKey: sepayKeys.bankAccounts() });
    },
  });
}

export function useDisconnectSepay() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, void>({
    mutationFn: () => sepayService.disconnect(),
    onSuccess: () => {
      queryClient.setQueryData<SepayStatus>(sepayKeys.status(), (current) => ({
        configured: current?.configured ?? true,
        connected: false,
        status: null,
        connected_at: null,
        scopes: [],
      }));
      queryClient.removeQueries({ queryKey: sepayKeys.bankAccounts() });
    },
  });
}
