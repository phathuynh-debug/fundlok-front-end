"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  paymentAccountsService,
  type AccountEvidencePurpose,
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

export interface SavePaymentAccountVariables extends Omit<
  CreatePaymentAccountRequest,
  "evidence_file_id"
> {
  statement: File;
  statementPurpose: AccountEvidencePurpose;
}

// Upload the statement, then save the account that points at it. One mutation,
// so the dialog has a single pending/error state for the whole save.
export function useSavePaymentAccount() {
  const queryClient = useQueryClient();

  return useMutation<PaymentAccount, ApiError, SavePaymentAccountVariables>({
    mutationFn: async ({ statement, statementPurpose, ...account }) => {
      const evidence = await paymentAccountsService.uploadBankStatement(
        statement,
        statementPurpose,
      );
      return paymentAccountsService.createPaymentAccount({
        ...account,
        evidence_file_id: evidence.file_id,
      });
    },
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
