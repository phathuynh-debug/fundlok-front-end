import { describe, expect, it } from "vitest";
import {
  clampPercentInput,
  LITE_FIGURE_FIELDS,
  REQUIRED_LITE_FIGURE_KEYS,
  figureFieldsForStep,
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
  it("places every field on a step the wizard renders", () => {
    for (const f of LITE_FIGURE_FIELDS) {
      expect([2, 3]).toContain(f.step);
    }
  });

  it("covers both figure steps", () => {
    expect(figureFieldsForStep(2).length).toBeGreaterThan(0);
    expect(figureFieldsForStep(3).length).toBeGreaterThan(0);
    expect(figureFieldsForStep(4)).toHaveLength(0);
  });

  it("has no duplicate keys", () => {
    const keys = LITE_FIGURE_FIELDS.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("names the GradingInput field each figure feeds", () => {
    // The whole point of the typed path is that these reach the engine; a
    // field with no mapping is a field nobody can use.
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

describe("clampPercentInput", () => {
  it("holds a value above 100 at 100", () => {
    // The reported case: typing into "Top 3 customers, % of revenue" ran past
    // 100 and only failed at Send.
    expect(clampPercentInput("2323")).toBe("100");
    expect(clampPercentInput("101")).toBe("100");
  });

  it("holds a negative at 0", () => {
    // Not typeable on a numeric keypad, but reachable by paste.
    expect(clampPercentInput("-5")).toBe("0");
  });

  it("leaves a value inside the range exactly as typed", () => {
    // Including the raw spelling — reformatting mid-typing moves the caret.
    expect(clampPercentInput("23")).toBe("23");
    expect(clampPercentInput("0")).toBe("0");
    expect(clampPercentInput("100")).toBe("100");
  });

  it("leaves an empty field empty", () => {
    // Coercing blank to "0" would make an optional figure look answered, and
    // 0% concentration is a claim rather than a default.
    expect(clampPercentInput("")).toBe("");
    expect(clampPercentInput("   ")).toBe("   ");
  });

  it("does not rewrite something that is not a number", () => {
    // The existing not_a_number error should get to explain itself.
    expect(clampPercentInput("abc")).toBe("abc");
    expect(clampPercentInput("12abc")).toBe("12abc");
  });

  it("reads a separator in a percentage as a decimal point", () => {
    // Not as grouping. There is nothing to group below 100, and reading
    // "19.81" as 1981 is what produced the silent clamp to 100.
    expect(clampPercentInput("19.81")).toBe("19.81");
    expect(clampPercentInput("19,81")).toBe("19,81");
    // So "1.000" is one percent, and stays exactly as typed.
    expect(clampPercentInput("1.000")).toBe("1.000");
    // Still clamped when the decimal itself runs past the ceiling.
    expect(clampPercentInput("100.5")).toBe("100");
  });

  it("leaves a half-typed decimal alone", () => {
    // Runs on every keystroke, so "19." is a moment in typing "19.81", not an
    // error to rewrite.
    expect(clampPercentInput("19.")).toBe("19.");
    expect(clampPercentInput("-")).toBe("-");
  });
});
