"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/lib/types";
import type { ListingDocumentKind } from "@/lib/endpoints";
import {
  loansService,
  type ListingDocuments,
  type LoanApplicationFiguresPayload,
  type LoanApplicationSubmitResponse,
  publicRateService,
  type RateEstimate,
  type RateEstimatePayload,
} from "@/services/loans.service";
import { projectKeys } from "@/hooks/use-projects";
import { fundingKeys } from "@/hooks/use-funding";

export const loanKeys = {
  all: ["loans"] as const,
  serviceAgreement: (applicationId: string) =>
    [...loanKeys.all, "service-agreement", applicationId] as const,
  standingOffer: (applicationId: string) =>
    [...loanKeys.all, "standing-offer", applicationId] as const,
  loanContract: (applicationId: string) =>
    [...loanKeys.all, "loan-contract", applicationId] as const,
  listingDocuments: (applicationId: string) =>
    [...loanKeys.all, "listing-documents", applicationId] as const,
  signedListingDocument: (
    applicationId: string,
    kind: ListingDocumentKind,
    signedAt: string,
  ) =>
    [
      ...loanKeys.all,
      "listing-documents",
      applicationId,
      kind,
      "signed",
      signedAt,
    ] as const,
};

export function useSubmitLoanApplication() {
  const queryClient = useQueryClient();

  return useMutation<LoanApplicationSubmitResponse, ApiError, string>({
    mutationFn: (applicationId) =>
      loansService.submitApplication(applicationId),
    onSuccess: () => {
      // Submitting moves the application out of DRAFT — refetch so the
      // dashboard swaps the upload wizard for the submitted state.
      queryClient.invalidateQueries({ queryKey: projectKeys.mine() });
    },
  });
}

export function useSaveLoanFigures() {
  const queryClient = useQueryClient();

  return useMutation<
    LoanApplicationFiguresPayload,
    ApiError,
    { applicationId: string; payload: LoanApplicationFiguresPayload }
  >({
    mutationFn: ({ applicationId, payload }) =>
      loansService.saveFigures(applicationId, payload),
    onSuccess: () => {
      // The figures are part of the application record the dashboard reads.
      queryClient.invalidateQueries({ queryKey: projectKeys.mine() });
    },
  });
}

/**
 * The public rate calculator (/rate).
 *
 * A mutation rather than a query: nothing exists to read until the visitor
 * presses Calculate, and the result is a function of what they typed rather
 * than of server state. That also keeps the engine off the keystroke path —
 * no debounced requests firing as someone types their revenue.
 *
 * `retry: false` for the same reason as the wizard's band: every error this
 * endpoint returns is a 422 describing something the visitor must change.
 */
export function useRateEstimate() {
  return useMutation<RateEstimate, ApiError, RateEstimatePayload>({
    mutationFn: (payload) => publicRateService.estimate(payload),
    retry: false,
  });
}

/**
 * The SME Service Agreement for one application, as the PDF the SME reviews,
 * downloads and signs. Generated on the server from what FundLok holds (the
 * verified business, the approved bank account, the application's amount and
 * term), so it is fetched fresh each time the step opens rather than cached:
 * a bank account approved in the meantime must show up in it.
 */
export function useServiceAgreement(applicationId: string, enabled = true) {
  return useQuery<{ blob: Blob; filename: string | null }, ApiError>({
    queryKey: loanKeys.serviceAgreement(applicationId),
    queryFn: () => loansService.getServiceAgreement(applicationId),
    enabled: enabled && !!applicationId,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

/**
 * The Standing Offer to Conclude Loan Contracts for an approved application,
 * as the PDF the SME and its Personal Guarantor review, download and sign.
 * Generated on the server each time, like the Service Agreement, so never
 * cached.
 */
export function useStandingOffer(applicationId: string, enabled = true) {
  return useQuery<{ blob: Blob; filename: string | null }, ApiError>({
    queryKey: loanKeys.standingOffer(applicationId),
    queryFn: () => loansService.getStandingOffer(applicationId),
    enabled: enabled && !!applicationId,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

/**
 * The Loan Contract template (Contract 5) for an approved application, as the
 * PDF the SME and its Personal Guarantor sign; each Investor's own contract is
 * generated from it at commitment. Generated each time, so never cached.
 */
export function useLoanContract(applicationId: string, enabled = true) {
  return useQuery<{ blob: Blob; filename: string | null }, ApiError>({
    queryKey: loanKeys.loanContract(applicationId),
    queryFn: () => loansService.getLoanContract(applicationId),
    enabled: enabled && !!applicationId,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

/** Where signing the three listing documents stands on an application. */
export function useListingDocuments(applicationId: string, enabled = true) {
  return useQuery<ListingDocuments, ApiError>({
    queryKey: loanKeys.listingDocuments(applicationId),
    queryFn: () => loansService.getListingDocuments(applicationId),
    enabled: enabled && !!applicationId,
    staleTime: 30 * 1000,
    retry: false,
  });
}

/**
 * Uploading one signed document. The answer is the new signing status; when
 * it says the project is now published, the dashboard's project and its
 * funding round are refetched so the SME sees the listing go live.
 */
export function useSignListingDocument(applicationId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    ListingDocuments,
    ApiError,
    { kind: ListingDocumentKind; file: File }
  >({
    mutationFn: ({ kind, file }) =>
      loansService.uploadSignedListingDocument(applicationId, kind, file),
    onSuccess: (status) => {
      queryClient.setQueryData(
        loanKeys.listingDocuments(applicationId),
        status,
      );
      if (status.published) {
        void queryClient.invalidateQueries({ queryKey: projectKeys.mine() });
        void queryClient.invalidateQueries({
          queryKey: fundingKeys.myRounds(),
        });
      }
    },
  });
}

/**
 * Saving the Personal Guarantor's address. The Offer and the Loan Contract
 * print it, so both are generated again with it.
 */
export function useSetGuarantorAddress(applicationId: string) {
  const queryClient = useQueryClient();
  return useMutation<ListingDocuments, ApiError, string>({
    mutationFn: (address) =>
      loansService.setGuarantorAddress(applicationId, address),
    onSuccess: (status) => {
      queryClient.setQueryData(
        loanKeys.listingDocuments(applicationId),
        status,
      );
      void queryClient.invalidateQueries({
        queryKey: loanKeys.standingOffer(applicationId),
      });
      void queryClient.invalidateQueries({
        queryKey: loanKeys.loanContract(applicationId),
      });
    },
  });
}

/** The signed copy on file, by when it was signed (it never changes after). */
export function useSignedListingDocument(
  applicationId: string,
  kind: ListingDocumentKind,
  signedAt: string | null,
  enabled = true,
) {
  return useQuery<{ blob: Blob; filename: string | null }, ApiError>({
    queryKey: loanKeys.signedListingDocument(
      applicationId,
      kind,
      signedAt ?? "",
    ),
    queryFn: () => loansService.getSignedListingDocument(applicationId, kind),
    enabled: enabled && !!applicationId && !!signedAt,
    staleTime: Infinity,
    retry: false,
  });
}
