// Locale-aware numeric date formatting. Vietnamese uses DD/MM/YYYY; English
// (and any other/default locale) uses MM/DD/YYYY. We format explicitly rather
// than relying on toLocaleDateString so the order and zero-padding are exact
// and identical across browsers/OSes.

type DateInput = string | number | Date | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// e.g. "25/12/2026" (vi) or "12/25/2026" (en). Returns "" for empty/invalid input.
export function formatDate(value: DateInput, locale?: string): string {
  const d = toDate(value);
  if (!d) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return locale === "vi" ? `${dd}/${mm}/${yyyy}` : `${mm}/${dd}/${yyyy}`;
}

// Same date order plus 24-hour HH:mm, e.g. "25/12/2026 14:05".
export function formatDateTime(value: DateInput, locale?: string): string {
  const d = toDate(value);
  if (!d) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${formatDate(d, locale)} ${hh}:${min}`;
}
