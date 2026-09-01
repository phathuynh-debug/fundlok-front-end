"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { MotionConfig } from "framer-motion";

import { REDUCE_MOTION_COOKIE_NAME } from "@/lib/appearance";

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
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function AppearanceProvider({
  initialReduceMotion,
  children,
}: {
  initialReduceMotion: boolean;
  children: React.ReactNode;
}) {
  const [reduceMotion, setReduceMotionState] = useState(initialReduceMotion);

  useEffect(() => {
    document.cookie = `${REDUCE_MOTION_COOKIE_NAME}=${
      reduceMotion ? "1" : "0"
    }; path=/; max-age=31536000; samesite=lax`;
  }, [reduceMotion]);

  const value = useMemo<AppearanceContextValue>(
    () => ({ reduceMotion, setReduceMotion: setReduceMotionState }),
    [reduceMotion],
  );

  return (
    <AppearanceContext.Provider value={value}>
      {/* "user" defers to the OS setting; the explicit toggle overrides it. */}
      <MotionConfig reducedMotion={reduceMotion ? "always" : "user"}>
        {children}
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
