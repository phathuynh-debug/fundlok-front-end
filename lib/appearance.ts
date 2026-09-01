/**
 * Appearance preferences that both the server and the client need to read.
 *
 * Deliberately NOT in components/appearance-provider.tsx: that file is
 * "use client", and a server component may only RENDER a client module's
 * components — calling a function exported from one throws
 * "Attempted to call X() from the server but X is on the client". app/layout.tsx
 * is a server component and needs to read this cookie during SSR, so the plain
 * helpers live here and both sides import them.
 */

export const REDUCE_MOTION_COOKIE_NAME = "fl_reduce_motion";

/** Cookie value → boolean. Anything but "1" is off, including absent. */
export function parseReduceMotionCookie(value?: string | null): boolean {
  return value === "1";
}
