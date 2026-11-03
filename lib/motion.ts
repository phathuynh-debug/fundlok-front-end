/**
 * Shared motion values for framer-motion. The CSS twins live in app/globals.css
 * (`--ease-out`, `--ease-in-out`, `--ease-drawer`) — change both together.
 *
 * Which curve:
 * - EASE_OUT: anything entering or leaving. Starts fast, so it feels responsive.
 * - EASE_IN_OUT: something already on screen moving or resizing.
 * - Ambient loops (`repeat: Infinity` blobs, breathing glows) keep the built-in
 *   "easeInOut": a sine-like curve is what makes a loop seamless.
 * Never "easeIn" on UI: it delays the exact moment the user is watching.
 *
 * Durations: UI stays under 0.3s. Marketing and first-run moments may run
 * longer — they are seen rarely and are meant to be watched.
 */

export const EASE_OUT = [0.23, 1, 0.32, 1] as const;
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;

/**
 * A progress fill revealed with clip-path instead of animated `width`: no
 * layout on every frame, and unlike `scaleX` the rounded end keeps its shape.
 * Spread onto an `m.div` that spans the full track.
 */
export function barReveal(pct: number) {
  const hidden = 100 - Math.min(100, Math.max(0, pct));
  return {
    initial: { clipPath: "inset(0 100% 0 0 round 9999px)" },
    animate: { clipPath: `inset(0 ${hidden}% 0 0 round 9999px)` },
  };
}
