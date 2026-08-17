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
