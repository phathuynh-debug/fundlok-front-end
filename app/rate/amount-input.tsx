"use client";

import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { digitsOnly } from "@/lib/format-currency";

import { cn } from "@/lib/utils";

export interface AmountPreset {
  label: string;
  value: number;
}

/**
 * Common quick-pick amounts for loan & investment calculators (20tr - 100tr).
 */
export const COMMON_AMOUNT_PRESETS = (locale: string): AmountPreset[] => [
  { label: locale === "vi" ? "20 tr" : "20M", value: 20_000_000 },
  { label: locale === "vi" ? "30 tr" : "30M", value: 30_000_000 },
  { label: locale === "vi" ? "50 tr" : "50M", value: 50_000_000 },
  { label: locale === "vi" ? "80 tr" : "80M", value: 80_000_000 },
  { label: locale === "vi" ? "100 tr" : "100M", value: 100_000_000 },
];

/** Digits only. Accepts the separators a Vietnamese keyboard produces. */
export function parseAmount(raw: string): number | null {
  const normalized = raw.trim().replace(/[.,\s]/g, "");
  if (!normalized) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/**
 * Thousand separators, in the reader's convention: "400.000.000" in Vietnamese,
 * "400,000,000" in English.
 *
 * Grouped with a regex rather than `toLocaleString`, which would route through
 * a double. VND amounts run to 13 digits here and a pasted value could be
 * longer; regex grouping is exact at any length and never rounds a figure the
 * applicant typed.
 */
export function groupDigits(digits: string, locale: string): string {
  const separator = locale === "vi" ? "." : ",";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

/**
 * A money field that formats as you type, with optional quick-pick preset chips.
 *
 * State holds digits only; the separators exist just for reading. Formatting
 * on every keystroke would otherwise drop the caret to the end mid-edit — fine
 * while appending, maddening when correcting a digit in the middle — so the
 * caret is re-placed after the same NUMBER OF DIGITS it preceded, which is
 * stable across the separators shifting around it.
 */
export function AmountInput({
  value,
  onChange,
  locale,
  placeholder,
  invalid,
  onBlur,
  presets,
}: {
  value: string;
  onChange: (digits: string) => void;
  locale: string;
  placeholder?: string;
  invalid?: boolean;
  onBlur?: () => void;
  presets?: AmountPreset[];
}) {
  const ref = useRef<HTMLInputElement>(null);
  const caretDigits = useRef<number | null>(null);

  useEffect(() => {
    const input = ref.current;
    const target = caretDigits.current;
    if (!input || target === null) return;
    caretDigits.current = null;

    const formatted = input.value;
    let seen = 0;
    let position = formatted.length;
    for (let i = 0; i < formatted.length; i++) {
      if (seen === target) {
        position = i;
        break;
      }
      if (/\d/.test(formatted[i])) seen += 1;
    }
    input.setSelectionRange(position, position);
  }, [value]);

  const inputElement = (
    <Input
      ref={ref}
      inputMode="numeric"
      value={groupDigits(value, locale)}
      placeholder={placeholder}
      aria-invalid={invalid}
      onBlur={onBlur}
      onChange={(event) => {
        const caret = event.target.selectionStart ?? event.target.value.length;
        caretDigits.current = digitsOnly(
          event.target.value.slice(0, caret),
        ).length;
        onChange(digitsOnly(event.target.value));
      }}
    />
  );

  if (!presets || presets.length === 0) {
    return inputElement;
  }

  return (
    <div className="space-y-2">
      {inputElement}
      <div
        className="flex flex-wrap items-center gap-1.5 pt-0.5"
        role="group"
        aria-label="Preset amounts"
      >
        {presets.map((preset) => {
          const isSelected = value === String(preset.value);
          return (
            <button
              key={preset.value}
              type="button"
              onClick={() => {
                onChange(String(preset.value));
                onBlur?.();
              }}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-all active:scale-[0.97] cursor-pointer",
                isSelected
                  ? "border-primary bg-primary/15 text-primary font-semibold ring-1 ring-primary/30"
                  : "border-border/80 bg-background/60 text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border",
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
