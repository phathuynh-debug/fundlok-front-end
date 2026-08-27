"use client";

import { useEffect, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Reports whether an element's text is currently clipped by `truncate`.
 *
 * Measured at runtime rather than guessed from string length, because whether a
 * figure fits depends on the font, the viewport, the browser zoom level and the
 * locale — a VND amount is 15-16 characters where the same number in compact
 * form is 6.
 *
 * The ResizeObserver callback fires once on observe, so the initial measurement
 * happens there too: no synchronous setState inside the effect, which the
 * repo's `react-hooks/set-state-in-effect` rule forbids.
 */
function useIsClipped<T extends HTMLElement>(value: string) {
  const ref = useRef<T>(null);
  const [isClipped, setIsClipped] = useState(false);

  // `value` is a dependency, not just an initial read: the observer only fires
  // when the element's BOX changes, and these figures sit in flex/grid cells
  // whose width is set by the layout. A locale switch or a new total can change
  // the text from fitting to not fitting without the box moving at all, so the
  // measurement has to be redone whenever the string does.
  useEffect(() => {
    const element = ref.current;
    // jsdom (and any non-DOM renderer) has no ResizeObserver. Degrade to "not
    // clipped" — no tooltip — rather than throwing during render.
    if (!element || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      // +1 absorbs sub-pixel rounding, which otherwise reports a perfectly
      // fitting figure as clipped at some zoom levels.
      setIsClipped(element.scrollWidth > element.clientWidth + 1);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [value]);

  return { ref, isClipped };
}

/**
 * A figure that truncates when it does not fit, and reveals the full value in a
 * tooltip on hover or focus when — and only when — it is actually truncated.
 *
 * Why conditional: a tooltip that repeats text already fully visible is noise,
 * and a permanent tab stop on every KPI would clutter keyboard navigation. The
 * trigger becomes focusable only while something is hidden.
 *
 * Screen readers are unaffected either way: `truncate` clips visually but the
 * full string stays in the DOM, so the accessible name is always complete.
 */
export function TruncatedFigure({
  value,
  className,
}: {
  /** The complete value. Rendered in full in the DOM; clipped only by CSS. */
  value: string;
  className?: string;
}) {
  const { ref, isClipped } = useIsClipped<HTMLSpanElement>(value);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          ref={ref}
          // `block` is load-bearing: text-overflow does not apply to an inline
          // box, so a bare span would overflow instead of showing an ellipsis
          // (and scrollWidth would never exceed clientWidth, so the tooltip
          // would never appear either).
          className={cn("block min-w-0 truncate", className)}
          // Radix opens on focus as well as hover, so this is what makes the
          // hidden digits reachable without a mouse.
          tabIndex={isClipped ? 0 : undefined}
        >
          {value}
        </span>
      </TooltipTrigger>
      {/* No content element → Radix renders no tooltip at all. */}
      {isClipped && (
        <TooltipContent className="font-mono text-xs">{value}</TooltipContent>
      )}
    </Tooltip>
  );
}
