import { apiClient } from "@/lib/api-client";
import { UNDERWRITING_ENDPOINTS } from "@/lib/endpoints";

// The grading engine's run lifecycle, distinct from its verdict.
export type ScoreRunStatus = "RUNNING" | "READY" | "LOCKED" | "FAILED";

/**
 * The engine's OUTCOME. Not the same axis as the status above: a run can be
 * LOCKED (lifecycle complete) having decided REVIEW (not an approval).
 *
 * INSUFFICIENT_DATA and AI_PENDING are real answers, not errors — the engine
 * declining to score for want of inputs is information, and must not be
 * rendered as a failure or coerced to a zero.
 */
export type ScoreRunDecision =
  "APPROVED" | "REVIEW" | "REJECT" | "INSUFFICIENT_DATA" | "AI_PENDING";

export interface ScoreRunOut {
  id: string;
  application_id: string;
  status: ScoreRunStatus | string;
  decision: ScoreRunDecision | string | null;
  grade: { value: number | null } | null;
  pricing: {
    interest_rate_pct: number | null;
    target_payment_vnd: number | null;
    target_daily_vnd: number | null;
  } | null;
  fired_gates: Array<{ key?: string; severity?: string }> | null;
  versions: Record<string, string> | null;
}

export interface ScoreRunCreatePayload {
  application_id: string;
  /** Free-text run mode the backend records; null for a normal run. */
  mode?: string | null;
}

export const underwritingService = {
  // Admin only. 400 if the application is not SUBMITTED — scoring a draft
  // would grade figures the SME has not finished entering.
  startScoreRun(body: ScoreRunCreatePayload) {
    return apiClient.post<ScoreRunOut>(UNDERWRITING_ENDPOINTS.scoreRuns, {
      mode: null,
      ...body,
    });
  },
};
