"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  paymentAccountsService,
  type Bank,
  type CreatePaymentAccountRequest,
  type ParsedVietQr,
  type PaymentAccount,
  type VietQr,
} from "@/services/payment-accounts.service";
import type { ApiError } from "@/lib/types";

export const paymentAccountKeys = {
  all: ["payment-accounts"] as const,
  banks: () => [...paymentAccountKeys.all, "banks"] as const,
  mine: () => [...paymentAccountKeys.all, "mine"] as const,
  vietQr: (id: string) => [...paymentAccountKeys.all, "vietqr", id] as const,
};

// The bank list is static reference data: fetch it once per session.
export function useBanks(enabled = true) {
  return useQuery<Bank[], ApiError>({
    queryKey: paymentAccountKeys.banks(),
    queryFn: () => paymentAccountsService.listBanks(),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    enabled,
  });
}

export function usePaymentAccounts(enabled = true) {
  return useQuery<PaymentAccount[], ApiError>({
    queryKey: paymentAccountKeys.mine(),
    queryFn: () => paymentAccountsService.listPaymentAccounts(),
    staleTime: 60 * 1000,
    retry: false,
    enabled,
  });
}

// Whether the user has an account that counts: one an admin APPROVED, the
// same rule the backend applies before listing an SME's project or accepting
// an investor's order. `hasPending` says one is saved and waiting for review.
// `isLoaded` is false until the list is in, so callers can avoid flashing a
// "no account" state.
export function useHasBankAccount(enabled = true) {
  const accounts = usePaymentAccounts(enabled);
  const list = accounts.data ?? [];
  return {
    hasAccount: list.some((account) => account.status === "APPROVED"),
    hasPending: list.some((account) => account.status === "PENDING"),
    isLoaded: accounts.isSuccess,
  };
}

export function useSavePaymentAccount() {
  const queryClient = useQueryClient();

  return useMutation<PaymentAccount, ApiError, CreatePaymentAccountRequest>({
    mutationFn: (payload) =>
      paymentAccountsService.createPaymentAccount(payload),
    onSuccess: (account) => {
      queryClient.setQueryData<PaymentAccount[]>(
        paymentAccountKeys.mine(),
        (current) => [...(current ?? []), account],
      );
    },
  });
}

export function useParseVietQr() {
  return useMutation<ParsedVietQr, ApiError, string>({
    mutationFn: (payload) => paymentAccountsService.parseVietQr(payload),
  });
}

// A saved account's QR never changes, so it is cached for the session.
export function useAccountVietQr(id: string | null) {
  return useQuery<VietQr, ApiError>({
    queryKey: paymentAccountKeys.vietQr(id ?? ""),
    queryFn: () => paymentAccountsService.getVietQr(id as string),
    staleTime: Infinity,
    retry: false,
    enabled: Boolean(id),
  });
}
