"use client";

import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/lib/types";
import {
  ratesService,
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
