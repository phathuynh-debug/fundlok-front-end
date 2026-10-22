import type {
  EInvoicePreview,
  TaxFilingsPreview,
} from "@/services/uploads.service";

/**
 * The revenue of the 12 months BEFORE the e-invoice window, read out of the
 * signed monthly VAT declarations.
 *
 * Neither file can state it alone. The e-invoice export covers the latest 12
 * months and stops there; the VAT declarations cover 24, so the 12 that precede
 * the invoices are already in them. That is why the wizard used to ask the
 * SME to type this figure: it was sitting unused in the second file.
 *
 * It is the two previews taken together, so it belongs to neither one's own
 * list of filled figures. The hook derives it at read time, which also means it
 * disappears by itself the moment either file is removed.
 */

export type PriorYearRevenue =
  /** Every month of the year is in the declarations: this is its total. */
  | { status: "filled"; total: number; from: string; to: string }
  /** The e-invoices are not in yet, or do not make up a full last 12 months. */
  | { status: "needs_invoices" }
  /** The filings carry no monthly VAT declarations (or none were uploaded). */
  | { status: "needs_vat" }
  /** Declarations exist but skip some of the 12 months before the invoices. */
  | { status: "not_covered"; from: string; to: string; missing: string[] }
  /** Covered, but it adds up to nothing: a zero cannot be a locked figure. */
  | { status: "no_revenue"; from: string; to: string };

type InvoicePreviewShape = Pick<
  EInvoicePreview,
  "monthly_revenue" | "revenue_last_12m"
>;
type FilingsPreviewShape = Pick<TaxFilingsPreview, "vat_monthly_revenue">;

const PERIOD = /^(\d{1,2})\/(\d{4})$/;

/** Months counted from year 0, so "12 months earlier" is a subtraction. */
function monthIndex(period: string): number | null {
  const match = PERIOD.exec(period.trim());
  if (!match) return null;
  const month = Number(match[1]);
  return month >= 1 && month <= 12 ? Number(match[2]) * 12 + (month - 1) : null;
}

/** The "MM/YYYY" the backend and the wizard both use. */
function periodLabel(index: number): string {
  const month = String((index % 12) + 1).padStart(2, "0");
  return `${month}/${Math.floor(index / 12)}`;
}

export function priorYearRevenue(
  invoices: InvoicePreviewShape | null,
  filings: FilingsPreviewShape | null,
): PriorYearRevenue {
  // "The last 12 months" is the newest 12 of however many were uploaded, and
  // only when they are all there (the backend leaves the total null otherwise).
  // Anchor on the start of THOSE, not on the oldest month in the export.
  const newest12 =
    invoices && invoices.revenue_last_12m !== null
      ? invoices.monthly_revenue.slice(-12)
      : [];
  const windowStart =
    newest12.length === 12 ? monthIndex(newest12[0].period) : null;
  if (windowStart === null) return { status: "needs_invoices" };

  // Absent on an older backend, which is the same as having no declarations.
  const series = filings?.vat_monthly_revenue ?? [];
  if (series.length === 0) return { status: "needs_vat" };

  const revenueByMonth = new Map<number, number>();
  for (const entry of series) {
    const index = monthIndex(entry.period);
    if (index !== null) revenueByMonth.set(index, entry.revenue_vnd);
  }

  const first = windowStart - 12;
  const last = windowStart - 1;
  const from = periodLabel(first);
  const to = periodLabel(last);

  let total = 0;
  const missing: string[] = [];
  for (let index = first; index <= last; index++) {
    const revenue = revenueByMonth.get(index);
    if (revenue === undefined) missing.push(periodLabel(index));
    else total += revenue;
  }

  if (missing.length > 0) return { status: "not_covered", from, to, missing };
  if (total <= 0) return { status: "no_revenue", from, to };
  return { status: "filled", total, from, to };
}
