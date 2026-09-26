import { describe, it, expect } from "vitest";

import { ALLOWED_TERM_MONTHS } from "@/lib/facility-terms";
import {
  BUSINESS_DAYS_PER_PERIOD,
  MOCK_REPAYMENT_PERIODS,
  MOCK_SME_FUNDING,
  periodTotal,
  RATE_CEILING_PCT,
  summarizeFunding,
  type RepaymentPeriod,
  type SmeFunding,
} from "./mock-sme-funding";

// summarizeFunding is the logic that survives the move to a real repayment
// API. The MOCK_SME_FUNDING block at the bottom asserts the fundlok-domain
// invariants directly, so sample data cannot quietly drift back into
// bank-loan mechanics (monthly instalments, a letter grade, a term over 12).

const funding = (overrides: Partial<SmeFunding> = {}): SmeFunding => ({
  requested: 1_000_000_000,
  funded: 500_000_000,
  investor_count: 5,
  score: 70,
  interest_rate_pct: 14,
  term_months: 6,
  total_repayable: 536_250_000,
  daily_amount: 4_255_952,
  revenue_share: 0.25,
  disbursed_at: null,
  ...overrides,
});

const period = (overrides: Partial<RepaymentPeriod> = {}): RepaymentPeriod => ({
  number: 1,
  start_date: "2026-05-18",
  end_date: "2026-06-16",
  business_days: BUSINESS_DAYS_PER_PERIOD,
  daily_amount: 1_000_000,
  status: "UPCOMING",
  ...overrides,
});

describe("summarizeFunding", () => {
  it("expresses funded as a percentage of the ask", () => {
    const summary = summarizeFunding(
      funding({ requested: 1_250_000_000, funded: 875_000_000 }),
      [],
    );
    expect(summary.funded_pct).toBe(70);
  });

  it("does not divide by zero when nothing was requested", () => {
    expect(summarizeFunding(funding({ requested: 0 }), []).funded_pct).toBe(0);
  });

  it("counts a collected period as daily amount times business days", () => {
    const summary = summarizeFunding(funding(), [
      period({ daily_amount: 1_000_000, business_days: 21, status: "SETTLED" }),
    ]);
    expect(summary.repaid).toBe(21_000_000);
  });

  it("stretches the term and adds interest when a relief period falls short", () => {
    // THE load-bearing assertion. When revenue drops the daily amount drops
    // and the term stretches until the shortfall is repaid; interest on the
    // extra time is added, so the total goes UP. What is still owed is that
    // total minus collected — never the sum of the remaining schedule.
    const summary = summarizeFunding(
      funding({ total_repayable: 500_000_000 }),
      [
        period({
          number: 1,
          daily_amount: 1_000_000,
          business_days: 21,
          status: "SETTLED",
        }),
        // Relief: this period collects far less...
        period({
          number: 2,
          daily_amount: 200_000,
          business_days: 21,
          contractual_daily_amount: 1_000_000,
          status: "RELIEF_APPLIED",
        }),
      ],
    );
    expect(summary.repaid).toBe(21_000_000 + 4_200_000);
    // ...16,800,000 short at the fixture's 4,255,952/day stretches the term by
    // 4 business days, and 500M x 14% x 4 / 252 = 1,111,111 of extra interest.
    expect(summary.extra_business_days).toBe(4);
    expect(summary.extra_interest).toBe(1_111_111);
    expect(summary.total_repayable).toBe(500_000_000 + 1_111_111);
    expect(summary.outstanding).toBe(500_000_000 + 1_111_111 - 25_200_000);
  });

  it("keeps the signing total when every period is collected in full", () => {
    const summary = summarizeFunding(
      funding({ total_repayable: 500_000_000 }),
      [period({ number: 1, status: "SETTLED" })],
    );
    expect(summary.extra_business_days).toBe(0);
    expect(summary.extra_interest).toBe(0);
    expect(summary.total_repayable).toBe(500_000_000);
  });

  it("treats a relief period as collected, not as still owing", () => {
    const summary = summarizeFunding(funding(), [
      period({ number: 1, status: "SETTLED" }),
      period({ number: 2, status: "RELIEF_APPLIED" }),
      period({ number: 3, status: "CURRENT" }),
    ]);
    expect(summary.settled_count).toBe(2);
    expect(summary.current?.number).toBe(3);
  });

  it("returns a null current period once every period is collected", () => {
    const summary = summarizeFunding(funding(), [
      period({ status: "SETTLED" }),
    ]);
    expect(summary.current).toBeNull();
  });

  it("derives the backstop date from the declared term", () => {
    const summary = summarizeFunding(
      funding({ disbursed_at: "2026-05-18", term_months: 6 }),
      [],
    );
    expect(summary.backstop_date).toBe("2027-01-18");
  });

  it("has no backstop date while the listing is still funding", () => {
    expect(
      summarizeFunding(funding({ disbursed_at: null }), []).backstop_date,
    ).toBeNull();
  });
});

