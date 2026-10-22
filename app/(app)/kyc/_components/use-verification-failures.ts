"use client";

import { useCallback, useState } from "react";

export const MAX_VERIFICATION_FAILURES = 3;

function getStorageKey(flow: "kyc" | "kyb"): string {
  return `fundlok_${flow}_failures`;
}

function readStoredFailures(flow: "kyc" | "kyb"): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.sessionStorage.getItem(getStorageKey(flow));
    if (!raw) return 0;
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function writeStoredFailures(flow: "kyc" | "kyb", count: number): void {
  if (typeof window === "undefined") return;
  try {
    if (count <= 0) {
      window.sessionStorage.removeItem(getStorageKey(flow));
    } else {
      window.sessionStorage.setItem(getStorageKey(flow), String(count));
    }
  } catch {
    // sessionStorage not available or full
  }
}

export function useVerificationFailures(flow: "kyc" | "kyb" = "kyc") {
  const [failureCount, setFailureCount] = useState<number>(() =>
    readStoredFailures(flow),
  );
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const recordFailure = useCallback(() => {
    setFailureCount((prev) => {
      const next = prev + 1;
      writeStoredFailures(flow, next);
      if (next >= MAX_VERIFICATION_FAILURES) {
        setIsDialogOpen(true);
      }
      return next;
    });
  }, [flow]);

  const resetFailures = useCallback(() => {
    writeStoredFailures(flow, 0);
    setFailureCount(0);
    setIsDialogOpen(false);
  }, [flow]);

  const hasReachedMaxFailures = failureCount >= MAX_VERIFICATION_FAILURES;

  return {
    failureCount,
    hasReachedMaxFailures,
    isDialogOpen,
    setIsDialogOpen,
    recordFailure,
    resetFailures,
  };
}
