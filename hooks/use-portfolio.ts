"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiError } from "@/lib/types";
import { fundingKeys } from "@/hooks/use-funding";
import {
  portfolioService,
  type BusinessAnalytics,
  type InvestorAnalytics,
  type Transaction,
} from "@/services/portfolio.service";

// Under fundingKeys.all, so anything that moves an investment refreshes them.
export const portfolioKeys = {
  transactions: () => [...fundingKeys.all, "my-transactions"] as const,
  analytics: () => [...fundingKeys.all, "my-analytics"] as const,
  businessTransactions: () =>
    [...fundingKeys.all, "business-transactions"] as const,
  businessAnalytics: () => [...fundingKeys.all, "business-analytics"] as const,
};

// The investor's money in and out. Off for anyone else (an SME's ledger is
// not this one).
export function useMyTransactions(enabled = true) {
  return useQuery<Transaction[], ApiError>({
    queryKey: portfolioKeys.transactions(),
    queryFn: () => portfolioService.getMyTransactions(),
    enabled,
    staleTime: 30 * 1000,
    retry: false,
  });
}

export function useMyAnalytics(enabled = true) {
  return useQuery<InvestorAnalytics, ApiError>({
    queryKey: portfolioKeys.analytics(),
    queryFn: () => portfolioService.getMyAnalytics(),
    enabled,
    staleTime: 60 * 1000,
    retry: false,
  });
}

// The business's money in and out. Off for anyone but the business.
export function useBusinessTransactions(enabled = true) {
  return useQuery<Transaction[], ApiError>({
    queryKey: portfolioKeys.businessTransactions(),
    queryFn: () => portfolioService.getBusinessTransactions(),
    enabled,
    staleTime: 30 * 1000,
    retry: false,
  });
}

export function useBusinessAnalytics(enabled = true) {
  return useQuery<BusinessAnalytics, ApiError>({
    queryKey: portfolioKeys.businessAnalytics(),
    queryFn: () => portfolioService.getBusinessAnalytics(),
    enabled,
    staleTime: 60 * 1000,
    retry: false,
  });
}
