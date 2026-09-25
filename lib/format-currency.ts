// VND formatting for every money surface in the app.
//
// The platform lends in Vietnamese dong: loan sizes are bounded 20,000,000 to
// 5,000,000,000 VND by the grading engine's `loan_constraints`, repayments are
// posted in VND, and the marketplace is domestic. There is no USD anywhere in
// the product.
//
// Grouping follows the UI locale, unlike the old USD formatter which was pinned
// to en-US. That pin existed because "170.000,00" with a "$" reads as a
// different currency — the reverse is true here: a Vietnamese user reading a
// VND figure expects "537.500.000 ₫", and Intl places the symbol correctly for
// each locale ("₫537,500,000" in English). VND carries no minor unit, so
// nothing here takes a fraction-digits argument.

export type CurrencyCode = "VND";

/** Resolves a UI locale ("en" | "vi") to the BCP-47 tag Intl needs. */
function intlLocale(locale?: string): string {
  return locale === "vi" ? "vi-VN" : "en-US";
}

/**
 * Full figure: "537.500.000 ₫" (vi) / "₫537,500,000" (en).
 *
 * Always the absolute value — a sign is presentational and belongs to the
 * caller (see `formatAmount` in the transactions mock, which prefixes +/−).
 */
export function formatCurrency(amount: number, locale?: string): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

/**
 * Axis ticks and stat tiles, where the full figure is too wide.
 *
 * "537,5 Tr ₫" (vi — Tr = triệu, million) / "₫537.5M" (en). VND amounts run to
 * ten digits, so compact notation is not a nicety on a chart axis.
 */
export function formatCompactCurrency(amount: number, locale?: string): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency: "VND",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

/**
 * Grouped display for a VND amount being typed into a text input.
 *
 * Takes the raw digit string the form actually stores and returns it grouped
 * for display ("100000000" -> "100,000,000"). No currency symbol: the field
 * already carries a "(VND)" label, and a symbol inside an input is noise.
 *
 * Pair with `digitsOnly()` on the way back in — a grouped string is not
 * parseable by `Number()`.
 */
export function formatAmountInput(raw: string, locale?: string): string {
  const digits = digitsOnly(raw);
  if (!digits) return "";
  return new Intl.NumberFormat(intlLocale(locale)).format(Number(digits));
}

/** Strips grouping separators and anything else non-numeric. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}
