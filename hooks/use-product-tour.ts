"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useCurrentUser } from "@/hooks/use-authentication";
import { useCompleteOnboardingTour } from "@/hooks/use-users";
import {
  tourStepsForRole,
  tourStorageKey,
  type TourStep,
} from "@/lib/constants/tour-steps";
import type { SelectableRole } from "@/services/authentication.service";
import { useTourEngine, type SpotlightRect } from "@/hooks/use-tour-engine";

export type { SpotlightRect };

/**
 * First-run walkthrough state.
 *
 * Which step is showing is local, ephemeral UI state — `useState`, not React
 * Query: it never round trips, so there is no query key and nothing to cache.
 *
 * WHETHER the walkthrough has been seen is the opposite: it belongs to the
 * ACCOUNT, so it is server state (`user.onboarding_tour_completed_at`, seeded
 * by GET /users/me at login) and is written back through a React Query
 * mutation. Someone who onboards on their laptop is not walked through the
 * product again on their phone, and clearing site data does not resurrect it.
 *
 * `localStorage` survives only as a local mirror, for two jobs neither of
 * which the server can do:
 *   1. Holding the tour closed between the click and the server round trip,
 *      and if that write fails.
 *   2. Standing in entirely when the field is ABSENT from /users/me — a
 *      backend that predates the column. Without that fallback the tour would
 *      replay on every single load against an older API.
 * Every access is wrapped: a private window makes the accessor itself throw.
 *
 * The heavy lifting lives here rather than in the component so the sequencing
 * (wait for the role, resolve targets, measure, reposition) is testable and the
 * overlay stays presentation.
 */

/**
 * How long to keep looking for the tour's targets before starting with
 * whatever has appeared. Long enough to outlast a slow /projects response,
 * short enough that a first-time user is not staring at an undimmed dashboard
 * wondering whether anything is going to happen.
 */
const RESOLVE_TIMEOUT_MS = 4000;
const RESOLVE_POLL_MS = 120;

function readSeen(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    // Private window, blocked site data, thumbnailing context. Treat an
    // unreadable store as "not seen": showing the tour twice is a far smaller
    // problem than a broken dashboard.
    return false;
  }
}

function writeSeen(key: string): void {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    // Nothing to do — the tour simply offers itself again next time.
  }
}

export interface ProductTour {
  isOpen: boolean;
  step: TourStep | null;
  stepIndex: number;
  stepCount: number;
  rect: SpotlightRect | null;
  isLastStep: boolean;
  next: () => void;
  back: () => void;
  /** Replay from step one, regardless of whether it has been seen. */
  restart: () => void;
  /** Finish or skip — both mean "do not show this again". */
  dismiss: () => void;
}

export function useProductTour({ enabled }: { enabled: boolean }): ProductTour {
  const { data: user, isPending: isUserPending } = useCurrentUser();
  const completeTour = useCompleteOnboardingTour();
  const role = (user?.role ?? null) as SelectableRole | null;

  // The server is the authority when it has an opinion. `undefined` means the
  // backend never sent the field; `null` means it did and this account has not
  // been onboarded yet — a distinction the fallback depends on.
  const serverSeen = user?.onboarding_tour_completed_at;
  const serverKnows = serverSeen !== undefined;

  const engine = useTourEngine();
  const { open, close } = engine;

  const candidateSteps = useMemo(() => tourStepsForRole(role), [role]);

  const openNow = useCallback(
    () => open(candidateSteps),
    [open, candidateSteps],
  );

  // Start-up: wait for the role, check whether this person has already been
  // shown it, then keep only the steps whose target is actually on the page.
  //
  // Resolution RETRIES until the deadline rather than measuring once. The
  // dashboard body arrives from React Query, so on a slow response the first
  // frame has a loading skeleton and no "apply for funding" button — and an
  // SME would silently lose the one step that matters most to them. Polling
  // until the full set resolves, then settling for whatever is there, handles
  // both the slow load and the genuinely-absent target (a narrow viewport
  // where the sidebar is hidden).
  //
  // All of it runs off a timer rather than in the effect body: the DOM has to
  // lay out before a selector resolves, and a synchronous setState in an
  // effect is banned here anyway (react-hooks/set-state-in-effect).
  useEffect(() => {
    if (!enabled || !role || candidateSteps.length === 0) return;
    // Wait for /users/me rather than racing it: opening the tour and then
    // discovering the account was onboarded months ago is worse than a beat
    // of delay.
    if (isUserPending) return;
    // The server wins outright when it has an opinion. A local mirror that
    // disagrees is stale — a dismissal whose write failed, or one recorded
    // before the account column existed — and letting it outrank the account
    // would hide the walkthrough forever with no way back.
    if (serverKnows) {
      if (serverSeen !== null) return;
    } else if (readSeen(tourStorageKey(role))) {
      return;
    }

    const deadline = Date.now() + RESOLVE_TIMEOUT_MS;
    let timer: ReturnType<typeof setTimeout>;

    const attempt = () => {
      const live = candidateSteps.filter((step) =>
        Boolean(document.querySelector(step.target)),
      );

      if (live.length === candidateSteps.length || Date.now() >= deadline) {
        // Nothing to point at at all — say nothing rather than opening an
        // empty tour.
        openNow();
        return;
      }

      timer = setTimeout(attempt, RESOLVE_POLL_MS);
    };

    timer = setTimeout(attempt, RESOLVE_POLL_MS);
    return () => clearTimeout(timer);
  }, [
    enabled,
    role,
    candidateSteps,
    isUserPending,
    serverKnows,
    serverSeen,
    openNow,
  ]);

  const dismiss = useCallback(() => {
    // Mirror locally first so the overlay cannot flicker back while the write
    // is in flight, then record it against the account.
    if (role) writeSeen(tourStorageKey(role));
    close();
    completeTour.mutate();
  }, [role, close, completeTour]);

  /**
   * Replay on demand, from the help button.
   *
   * Deliberately ignores `enabled` and the completed-at timestamp: someone who
   * asks for the walkthrough is asking for it whatever the account says, and
   * on a page other than the dashboard they simply get the steps whose targets
   * exist there. Dismissing afterwards re-POSTs the completion, which the
   * backend treats as a no-op rather than moving the original timestamp.
   */
  const restart = useCallback(() => {
    openNow();
  }, [openNow]);

  return { ...engine, restart, dismiss };
}
