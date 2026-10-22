"use client";

import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { CONTROL_IDLE } from "@/lib/ui-tokens";

/**
 * One choice in a radio group of appearance options.
 *
 * A radio rather than a segmented pill: these choices carry a preview, so they
 * need room, and `role="radio"` inside a `radiogroup` gives arrow-key
 * navigation and a single tab stop for free — which a row of plain buttons
 * (the pattern used elsewhere in the dashboard) does not.
 */
export function OptionCard({
  id,
  label,
  description,
  icon: Icon,
  selected,
  onSelect,
  preview,
}: {
  /** Stable id, used to tie the description to the control. */
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  selected: boolean;
  onSelect: () => void;
  /** Optional swatch rendered above the label. */
  preview?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      // The accessible NAME is the label alone, with the description attached
      // separately. Folding both into the name makes every option's name
      // contain every other option's words — "Easier on the eyes in low light"
      // matches a search for "Light" — which is ambiguous for a screen-reader
      // user scanning by name, and for anything else addressing controls by it.
      aria-label={label}
      aria-describedby={description ? `${id}-description` : undefined}
      onClick={onSelect}
      className={cn(
        "group relative flex w-full flex-col gap-3 rounded-xl border p-4 text-left transition-all",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : cn("border-border bg-card", CONTROL_IDLE),
      )}
    >
      {preview}

      <div className="flex min-w-0 items-start gap-2.5">
        <Icon
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0",
            selected ? "text-primary" : "text-muted-foreground",
          )}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {label}
          </p>
          {description && (
            <p
              id={`${id}-description`}
              className="mt-0.5 text-xs leading-relaxed text-muted-foreground"
            >
              {description}
            </p>
          )}
        </div>

        {/* aria-checked already conveys selection; this is the visual echo. */}
        <span
          aria-hidden="true"
          className={cn(
            "ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all",
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border",
          )}
        >
          {selected && <Check className="h-3 w-3" />}
        </span>
      </div>
    </button>
  );
}
