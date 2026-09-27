"use client";

import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/lib/types";
import {
  ratesService,
  type InvestorChoices,
  type InvestorEstimate,
  type InvestorLeadAdminItem,
  type InvestorLeadCreateRequest,
  type InvestorLeadResponse,
  type InvestorLeadsAdminListResponse,
  type InvestorLeadsQueryParams,
  type InvestorSignupResponse,
  type InvestorTiersResponse,
  type RateCalculateRequest,
  type RateCalculateResponse,
  type RateInquiryAdminItem,
  type RateInquiriesAdminListResponse,
  type RateInquiriesQueryParams,
} from "@/services/rates.service";

export const rateKeys = {
  all: ["rates"] as const,
  inquiries: (params: RateInquiriesQueryParams = {}) =>
    [...rateKeys.all, "inquiries", params] as const,
  inquiryDetail: (id: string) => [...rateKeys.all, "inquiry", id] as const,
  investorTiers: () => [...rateKeys.all, "investor-tiers"] as const,
  investorEstimate: (leadId: string, choices: InvestorChoices) =>
    [...rateKeys.all, "investor-estimate", leadId, choices] as const,
  investorLeads: (params: InvestorLeadsQueryParams = {}) =>
    [...rateKeys.all, "investor-leads", params] as const,
  investorLead: (id: string) => [...rateKeys.all, "investor-lead", id] as const,
};

/**
 * Public rate calculate mutation for /rate page.
 * Sends user inputs to POST /api/v1/rates/calculate.
 */
export function useCalculateRate() {
  return useMutation<RateCalculateResponse, ApiError, RateCalculateRequest>({
    mutationFn: (payload) => ratesService.calculate(payload),
    retry: false,
  });
}

/**
 * Admin rate inquiries query for /admin/rates page.
 */
export function useRateInquiries(
  params: RateInquiriesQueryParams = {},
  enabled = true,
) {
  return useQuery<RateInquiriesAdminListResponse, ApiError>({
    queryKey: rateKeys.inquiries(params),
    queryFn: () => ratesService.getInquiries(params),
    staleTime: 30 * 1000,
    retry: false,
    enabled,
    placeholderData: keepPreviousData,
  });
}

/**
 * Admin rate inquiry detail query.
 */
export function useRateInquiryDetail(inquiryId: string | null, enabled = true) {
  return useQuery<RateInquiryAdminItem, ApiError>({
    queryKey: rateKeys.inquiryDetail(inquiryId ?? ""),
    queryFn: () => ratesService.getInquiryDetail(inquiryId!),
    staleTime: 60 * 1000,
    retry: false,
    enabled: enabled && !!inquiryId,
  });
}

// --------------------------------------------------------------------------
// Investor tab
// --------------------------------------------------------------------------

/** Loan rate per tier, for the hint under the tier buttons. */
export function useInvestorTiers() {
  return useQuery<InvestorTiersResponse, ApiError>({
    queryKey: rateKeys.investorTiers(),
    queryFn: () => ratesService.getInvestorTiers(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

/** "Calculate my target yield": stores the lead, returns the first estimate. */
export function useCreateInvestorLead() {
  return useMutation<InvestorLeadResponse, ApiError, InvestorLeadCreateRequest>(
    {
      mutationFn: (payload) => ratesService.createInvestorLead(payload),
      retry: false,
    },
  );
}

/**
 * The live estimate after the first calculation. A query rather than a
 * mutation: keyed on the choices, so returning to a combination already seen
 * is instant, a stale response can never overwrite a newer one, and the
 * previous number stays on screen while the next one loads. Pass `null` for
 * `leadId` until the lead exists — the server refuses an estimate without one.
 */
export function useInvestorEstimate(
  leadId: string | null,
  choices: InvestorChoices | null,
) {
  return useQuery<InvestorEstimate, ApiError>({
    queryKey: rateKeys.investorEstimate(leadId ?? "", choices!),
    queryFn: () => ratesService.estimateInvestorLead(leadId!, choices!),
    enabled: !!leadId && !!choices,
    staleTime: 5 * 60 * 1000,
    retry: false,
    placeholderData: keepPreviousData,
  });
}

export function useInvestorSignup() {
  return useMutation<
    InvestorSignupResponse,
    ApiError,
    { leadId: string; choices: InvestorChoices }
  >({
    mutationFn: ({ leadId, choices }) =>
      ratesService.signUpInvestorLead(leadId, choices),
    retry: false,
  });
}

/** Admin: investor leads from the /rate page. */
export function useInvestorLeads(
  params: InvestorLeadsQueryParams = {},
  enabled = true,
) {
  return useQuery<InvestorLeadsAdminListResponse, ApiError>({
    queryKey: rateKeys.investorLeads(params),
    queryFn: () => ratesService.getInvestorLeads(params),
    staleTime: 30 * 1000,
    retry: false,
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useInvestorLead(id: string | null) {
  return useQuery<InvestorLeadAdminItem, ApiError>({
    queryKey: rateKeys.investorLead(id ?? ""),
    queryFn: () => ratesService.getInvestorLead(id!),
    staleTime: 60 * 1000,
    retry: false,
    enabled: !!id,
  });
}
