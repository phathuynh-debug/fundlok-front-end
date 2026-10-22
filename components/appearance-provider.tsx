"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { LazyMotion, MotionConfig } from "framer-motion";

import {
  ACCENT_COOKIE_NAME,
  RADIUS_COOKIE_NAME,
  REDUCE_MOTION_COOKIE_NAME,
  parseAccentCookie,
  parseRadiusCookie,
  parseReduceMotionCookie,
  type AccentId,
  type RadiusId,
} from "@/lib/appearance";

// Loaded after hydration; see lib/motion-features.ts.
const loadMotionFeatures = () =>
  import("@/lib/motion-features").then((mod) => mod.default);

/**
 * The "reduce motion" preference, and the MotionConfig that enforces it.
 *
 * Cookie-backed rather than localStorage, deliberately — the same reasoning as
 * LocaleProvider in lib/i18n. A localStorage preference cannot be read during
 * SSR, so the first paint would animate and then correct itself, and reading it
 * on mount means calling setState inside an effect, which this repo's ESLint
 * rule (react-hooks/set-state-in-effect) forbids. A cookie is readable in
 * app/layout.tsx, so the server renders the right value immediately.
 *
 * `reducedMotion="always"` makes framer-motion skip transform/layout animations
 * app-wide while still allowing opacity fades, which is what the accessibility
 * guidance actually asks for — motion that moves is the problem, not a fade.
 * The OS-level setting is honoured independently by "user", so a visitor who set
 * prefers-reduced-motion in their system never has to find this page.
 *
 * The cookie name and parser live in lib/appearance.ts, not here: this module
 * is "use client", and app/layout.tsx (a server component) cannot CALL a
 * function exported from a client module — only render its components.
 */

type AppearanceContextValue = {
  reduceMotion: boolean;
  setReduceMotion: (value: boolean) => void;
  accent: AccentId;
  setAccent: (value: AccentId) => void;
  radius: RadiusId;
  setRadius: (value: RadiusId) => void;
};

/** One cookie write, one <html> attribute — the two halves of persisting a
 *  preference that CSS reads. The attribute is what takes effect now; the
 *  cookie is what makes the server render it on the next request. */
/** A cookie's value in the browser; undefined on the server. */
function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function persist(attribute: string, cookieName: string, value: string) {
  document.documentElement.setAttribute(attribute, value);
  document.cookie = `${cookieName}=${value}; path=/; max-age=31536000; samesite=lax`;
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function AppearanceProvider({
  initialReduceMotion,
  initialAccent,
  initialRadius,
  children,
}: {
  /**
   * The cookie values, read server-side by the dynamic root layout. Omitted on
   * the prerendered marketing pages, which cannot read cookies on the server;
   * the state then starts from the browser's cookies, so the effects below
   * write back the visitor's choice rather than resetting it to the default.
   */
  initialReduceMotion?: boolean;
  initialAccent?: AccentId;
  initialRadius?: RadiusId;
  children: React.ReactNode;
}) {
  const [reduceMotion, setReduceMotionState] = useState(
    () =>
      initialReduceMotion ??
      parseReduceMotionCookie(readCookie(REDUCE_MOTION_COOKIE_NAME)),
  );
  const [accent, setAccentState] = useState(
    () => initialAccent ?? parseAccentCookie(readCookie(ACCENT_COOKIE_NAME)),
  );
  const [radius, setRadiusState] = useState(
    () => initialRadius ?? parseRadiusCookie(readCookie(RADIUS_COOKIE_NAME)),
  );

  // Effects, not the setters, own persistence — so a preference restored from
  // the server is also re-affirmed, and the cookie can never drift from state.
  useEffect(() => {
    document.cookie = `${REDUCE_MOTION_COOKIE_NAME}=${
      reduceMotion ? "1" : "0"
    }; path=/; max-age=31536000; samesite=lax`;
  }, [reduceMotion]);

  useEffect(() => {
    persist("data-accent", ACCENT_COOKIE_NAME, accent);
  }, [accent]);

  useEffect(() => {
    persist("data-radius", RADIUS_COOKIE_NAME, radius);
  }, [radius]);

  const value = useMemo<AppearanceContextValue>(
    () => ({
      reduceMotion,
      setReduceMotion: setReduceMotionState,
      accent,
      setAccent: setAccentState,
      radius,
      setRadius: setRadiusState,
    }),
    [reduceMotion, accent, radius],
  );

  return (
    <AppearanceContext.Provider value={value}>
      {/* "user" defers to the OS setting; the explicit toggle overrides it. */}
      <MotionConfig reducedMotion={reduceMotion ? "always" : "user"}>
        {/* `strict` makes a stray full `motion.*` component an error, since
            one would pull the whole animation bundle back into every page.
            Use `m.*` everywhere. */}
        <LazyMotion features={loadMotionFeatures} strict>
          {children}
        </LazyMotion>
      </MotionConfig>
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);

  if (!context) {
    throw new Error("useAppearance must be used within an AppearanceProvider");
  }

  return context;
}
