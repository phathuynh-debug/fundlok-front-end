import { describe, expect, it } from "vitest";
import {
  LITE_FIGURE_FIELDS,
  REQUIRED_LITE_FIGURE_KEYS,
  figureFieldsForStep,
  figureFieldsInGroup,
  parseFigure,
  validateFigure,
  type LiteFigureField,
  validateFigureConsistency,
  type LiteFigureKey,
} from "./lite-grading-fields";

const field = (key: string): LiteFigureField => {
  const found = LITE_FIGURE_FIELDS.find((f) => f.key === key);
  if (!found) throw new Error(`no such field: ${key}`);
  return found;
};

const REVENUE = field("revenue_last_12m"); // required, vnd
const BEST_MONTH = field("revenue_best_month"); // optional, vnd
const CONC = field("conc_top1_pct"); // optional, pct

describe("lite figure config", () => {
  it("collects every figure on step 2, revenue and costs together", () => {
    for (const f of LITE_FIGURE_FIELDS) {
      expect(f.step).toBe(2);
    }
    expect(figureFieldsForStep(2)).toHaveLength(LITE_FIGURE_FIELDS.length);
  });

  it("asks for no figures on the steps around it", () => {
    // Step 1 is the legal documents, step 3 the CIC report.
    expect(figureFieldsForStep(1)).toHaveLength(0);
    expect(figureFieldsForStep(3)).toHaveLength(0);
    expect(figureFieldsForStep(4)).toHaveLength(0);
  });

  it("lays step 2 out as a revenue block and a costs block", () => {
    const revenue = figureFieldsInGroup("revenue").map((f) => f.key);
    const costs = figureFieldsInGroup("costs").map((f) => f.key);

    expect(revenue).toEqual([
      "revenue_last_12m",
      "revenue_prior_12m",
      "revenue_best_month",
      "revenue_worst_month",
    ]);
    expect(costs).toEqual([
      "cogs_y1",
      "fixed_cost_y1",
      "variable_cost_excl_cogs_y1",
      "owner_withdrawal_pct",
      "conc_top1_pct",
      "conc_top3_pct",
    ]);
    // Every figure is in exactly one block.
    expect(revenue.length + costs.length).toBe(LITE_FIGURE_FIELDS.length);
  });

  it("has no duplicate keys", () => {
    const keys = LITE_FIGURE_FIELDS.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("reads every figure from a file: none is typed", () => {
    for (const f of LITE_FIGURE_FIELDS) {
      expect(["invoices", "statements", "vat"]).toContain(f.source.from);
      // ...and says where it came from, in words.
      expect(f.sourceNoteKey).toMatch(/^dashboard\.sme\.figureFrom/);
    }
  });

  it("takes the customer figures and revenue from the e-invoices", () => {
    const fromInvoices = LITE_FIGURE_FIELDS.filter(
      (f) => f.source.from === "invoices",
    ).map((f) => f.key);
    expect(fromInvoices).toEqual([
      "revenue_last_12m",
      "revenue_best_month",
      "revenue_worst_month",
      "conc_top1_pct",
      "conc_top3_pct",
    ]);
  });

  it("reads fixed and variable cost as the backend's statement rule worked them out", () => {
    // Fixed = management expense + financial expense, variable = selling
    // expense; no filing labels a cost either way. The rule lives in the
    // backend's statement parser, which grading also uses, so what is shown
    // here is what is graded.
    expect(field("fixed_cost_y1").source).toEqual({
      from: "statements",
      read: "fixed_cost_y1",
    });
    expect(field("variable_cost_excl_cogs_y1").source).toEqual({
      from: "statements",
      read: "variable_cost_excl_cogs_y1",
    });
  });

  it("works the year before the invoices out from both files", () => {
    expect(field("revenue_prior_12m").source).toEqual({ from: "vat" });
  });

  it("explains a variable cost of 0 as none booked, and nothing else", () => {
    // A 0 next to a cost reads like missing data; for selling expense it is
    // the statements' answer. Only that field has such a note.
    expect(field("variable_cost_excl_cogs_y1").zeroNoteKey).toBe(
      "dashboard.sme.figureSellingNone",
    );
    const withZeroNote = LITE_FIGURE_FIELDS.filter((f) => f.zeroNoteKey);
    expect(withZeroNote.map((f) => f.key)).toEqual([
      "variable_cost_excl_cogs_y1",
    ]);
  });

  it("names the GradingInput field each figure feeds", () => {
    // The whole point is that these reach the engine; a field with no
    // mapping is a field nobody can use.
    for (const f of LITE_FIGURE_FIELDS) {
      expect(f.gradingInput.length).toBeGreaterThan(0);
    }
  });
});

describe("validateFigure", () => {
  it("requires a value only for required fields", () => {
    expect(validateFigure(REVENUE, "")).toBe("required");
    expect(validateFigure(BEST_MONTH, "")).toBeNull();
    expect(validateFigure(REVENUE, "   ")).toBe("required");
  });

  it("accepts the thousands separators a Vietnamese keyboard produces", () => {
    // vi-VN groups with dots; a pasted value may use commas or spaces.
    expect(validateFigure(REVENUE, "4.800.000.000")).toBeNull();
    expect(validateFigure(REVENUE, "4,800,000,000")).toBeNull();
    expect(validateFigure(REVENUE, "4 800 000 000")).toBeNull();
  });

  it("rejects anything that is not digits", () => {
    expect(validateFigure(REVENUE, "4.8bn")).toBe("not_a_number");
    expect(validateFigure(REVENUE, "-500")).toBe("not_a_number");
    expect(validateFigure(REVENUE, "1e9")).toBe("not_a_number");
  });

  it("rejects a zero or negative amount", () => {
    // Zero revenue is not a fundable business, and it is far more often a
    // placeholder than a real answer.
    expect(validateFigure(REVENUE, "0")).toBe("out_of_range");
  });

  it("accepts a zero variable cost, which many small firms really have", () => {
    const variable = field("variable_cost_excl_cogs_y1");
    expect(validateFigure(variable, "0")).toBeNull();
    expect(validateFigure(field("fixed_cost_y1"), "0")).toBe("out_of_range");
  });

  it("catches a mistyped extra digit rather than grading a conglomerate", () => {
    expect(validateFigure(REVENUE, "500000000000")).toBeNull(); // 500bn, ok
    expect(validateFigure(REVENUE, "5000000000000")).toBe("out_of_range");
  });

  it("bounds percentages to 0-100", () => {
    expect(validateFigure(CONC, "35")).toBeNull();
    expect(validateFigure(CONC, "100")).toBeNull();
    expect(validateFigure(CONC, "0")).toBeNull(); // 0% concentration is real
    expect(validateFigure(CONC, "101")).toBe("out_of_range");
  });

  it("accepts a percentage with decimals", () => {
    // Concentration is measured, not estimated — 19.81% is the figure the
    // e-invoice export gives, and the form has to be able to hold it.
    expect(validateFigure(CONC, "19.81")).toBeNull();
    expect(validateFigure(CONC, "19,81")).toBeNull();
    expect(validateFigure(CONC, "100.00")).toBeNull();
    expect(validateFigure(CONC, "100.01")).toBe("out_of_range");
    expect(validateFigure(CONC, "19.8.1")).toBe("not_a_number");
  });
});

describe("parseFigure", () => {
  it("strips grouping separators from a VND amount", () => {
    expect(parseFigure("4.800.000.000", "vnd")).toBe(4_800_000_000);
    expect(parseFigure("4,800,000,000", "vnd")).toBe(4_800_000_000);
    expect(parseFigure("35", "vnd")).toBe(35);
  });

  it("keeps the decimals in a percentage", () => {
    // The reported bug: the concentration measured off an e-invoice export is
    // 19.81%, and the VND normaliser read it as 1981 — which the input clamp
    // then pinned to 100, the worst value that factor can take.
    expect(parseFigure("19.81", "pct")).toBe(19.81);
    expect(parseFigure("32.40", "pct")).toBe(32.4);
    // A Vietnamese keyboard writes the decimal point as a comma.
    expect(parseFigure("19,81", "pct")).toBe(19.81);
    expect(parseFigure("20", "pct")).toBe(20);
  });

  it("returns null for a blank value, not zero", () => {
    // An untouched optional field must not reach the engine as a real 0 —
    // that is a scoreable answer, and a different one.
    expect(parseFigure("", "vnd")).toBeNull();
    expect(parseFigure("   ", "pct")).toBeNull();
  });

  it("returns null for something that is not a number", () => {
    expect(parseFigure("4.8bn", "vnd")).toBeNull();
    expect(parseFigure("19.8.1", "pct")).toBeNull();
  });

  it("round-trips every value validateFigure accepts", () => {
    for (const f of LITE_FIGURE_FIELDS) {
      const sample = f.unit === "pct" ? "42.5" : "1.500.000";
      expect(validateFigure(f, sample)).toBeNull();
      expect(parseFigure(sample, f.unit)).toBeGreaterThan(0);
    }
  });
});

describe("required set", () => {
  it("matches the fields flagged required", () => {
    expect([...REQUIRED_LITE_FIGURE_KEYS].sort()).toEqual(
      LITE_FIGURE_FIELDS.filter((f) => f.required)
        .map((f) => f.key)
        .sort(),
    );
  });

  it("asks for both years of revenue and all three cost lines", () => {
    // These are exactly the GradingInput fields the engine declares
    // non-Optional; dropping one silently produces INSUFFICIENT_DATA.
    for (const key of [
      "revenue_last_12m",
      "revenue_prior_12m",
      "cogs_y1",
      "fixed_cost_y1",
      "variable_cost_excl_cogs_y1",
    ]) {
      expect(REQUIRED_LITE_FIGURE_KEYS).toContain(key);
    }
  });
});

describe("validateFigureConsistency", () => {
  const blank = Object.fromEntries(
    LITE_FIGURE_FIELDS.map((f) => [f.key, ""]),
  ) as Record<LiteFigureKey, string>;
  const withValues = (
    values: Partial<Record<LiteFigureKey, string>>,
  ): Record<LiteFigureKey, string> => ({
    ...blank,
    ...(values as Record<LiteFigureKey, string>),
  });

  it("blames the largest customer when it exceeds the top three", () => {
    // The exact case that reached production as a 422 at Send: top1 66,
    // top3 55.
    expect(
      validateFigureConsistency(
        withValues({ conc_top1_pct: "66", conc_top3_pct: "55" }),
      ),
    ).toEqual({ conc_top1_pct: "top1_exceeds_top3" });
  });

  it("blames fixed cost when the costs leave no profit", () => {
    // The case that reached a score run: each cost line typed as the cost of
    // goods sold, 192bn of cost against 72.7bn of revenue.
    expect(
      validateFigureConsistency(
        withValues({
          revenue_last_12m: "72693906116",
          cogs_y1: "64130972146",
          fixed_cost_y1: "64130972146",
          variable_cost_excl_cogs_y1: "64130972146",
        }),
      ),
    ).toEqual({ fixed_cost_y1: "costs_exceed_revenue" });
  });

  it("refuses costs exactly equal to revenue, and accepts a real profit", () => {
    const costs = (fixed: string) =>
      validateFigureConsistency(
        withValues({
          revenue_last_12m: "1000",
          cogs_y1: "600",
          fixed_cost_y1: fixed,
          variable_cost_excl_cogs_y1: "0",
        }),
      );
    expect(costs("400")).toEqual({ fixed_cost_y1: "costs_exceed_revenue" });
    expect(costs("399")).toEqual({});
  });

  it("allows the largest customer to BE the top three", () => {
    // A company with one customer is unusual, not impossible — equality has
    // to pass or it rejects a real business.
    expect(
      validateFigureConsistency(
        withValues({ conc_top1_pct: "55", conc_top3_pct: "55" }),
      ),
    ).toEqual({});
  });

  it("rejects a weakest month above the best month", () => {
    expect(
      validateFigureConsistency(
        withValues({ revenue_best_month: "100", revenue_worst_month: "200" }),
      ),
    ).toEqual({ revenue_worst_month: "worst_exceeds_best" });
  });

  it("rejects a single month larger than the year containing it", () => {
    expect(
      validateFigureConsistency(
        withValues({
          revenue_last_12m: "1000",
          revenue_best_month: "2000",
        }),
      ),
    ).toEqual({ revenue_best_month: "month_exceeds_year" });
  });

  it("reports nothing while a figure is still blank", () => {
    // Half-typed input must not light up red — the per-field `required` check
    // owns that, and only once the step is submitted.
    expect(
      validateFigureConsistency(withValues({ conc_top1_pct: "66" })),
    ).toEqual({});
  });

  it("passes a self-consistent set", () => {
    expect(
      validateFigureConsistency(
        withValues({
          revenue_last_12m: "575757575",
          revenue_best_month: "75656565",
          revenue_worst_month: "6767676",
          conc_top1_pct: "40",
          conc_top3_pct: "55",
        }),
      ),
    ).toEqual({});
  });
});
