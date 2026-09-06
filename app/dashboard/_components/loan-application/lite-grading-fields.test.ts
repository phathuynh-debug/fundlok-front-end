import { describe, expect, it } from "vitest";
import {
  LITE_FIGURE_FIELDS,
  REQUIRED_LITE_FIGURE_KEYS,
  figureFieldsForStep,
  parseFigure,
  validateFigure,
  type LiteFigureField,
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
});

describe("parseFigure", () => {
  it("strips separators and returns a number", () => {
    expect(parseFigure("4.800.000.000")).toBe(4_800_000_000);
    expect(parseFigure("35")).toBe(35);
  });

  it("returns null for a blank value, not zero", () => {
    // An untouched optional field must not reach the engine as a real 0 —
    // that is a scoreable answer, and a different one.
    expect(parseFigure("")).toBeNull();
    expect(parseFigure("   ")).toBeNull();
  });

  it("round-trips every value validateFigure accepts", () => {
    for (const f of LITE_FIGURE_FIELDS) {
      const sample = f.unit === "pct" ? "42" : "1.500.000";
      expect(validateFigure(f, sample)).toBeNull();
      expect(parseFigure(sample)).toBeGreaterThan(0);
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
