"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { adminKeys } from "@/hooks/use-admin";
import {
  underwritingService,
  type ScoreRunCreatePayload,
  type ScoreRunOut,
} from "@/services/underwriting.service";
import type { ApiError } from "@/lib/types";

export const underwritingKeys = {
  all: ["underwriting"] as const,
  scoreRuns: () => [...underwritingKeys.all, "score-runs"] as const,
};

/**
 * Start a score run for one application.
 *
 * Invalidates the admin project preview rather than seeding it: the run is
 * what the preview renders, and a run can come back INSUFFICIENT_DATA or
 * AI_PENDING — re-reading the server's own record avoids the client inventing
 * a shape for those.
 */
export function useStartScoreRun(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation<ScoreRunOut, ApiError, ScoreRunCreatePayload>({
    mutationFn: (body) => underwritingService.startScoreRun(body),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({
          queryKey: adminKeys.projectDetail(projectId),
        });
      }
    },
  });
}
