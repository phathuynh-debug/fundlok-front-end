import { describe, it, expect } from "vitest";

import {
  MOCK_ALLOCATION,
  MOCK_CAPITAL_STATUS,
  MOCK_MONTHLY,
  deriveKpis,
  sliceByRange,
  totalAllocated,
} from "./mock-analytics";

describe("MOCK_MONTHLY", () => {
  it("splits every month into principal and yield that sum to the total", () => {
    // The invariant MonthlyReturnsChart relies on: it plots
    // principal_monthly + yield_monthly, and that has to be the same money
    // returns_monthly describes, or the chart and the KPI cards disagree.
    for (const point of MOCK_MONTHLY) {
      expect(point.principal_monthly + point.yield_monthly).toBe(
        point.returns_monthly,
      );
    }
  });

  it("keeps yield a minority of every repayment", () => {
    // On an amortising loan the investor's own capital is most of each
    // instalment. A row where yield dominated would be a data error, and it is
    // exactly the misreading the split exists to prevent.
    for (const point of MOCK_MONTHLY.filter((p) => p.returns_monthly > 0)) {
      expect(point.yield_monthly).toBeLessThan(point.principal_monthly);
    }
  });

  it("never returns a negative amount", () => {
    for (const point of MOCK_MONTHLY) {
      expect(point.principal_monthly).toBeGreaterThanOrEqual(0);
      expect(point.yield_monthly).toBeGreaterThanOrEqual(0);
    }
  });

  it("accumulates the monthly figures into returns_cumulative", () => {
    let running = 0;
    for (const point of MOCK_MONTHLY) {
      running += point.returns_monthly;
      expect(point.returns_cumulative).toBe(running);
    }
  });

  it("never lets cumulative returns exceed capital deployed", () => {
    // Money cannot come back before it goes out. A series that breached this
    // would render a chart showing more returned than was ever invested.
    for (const point of MOCK_MONTHLY) {
      expect(point.returns_cumulative).toBeLessThanOrEqual(
        point.deployed_cumulative,
      );
    }
  });

  it("never lets deployed capital go backwards", () => {
    const deployed = MOCK_MONTHLY.map((p) => p.deployed_cumulative);
    expect([...deployed].sort((a, b) => a - b)).toEqual(deployed);
  });
});

describe("sliceByRange", () => {
  it("returns the last N months for each range", () => {
    expect(sliceByRange(MOCK_MONTHLY, "3M")).toHaveLength(3);
    expect(sliceByRange(MOCK_MONTHLY, "6M")).toHaveLength(6);
    expect(sliceByRange(MOCK_MONTHLY, "12M")).toHaveLength(12);
  });

  it("keeps the most recent month last", () => {
    const sliced = sliceByRange(MOCK_MONTHLY, "3M");
    expect(sliced[sliced.length - 1]).toBe(
      MOCK_MONTHLY[MOCK_MONTHLY.length - 1],
    );
  });
});

describe("deriveKpis", () => {
  it("takes the headline figures from the latest point", () => {
    const latest = MOCK_MONTHLY[MOCK_MONTHLY.length - 1];
    const kpis = deriveKpis(MOCK_MONTHLY);

    expect(kpis.deployed).toBe(latest.deployed_cumulative);
    expect(kpis.returns).toBe(latest.returns_cumulative);
  });

  it("measures in-range movement rather than a re-based total", () => {
    const range = sliceByRange(MOCK_MONTHLY, "3M");
    const kpis = deriveKpis(range);

    expect(kpis.deployedInRange).toBe(
      range[range.length - 1].deployed_cumulative -
        range[0].deployed_cumulative,
    );
    expect(kpis.returnsInRange).toBe(
      range.reduce((sum, p) => sum + p.returns_monthly, 0),
    );
  });

  it("survives an empty series without dividing by zero", () => {
    const kpis = deriveKpis([]);

    expect(kpis.deployed).toBe(0);
    expect(kpis.returns).toBe(0);
    expect(kpis.roi).toBe(0);
  });
});

describe("totalAllocated", () => {
  it("sums to the capital deployed by the final month", () => {
    expect(totalAllocated(MOCK_ALLOCATION)).toBe(
      MOCK_MONTHLY[MOCK_MONTHLY.length - 1].deployed_cumulative,
    );
  });

  it("is zero for an empty allocation", () => {
    expect(totalAllocated([])).toBe(0);
  });
});

describe("MOCK_CAPITAL_STATUS", () => {
  it("accounts for all deployed capital exactly once", () => {
    const total = MOCK_CAPITAL_STATUS.reduce((sum, s) => sum + s.amount, 0);
    expect(total).toBe(
      MOCK_MONTHLY[MOCK_MONTHLY.length - 1].deployed_cumulative,
    );
  });
});
