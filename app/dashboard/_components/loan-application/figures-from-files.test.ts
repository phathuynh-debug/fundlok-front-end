import { describe, expect, it } from "vitest";
import type {
  EInvoicePreview,
  TaxFilingsPreview,
} from "@/services/uploads.service";
import { figureFilesRead, figuresFromFiles } from "./figures-from-files";
import { LITE_FIGURE_FIELDS, type LiteFigureKey } from "./lite-grading-fields";

const period = (index: number) =>
  `${String((index % 12) + 1).padStart(2, "0")}/${Math.floor(index / 12)}`;

/** Twelve invoice months, 09/2025 to 08/2026, 6bn each. */
function invoices(overrides: Partial<EInvoicePreview> = {}): EInvoicePreview {
  const start = 2025 * 12 + 8; // 09/2025
  return {
    seller_tax_code: "0000000000",
    period_start: "09/2025",
    period_end: "08/2026",
    months_covered: 12,
    monthly_revenue: Array.from({ length: 12 }, (_, i) => ({
      period: period(start + i),
      revenue_vnd: 6_000_000_000,
    })),
    revenue_last_12m: 72_000_000_000,
    revenue_best_month: 8_500_000_000,
    revenue_worst_month: 4_100_000_000,
    conc_top1_pct: 9.99,
    conc_top3_pct: 22.29,
    warnings: [],
    ...overrides,
  };
}

/** Statements plus 24 signed VAT months, 08/2024 to 07/2026, 6bn each. */
function filings(
  overrides: Partial<TaxFilingsPreview> = {},
): TaxFilingsPreview {
  const start = 2024 * 12 + 7; // 08/2024
  return {
    fiscal_year: 2025,
    regime: "TT133",
    signed: true,
    tax_code: "0000000000",
    cogs_y1: 64_000_000_000,
    owner_withdrawal_pct: 0,
    // Management expense 3.1bn + financial expense 2.5bn; a TT133 statement has
    // no selling line.
    fixed_cost_y1: 5_600_000_000,
    variable_cost_excl_cogs_y1: 0,
    admin_expense_vnd: 3_100_000_000,
    selling_expense_vnd: 0,
    financial_expense_vnd: 2_500_000_000,
    revenue_net_vnd: 71_000_000_000,
    net_profit_vnd: 1_400_000_000,
    interest_expense_vnd: 2_400_000_000,
    vat_months: 24,
    vat_period: "08/2024–07/2026",
    vat_monthly_revenue: Array.from({ length: 24 }, (_, i) => ({
      period: period(start + i),
      revenue_vnd: 6_000_000_000,
    })),
    warnings: [],
    ...overrides,
  };
}

const INVOICE_FIGURES: LiteFigureKey[] = [
  "revenue_last_12m",
  "revenue_best_month",
  "revenue_worst_month",
  "conc_top1_pct",
  "conc_top3_pct",
];
const STATEMENT_FIGURES: LiteFigureKey[] = [
  "cogs_y1",
  "fixed_cost_y1",
  "variable_cost_excl_cogs_y1",
  "owner_withdrawal_pct",
];

const blank = (figures: Record<LiteFigureKey, string>, keys: LiteFigureKey[]) =>
  keys.every((key) => figures[key] === "");

