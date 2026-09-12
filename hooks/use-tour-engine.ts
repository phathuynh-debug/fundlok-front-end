"use client";

import { useCallback, useEffect, useState } from "react";
import type { TourStep } from "@/lib/constants/tour-steps";

/**
 * The spotlight mechanics shared by every guided walkthrough: which step is
 * showing, where its target sits on screen, and moving between them.
 *
 * Deliberately knows nothing about roles, accounts or persistence. There are
 * two walkthroughs now — the dashboard orientation tour, which opens itself
 * once per account, and the document-submission guide, which only ever opens
 * when an SME asks for it — and the only thing they have in common is this.
 * Whether a tour should open is the caller's business; how it draws is here.
 */

/** A measured target, in viewport coordinates. */
export interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Breathing room between the target's edge and the cut-out. */
const PADDING = 8;

function measure(selector: string): SpotlightRect | null {
  const element = document.querySelector(selector);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;
  return {
    top: rect.top - PADDING,
    left: rect.left - PADDING,
    width: rect.width + PADDING * 2,
    height: rect.height + PADDING * 2,
  };
}

export interface TourEngine {
  isOpen: boolean;
  step: TourStep | null;
  stepIndex: number;
  stepCount: number;
  rect: SpotlightRect | null;
  isLastStep: boolean;
  next: () => void;
  back: () => void;
  /**
   * Open at step one with whatever targets are on the page right now.
   * Returns false when none of them are, so a caller can stay silent rather
   * than opening an empty walkthrough.
   */
  open: (candidates: readonly TourStep[]) => boolean;
  close: () => void;
}

export function useTourEngine(): TourEngine {
  const [steps, setSteps] = useState<readonly TourStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<SpotlightRect | null>(null);

  const open = useCallback((candidates: readonly TourStep[]) => {
    // Steps whose target is not on the page are dropped rather than pointing
    // at nothing — a narrow viewport, or a step of the form the SME has not
    // reached yet.
    const live = candidates.filter((step) =>
      Boolean(document.querySelector(step.target)),
    );
    if (live.length === 0) return false;
    setSteps(live);
    setStepIndex(0);
    return true;
  }, []);

  const close = useCallback(() => {
    setSteps([]);
    setStepIndex(0);
    setRect(null);
  }, []);

  const isOpen = steps.length > 0;
  const step = isOpen ? (steps[stepIndex] ?? null) : null;

  // Keep the cut-out on its target through scrolls, resizes and the sidebar's
  // own transitions. The work happens in rAF rather than the effect body: a
  // synchronous setState in an effect is banned here
  // (react-hooks/set-state-in-effect), and layout has to settle first anyway.
  useEffect(() => {
    if (!step) return;

    // A guide that lives inside a long form will often point at something
    // below the fold — the step indicator when the page is scrolled down, the
    // send button on the review screen. Bring it into view first, or the
    // spotlight highlights empty space and the card lands off-screen with it.
    document
      .querySelector(step.target)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });

    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setRect(measure(step.target)));
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [step]);

  const next = useCallback(() => {
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }, [steps.length]);

  const back = useCallback(() => {
    setStepIndex((current) => Math.max(0, current - 1));
  }, []);

  return {
    isOpen,
    step,
    stepIndex,
    stepCount: steps.length,
    rect,
    isLastStep: stepIndex >= steps.length - 1,
    next,
    back,
    open,
    close,
  };
}
