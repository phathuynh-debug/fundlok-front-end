"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAppearance } from "@/components/appearance-provider";
import {
  useProductTour,
  type ProductTour as ProductTourState,
  type SpotlightRect,
} from "@/hooks/use-product-tour";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * First-run walkthrough: dims the dashboard, cuts a hole around one navigation
 * item at a time, and explains what lives behind it.
 *
 * The spotlight is a single element with an enormous spread `box-shadow`
 * rather than four masking divs or an SVG mask: one box, one rounded corner
 * radius, and it tracks the target with no seams at any zoom level. The scrim
 * colour matches the app's dialog overlay (`bg-black/50`) so a tour and a modal
 * dim the page the same amount.
 */

/**
 * The walkthrough now has two consumers — the overlay and the "replay" button
 * in the header — so its state lives in a context rather than being threaded
 * through the layout as props. Same shape as the loan-application context: the
 * hook holds the logic, the provider only distributes it.
 */
const ProductTourContext = createContext<ProductTourState | null>(null);

export function useProductTourControls(): ProductTourState {
  const value = useContext(ProductTourContext);
  if (!value) {
    throw new Error(
      "useProductTourControls must be used within a ProductTourProvider",
    );
  }
  return value;
}

export function ProductTourProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // `enabled` gates only the AUTOMATIC first-run open: that belongs on the
  // dashboard landing page, where the targets live and where interrupting
  // someone costs nothing. Replaying from the help button works anywhere.
  const tour = useProductTour({ enabled: pathname === "/dashboard" });

  return (
    <ProductTourContext.Provider value={tour}>
      {children}
    </ProductTourContext.Provider>
  );
}

const CARD_WIDTH = 320;
const GAP = 14;

/**
 * Place the card beside the spotlight, preferring below-right, and fold it back
 * inside the viewport rather than letting it hang off the edge. Sidebar targets
 * sit at the far left, so "to the right of the hole" is the common case.
 */
function cardPosition(rect: SpotlightRect): { top: number; left: number } {
  const margin = 12;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = rect.left + rect.width + GAP;
  if (left + CARD_WIDTH > viewportWidth - margin) {
    // No room to the right — try the left, then clamp.
    left = rect.left - CARD_WIDTH - GAP;
  }
  left = Math.min(
    Math.max(margin, left),
    Math.max(margin, viewportWidth - CARD_WIDTH - margin),
  );

  let top = rect.top;
  // The card is taller than a nav row; keep its bottom on screen.
  const assumedHeight = 210;
  if (top + assumedHeight > viewportHeight - margin) {
    top = viewportHeight - assumedHeight - margin;
  }
  top = Math.max(margin, top);

  return { top, left };
}

export function ProductTour() {
  const { t } = useTranslations();
  const { reduceMotion } = useAppearance();
  const cardRef = useRef<HTMLDivElement>(null);

  const tour = useProductTourControls();
  const { isOpen, step, stepIndex, stepCount, rect, isLastStep } = tour;

  // Escape dismisses, like every other overlay in the app.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") tour.dismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, tour]);

  // Move focus into the card so the walkthrough is operable from the keyboard
  // and a screen reader announces it. rAF, not a synchronous effect body.
  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => cardRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [isOpen, stepIndex]);

  if (!isOpen || !step || !rect) return null;

  const { top, left } = cardPosition(rect);
  const titleId = `tour-step-${step.id}-title`;

  return (
    <div className="fixed inset-0 z-[60]" role="presentation">
      {/* The scrim IS this element's shadow, so the hole needs no second
          layer. It swallows clicks on the page behind it — but it does NOT
          dismiss on click. Dismissal is permanent (it is written against the
          account), and a tour that a stray click destroys forever is one most
          people never actually see. Skip, Got it and Escape are the ways out,
          and all three are deliberate. */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-auto absolute rounded-lg ring-2 ring-primary/70",
          !reduceMotion && "transition-all duration-300 ease-out",
        )}
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.5)",
        }}
      />

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "absolute w-80 max-w-[calc(100vw-1.5rem)] rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xl outline-none",
          !reduceMotion && "transition-all duration-300 ease-out",
        )}
        style={{ top, left }}
      >
        <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {t("dashboard.tour.progress", {
            current: stepIndex + 1,
            total: stepCount,
          })}
        </p>

        <h2
          id={titleId}
          className="mt-1.5 text-base font-bold tracking-tight text-foreground"
        >
          {t(`dashboard.tour.steps.${step.id}.title`)}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {t(`dashboard.tour.steps.${step.id}.body`)}
        </p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={tour.dismiss}
            className="text-muted-foreground"
          >
            {t("dashboard.tour.skip")}
          </Button>

          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <Button variant="outline" size="sm" onClick={tour.back}>
                {t("dashboard.tour.back")}
              </Button>
            )}
            <Button
              size="sm"
              onClick={isLastStep ? tour.dismiss : tour.next}
              autoFocus
            >
              {isLastStep ? t("dashboard.tour.done") : t("dashboard.tour.next")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
