"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { digitsOnly } from "@/lib/format-currency";

/**
 * A text field that can only ever hold digits.
 *
 * WHY NOT `type="number"`
 * A number input is not a digits-only input. It still accepts `e`, `E`, `+`,
 * `-` and `.`, so "1e5" and "12-" are things a visitor can type into one. Worse,
 * while its contents are invalid the browser reports `value` as the EMPTY
 * STRING — so React state silently disagrees with what is on screen, and a
 * sanitising handler is handed "" and has nothing to sanitise. It also renders
 * spinners that step a figure by one, which is meaningless on a VND amount.
 *
 * So this is a text field that asks for a numeric keypad on mobile and strips
 * every non-digit on the way into state. That one place covers typing, pasting,
 * drag-and-drop and autofill alike, because all of them surface as `change`.
 *
 * Digits only, deliberately: every numeric field in this app is a whole number
 * — VND has no sub-unit, headcount and months are counts, and the percentage
 * fields are parsed with the separators stripped anyway. A field that needs a
 * decimal point wants its own component, not a looser regex here.
 */
export type NumericInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "onChange"
> & {
  value: string;
  /** Receives the sanitised digit string, never the raw keystroke. */
  onValueChange: (digits: string) => void;
};

function NumericInput({ value, onValueChange, ...props }: NumericInputProps) {
  return (
    <Input
      inputMode="numeric"
      autoComplete="off"
      {...props}
      type="text"
      value={value}
      onChange={(event) => onValueChange(digitsOnly(event.target.value))}
    />
  );
}

export { NumericInput };
