// USD formatting for the investor-facing dashboard surfaces.
//
// Fixed to en-US grouping regardless of UI locale: the amounts themselves are
// USD, and switching to Vietnamese grouping ("170.000,00") while the symbol
// stays "$" reads as a different currency. Locale affects dates (see
// lib/format-date.ts), not the money format.

export type CurrencyCode = "USD";

export function formatCurrency(
  amount: number,
  currency: CurrencyCode = "USD",
  maximumFractionDigits = 2,
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: maximumFractionDigits === 0 ? 0 : 2,
    maximumFractionDigits,
  }).format(Math.abs(amount));
}

/**
 * Grouped display for a VND amount being typed into a text input.
 *
 * Takes the raw digit string the form actually stores and returns it grouped
 * for display ("100000000" -> "100,000,000"). VND amounts run to ten digits, so
 * grouping is the difference between a readable figure and counting zeros.
 *
 * Locale-aware to match the review step, which already groups with `vi-VN`
 * (dots) or `en-US` (commas). Pair with `digitsOnly()` on the way back in — a
 * grouped string is not parseable by `Number()`.
 */
export function formatAmountInput(raw: string, locale?: string): string {
  const digits = digitsOnly(raw);
  if (!digits) return "";
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US").format(
    Number(digits),
  );
}

/** Strips grouping separators and anything else non-numeric. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

// Axis ticks and stat tiles, where "$170K" beats "$170,000.00".
export function formatCompactCurrency(
  amount: number,
  currency: CurrencyCode = "USD",
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}
