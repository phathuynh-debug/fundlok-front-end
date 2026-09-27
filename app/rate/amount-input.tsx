"use client";

import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { digitsOnly } from "@/lib/format-currency";

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
 * A money field that formats as you type.
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
}: {
  value: string;
  onChange: (digits: string) => void;
  locale: string;
  placeholder?: string;
  invalid?: boolean;
  onBlur?: () => void;
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

  return (
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
}