describe("MOCK_SME_FUNDING", () => {
  it("declares a term of 1 to 6 months", () => {
    expect(ALLOWED_TERM_MONTHS as readonly number[]).toContain(
      MOCK_SME_FUNDING.term_months,
    );
  });

  it("adds interest for the days its relief period stretched the term", () => {
    // 46,996,257 short at 7,447,917/day -> 7 extra business days, and
    // 875,000,000 x 14.5% x 7 / 252 = 3,524,306.
    const summary = summarizeFunding(MOCK_SME_FUNDING, MOCK_REPAYMENT_PERIODS);
    expect(summary.extra_business_days).toBe(7);
    expect(summary.extra_interest).toBe(3_524_306);
    expect(summary.total_repayable).toBe(
      MOCK_SME_FUNDING.total_repayable + 3_524_306,
    );
  });

  it("never quotes a rate above the statutory ceiling", () => {
    // Handbook §2: capped at 20%/yr, and the quoted rate is all-in.
    expect(MOCK_SME_FUNDING.interest_rate_pct).toBeLessThanOrEqual(
      RATE_CEILING_PCT,
    );
  });

  it("scores the business 0-100 rather than lettering it", () => {
    expect(MOCK_SME_FUNDING.score).toBeGreaterThanOrEqual(0);
    expect(MOCK_SME_FUNDING.score).toBeLessThanOrEqual(100);
  });

  it("reconciles the total repayable with the daily amount and the term", () => {
    // The total is the daily amount charged across every business day of the
    // term. If these drift apart the screen shows two contradictory numbers.
    const businessDays =
      MOCK_SME_FUNDING.term_months * BUSINESS_DAYS_PER_PERIOD;
    expect(MOCK_SME_FUNDING.daily_amount * businessDays).toBe(
      MOCK_SME_FUNDING.total_repayable,
    );
  });

  it("prices the total above the principal by roughly the quoted rate", () => {
    const implied =
      (MOCK_SME_FUNDING.total_repayable / MOCK_SME_FUNDING.funded - 1) * 100;
    const expected =
      (MOCK_SME_FUNDING.interest_rate_pct * MOCK_SME_FUNDING.term_months) / 12;
    expect(Math.abs(implied - expected)).toBeLessThan(0.1);
  });
});

describe("MOCK_REPAYMENT_PERIODS", () => {
  it("charges a flat amount per business day within a period", () => {
    // Not an amortisation table: there is no shifting principal/interest
    // split, because the product does not have one.
    for (const p of MOCK_REPAYMENT_PERIODS) {
      expect(p.business_days).toBe(BUSINESS_DAYS_PER_PERIOD);
      expect(periodTotal(p)).toBe(p.daily_amount * p.business_days);
    }
  });

  it("only ever lowers the daily amount, never raises it", () => {
    // A strong period never raises the daily amount.
    for (const p of MOCK_REPAYMENT_PERIODS) {
      if (p.contractual_daily_amount) {
        expect(p.daily_amount).toBeLessThan(p.contractual_daily_amount);
        expect(p.status).toBe("RELIEF_APPLIED");
      }
    }
  });

  it("covers the periods in order with no gaps in numbering", () => {
    MOCK_REPAYMENT_PERIODS.forEach((p, index) => {
      expect(p.number).toBe(index + 1);
    });
  });

  it("has one period per month of the declared term", () => {
    expect(MOCK_REPAYMENT_PERIODS).toHaveLength(MOCK_SME_FUNDING.term_months);
  });
});
