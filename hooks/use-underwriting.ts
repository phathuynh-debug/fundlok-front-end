"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { adminKeys } from "@/hooks/use-admin";
import {
  underwritingService,
  type ScoreRunApproveOut,
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

/**
 * Approve (lock) a READY score run: the engine's half of the two-approval gate.
 *
 * Invalidates the project preview AND the overview table. Which approval lands
 * second is the one that puts the business live, so the status in the table
 * the preview was opened from can change as a result of this click.
 */
export function useApproveScoreRun(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation<ScoreRunApproveOut, ApiError, string>({
    mutationFn: (scoreRunId) => underwritingService.approveScoreRun(scoreRunId),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({
          queryKey: adminKeys.projectDetail(projectId),
        });
      }
      void queryClient.invalidateQueries({ queryKey: adminKeys.overviewAll() });
    },
  });
}
