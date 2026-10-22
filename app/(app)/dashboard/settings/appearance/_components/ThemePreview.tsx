"use client";

import { cn } from "@/lib/utils";

/**
 * A miniature of the dashboard chrome, drawn in the colours of the theme the
 * option represents rather than the theme currently applied.
 *
 * Hardcoded slate/white values are correct here and only here: this is a
 * picture OF a theme, so it must NOT follow the active one. Using semantic
 * tokens would make all three previews identical — which is the whole reason a
 * preview exists.
 */
export function ThemePreview({ tone }: { tone: "light" | "dark" | "system" }) {
  const panel = (side: "light" | "dark") => (
    <div
      className={cn(
        "flex h-full flex-1 flex-col gap-1.5 p-2",
        side === "light" ? "bg-white" : "bg-slate-900",
      )}
    >
      {/* sidebar + content bars */}
      <div className="flex flex-1 gap-1.5">
        <div
          className={cn(
            "w-1/4 rounded",
            side === "light" ? "bg-slate-200" : "bg-slate-700",
          )}
        />
        <div className="flex flex-1 flex-col gap-1">
          <div
            className={cn(
              "h-1.5 w-2/3 rounded-full",
              side === "light" ? "bg-slate-300" : "bg-slate-600",
            )}
          />
          <div
            className={cn(
              "h-1.5 w-1/2 rounded-full",
              side === "light" ? "bg-slate-200" : "bg-slate-700",
            )}
          />
          <div className="mt-auto h-3 w-1/3 rounded bg-emerald-500/80" />
        </div>
      </div>
    </div>
  );

  return (
    <div
      aria-hidden="true"
      className="flex h-16 w-full overflow-hidden rounded-lg border border-border/60"
    >
      {tone === "system" ? (
        <>
          {panel("light")}
          {panel("dark")}
        </>
      ) : (
        panel(tone)
      )}
    </div>
  );
}
