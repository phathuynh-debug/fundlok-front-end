"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";
import { ACCENTS, type AccentId } from "@/lib/appearance";

/**
 * Swatch grid for the chrome accent.
 *
 * The swatch is painted from the accent's own `swatch` value rather than
 * `bg-primary`, for the same reason ThemePreview hardcodes slate: a picker has
 * to show all six colours at once, so five of them cannot be the active token.
 * The check mark inside the selected swatch is white or near-black depending on
 * the swatch's own lightness, which is why `checkTone` exists.
 */
export function AccentPicker({
  value,
  onChange,
}: {
  value: AccentId;
  onChange: (accent: AccentId) => void;
}) {
  const { t } = useTranslations();

  return (
    <div
      role="radiogroup"
      aria-label={t("dashboard.settings.appearance.accent.heading")}
      className="flex flex-wrap gap-3"
    >
      {ACCENTS.map((accent) => {
        const selected = value === accent.id;
        const label = t(
          `dashboard.settings.appearance.accent.colors.${accent.labelKey}`,
        );
        // amber is the one light enough to need dark ink on top.
        const checkTone = accent.id === "amber" ? "text-black" : "text-white";

        return (
          <button
            key={accent.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            onClick={() => onChange(accent.id)}
            className={cn(
              "group flex flex-col items-center gap-2 rounded-xl border p-3 transition-all",
              selected
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border bg-card hover:bg-muted",
            )}
          >
            <span
              aria-hidden="true"
              style={{ backgroundColor: accent.swatch }}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full shadow-sm ring-1 ring-black/10 transition-transform",
                !selected && "group-hover:scale-105",
              )}
            >
              {selected && <Check className={cn("h-4 w-4", checkTone)} />}
            </span>
            <span className="text-xs font-medium text-foreground">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
