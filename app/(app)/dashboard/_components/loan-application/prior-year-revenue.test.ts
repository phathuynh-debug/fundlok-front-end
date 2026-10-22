import { describe, expect, it } from "vitest";
import { priorYearRevenue } from "./prior-year-revenue";

/** `count` consecutive months from "MM/YYYY", oldest first. */
function months(
  start: string,
  count: number,
  revenue: (i: number) => number,
): { period: string; revenue_vnd: number }[] {
  const [m, y] = start.split("/").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const index = y * 12 + (m - 1) + i;
    const month = String((index % 12) + 1).padStart(2, "0");
    return {
      period: `${month}/${Math.floor(index / 12)}`,
      revenue_vnd: revenue(i),
    };
  });
}

/** What the e-invoice preview says for a run of consecutive months. */
function invoices(start: string, count = 12) {
  const monthly = months(start, count, () => 5_000_000_000);
  return {
    monthly_revenue: monthly,
    // The backend sets it only when the newest 12 months are all there.
    revenue_last_12m: count >= 12 ? 12 * 5_000_000_000 : null,
  };
}

/** What the tax-filings preview says: VAT month i earns (i + 1) billion. */
function filings(start: string, count = 24) {
  return { vat_monthly_revenue: months(start, count, (i) => (i + 1) * 1e9) };
}

describe("priorYearRevenue", () => {
  it("sums the 12 VAT months immediately before the invoice window", () => {
    // Invoices 09/2025-08/2026; VAT 08/2024-07/2026, so VAT month index 0 is
    // 08/2024 and the year before the invoices (09/2024-08/2025) is indexes
    // 1..12 = 2 + 3 + ... + 13 billion.
    const result = priorYearRevenue(invoices("09/2025"), filings("08/2024"));

    expect(result).toEqual({
      status: "filled",
      total: (2 + 13) * 6 * 1e9, // arithmetic series: 15 * 6 = 90 billion
      from: "09/2024",
      to: "08/2025",
    });
  });

  it("ignores VAT months outside that year", () => {
    const wide = priorYearRevenue(invoices("09/2025"), filings("01/2020", 80));
    const exact = priorYearRevenue(invoices("09/2025"), filings("09/2024", 12));

    expect(wide.status).toBe("filled");
    // Both are the same 12 calendar months, whatever surrounds them.
    if (wide.status === "filled" && exact.status === "filled") {
      expect(wide.from).toBe(exact.from);
      expect(wide.to).toBe(exact.to);
    }
    expect(exact).toMatchObject({ status: "filled", total: 78e9 }); // 1..12
  });

  it("anchors on the newest 12 invoice months, not the oldest", () => {
    // 14 months of invoices, 07/2025-08/2026. "The last 12" is 09/2025-08/2026,
    // so the year before is 09/2024-08/2025 — not 07/2024-06/2025.
    const result = priorYearRevenue(
      invoices("07/2025", 14),
      filings("07/2024"),
    );

    expect(result).toMatchObject({
      status: "filled",
      from: "09/2024",
      to: "08/2025",
    });
  });

  it("crosses a year boundary", () => {
    const result = priorYearRevenue(
      invoices("01/2026"),
      filings("01/2025", 24),
    );

    expect(result).toMatchObject({
      status: "filled",
      from: "01/2025",
      to: "12/2025",
      total: 78e9,
    });
  });

  it("waits for the invoices when they do not define a last 12 months", () => {
    expect(priorYearRevenue(null, filings("08/2024"))).toEqual({
      status: "needs_invoices",
    });
    // Nine months is not "the last 12 months"; the backend leaves it null.
    expect(
      priorYearRevenue(invoices("12/2025", 9), filings("08/2024")),
    ).toEqual({
      status: "needs_invoices",
    });
  });

  it("waits for VAT when the filings carry no monthly declarations", () => {
    expect(priorYearRevenue(invoices("09/2025"), null)).toEqual({
      status: "needs_vat",
    });
    expect(
      priorYearRevenue(invoices("09/2025"), { vat_monthly_revenue: [] }),
    ).toEqual({ status: "needs_vat" });
  });

  it("treats a backend that does not send the series as no VAT", () => {
    // The frontend can ship before the backend does.
    expect(priorYearRevenue(invoices("09/2025"), {})).toEqual({
      status: "needs_vat",
    });
  });

  it("names the months that are missing when VAT does not cover the year", () => {
    // VAT 08/2024-07/2025 only: the year before the invoices is 09/2024-08/2025,
    // so 08/2025 is missing.
    const result = priorYearRevenue(
      invoices("09/2025"),
      filings("08/2024", 12),
    );

    expect(result).toEqual({
      status: "not_covered",
      from: "09/2024",
      to: "08/2025",
      missing: ["08/2025"],
    });
  });

  it("does not guess across a gap in the declarations", () => {
    const series = filings("08/2024").vat_monthly_revenue.filter(
      (m) => m.period !== "03/2025",
    );
    const result = priorYearRevenue(invoices("09/2025"), {
      vat_monthly_revenue: series,
    });

    expect(result).toMatchObject({
      status: "not_covered",
      missing: ["03/2025"],
    });
  });

  it("skips a declaration whose period it cannot read", () => {
    const series = [
      { period: "Q1/2025", revenue_vnd: 999 },
      ...filings("09/2024", 12).vat_monthly_revenue,
    ];
    const result = priorYearRevenue(invoices("09/2025"), {
      vat_monthly_revenue: series,
    });

    expect(result).toMatchObject({ status: "filled", total: 78e9 });
  });

  it("will not fill a year that earned nothing", () => {
    // A locked 0 would fail the "must be positive" rule with no way to fix it.
    const zero = {
      vat_monthly_revenue: months("09/2024", 12, () => 0),
    };

    expect(priorYearRevenue(invoices("09/2025"), zero)).toEqual({
      status: "no_revenue",
      from: "09/2024",
      to: "08/2025",
    });
  });
});