describe("figuresFromFiles", () => {
  it("reads every figure once both files are in", () => {
    expect(figuresFromFiles(invoices(), filings())).toEqual({
      revenue_last_12m: "72000000000",
      // 09/2024 to 08/2025, twelve months of the VAT series.
      revenue_prior_12m: "72000000000",
      revenue_best_month: "8500000000",
      revenue_worst_month: "4100000000",
      cogs_y1: "64000000000",
      fixed_cost_y1: "5600000000",
      variable_cost_excl_cogs_y1: "0",
      owner_withdrawal_pct: "0",
      conc_top1_pct: "9.99",
      conc_top3_pct: "22.29",
    });
  });

  it("states a figure for every field, and nothing the fields do not know", () => {
    const figures = figuresFromFiles(invoices(), filings());
    expect(Object.keys(figures).sort()).toEqual(
      LITE_FIGURE_FIELDS.map((f) => f.key).sort(),
    );
  });

  it("is blank before either file is read", () => {
    const figures = figuresFromFiles(null, null);
    expect(Object.values(figures).every((value) => value === "")).toBe(true);
  });

  it("gives the e-invoices' figures alone, and not the year before", () => {
    const figures = figuresFromFiles(invoices(), null);
    expect(figures.revenue_last_12m).toBe("72000000000");
    expect(figures.conc_top3_pct).toBe("22.29");
    expect(blank(figures, STATEMENT_FIGURES)).toBe(true);
    // Only the VAT declarations know it.
    expect(figures.revenue_prior_12m).toBe("");
  });

  it("gives the statements' figures alone, and not the year before", () => {
    const figures = figuresFromFiles(null, filings());
    expect(figures.cogs_y1).toBe("64000000000");
    expect(figures.fixed_cost_y1).toBe("5600000000");
    expect(blank(figures, INVOICE_FIGURES)).toBe(true);
    // The window it is worked out over is set by the invoices.
    expect(figures.revenue_prior_12m).toBe("");
  });

  it("takes fixed and variable cost as the backend worked them out", () => {
    // The rule (management + financial expense, and selling expense) lives in
    // the backend's statement parser, once. The wizard shows its result rather
    // than re-deriving it from the parts.
    const figures = figuresFromFiles(
      invoices(),
      filings({
        fixed_cost_y1: 2_400_000_000,
        variable_cost_excl_cogs_y1: 900_000_000,
        admin_expense_vnd: 1_000_000_000,
        selling_expense_vnd: 900_000_000,
        financial_expense_vnd: 1_400_000_000,
      }),
    );
    expect(figures.fixed_cost_y1).toBe("2400000000");
    expect(figures.variable_cost_excl_cogs_y1).toBe("900000000");
  });

  it("reads a variable cost of 0 as 0, not as a blank", () => {
    // A TT133 statement has no selling line, so its variable cost is 0 and the
    // statements say so. 0 is an answer; blank would block the step.
    const figures = figuresFromFiles(invoices(), filings());
    expect(figures.variable_cost_excl_cogs_y1).toBe("0");
  });

  it("leaves the owners' share blank when the year made no profit", () => {
    const figures = figuresFromFiles(
      invoices(),
      filings({ owner_withdrawal_pct: null }),
    );
    expect(figures.owner_withdrawal_pct).toBe("");
    expect(figures.cogs_y1).toBe("64000000000");
  });

  it("leaves the last 12 months blank when the invoices do not make up a year", () => {
    const figures = figuresFromFiles(
      invoices({
        revenue_last_12m: null,
        revenue_best_month: null,
        revenue_worst_month: null,
      }),
      filings(),
    );
    expect(figures.revenue_last_12m).toBe("");
    // Nothing to anchor the year before on either.
    expect(figures.revenue_prior_12m).toBe("");
    // The statements are still read.
    expect(figures.cogs_y1).toBe("64000000000");
  });

  it("leaves the year before blank when the filings carry no VAT declarations", () => {
    const figures = figuresFromFiles(
      invoices(),
      filings({ vat_months: 0, vat_period: null, vat_monthly_revenue: [] }),
    );
    expect(figures.revenue_prior_12m).toBe("");
    expect(figures.revenue_last_12m).toBe("72000000000");
    expect(figures.fixed_cost_y1).toBe("5600000000");
  });

  it("leaves the year before blank on a backend that does not send the series", () => {
    const older = filings();
    delete older.vat_monthly_revenue;
    expect(figuresFromFiles(invoices(), older).revenue_prior_12m).toBe("");
  });

  it("takes a file's figures away with it", () => {
    const both = figuresFromFiles(invoices(), filings());
    const withoutFilings = figuresFromFiles(invoices(), null);
    const withoutInvoices = figuresFromFiles(null, filings());

    for (const key of INVOICE_FIGURES) {
      expect(withoutFilings[key]).toBe(both[key]);
      expect(withoutInvoices[key]).toBe("");
    }
    for (const key of STATEMENT_FIGURES) {
      expect(withoutInvoices[key]).toBe(both[key]);
      expect(withoutFilings[key]).toBe("");
    }
    // Needs both, so it goes when either does.
    expect(both.revenue_prior_12m).not.toBe("");
    expect(withoutFilings.revenue_prior_12m).toBe("");
    expect(withoutInvoices.revenue_prior_12m).toBe("");
  });

  it("ignores a value that is not a finite number", () => {
    const figures = figuresFromFiles(
      invoices({ revenue_best_month: Number.NaN }),
      filings(),
    );
    expect(figures.revenue_best_month).toBe("");
  });
});

describe("figureFilesRead", () => {
  const field = (key: LiteFigureKey) =>
    LITE_FIGURE_FIELDS.find((f) => f.key === key)!;

  it("waits for the e-invoices for what they state", () => {
    expect(figureFilesRead(field("revenue_last_12m"), invoices(), null)).toBe(
      true,
    );
    expect(figureFilesRead(field("revenue_last_12m"), null, filings())).toBe(
      false,
    );
  });

  it("waits for the tax filings for what they state", () => {
    expect(figureFilesRead(field("cogs_y1"), null, filings())).toBe(true);
    expect(figureFilesRead(field("cogs_y1"), invoices(), null)).toBe(false);
    expect(
      figureFilesRead(field("variable_cost_excl_cogs_y1"), invoices(), null),
    ).toBe(false);
  });

  it("waits for both files for the year before the invoices", () => {
    const prior = field("revenue_prior_12m");
    expect(figureFilesRead(prior, invoices(), filings())).toBe(true);
    expect(figureFilesRead(prior, invoices(), null)).toBe(false);
    expect(figureFilesRead(prior, null, filings())).toBe(false);
  });
});
