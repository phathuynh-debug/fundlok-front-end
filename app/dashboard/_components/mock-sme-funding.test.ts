import { describe, it, expect } from "vitest";

import {
  MOCK_INSTALLMENTS,
  MOCK_SME_FUNDING,
  summarizeFunding,
  type Installment,
  type SmeFunding,
} from "./mock-sme-funding";

const funding = (overrides: Partial<SmeFunding> = {}): SmeFunding => ({
  requested: 1_000_000_000,
  funded: 500_000_000,
  investor_count: 5,
  grade: "B",
  interest_rate_pct: 14,
  term_months: 12,
  disbursed_at: null,
  ...overrides,
});

const installment = (overrides: Partial<Installment> = {}): Installment => ({
  number: 1,
  due_date: "2026-09-18",
  principal: 80_000_000,
  interest: 20_000_000,
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

  it("keeps one decimal of funded percentage", () => {
    const summary = summarizeFunding(
      funding({ requested: 300_000_000, funded: 100_000_000 }),
      [],
    );
    expect(summary.funded_pct).toBe(33.3);
  });

  it("does not divide by zero when nothing was requested", () => {
    expect(summarizeFunding(funding({ requested: 0 }), []).funded_pct).toBe(0);
  });

  it("counts an early repayment as settled", () => {
    // Early repayment is a platform value, so EARLY must count toward repaid
    // and progress — treating it as unpaid was the bug worth guarding.
    const summary = summarizeFunding(funding(), [
      installment({ number: 1, status: "PAID" }),
      installment({ number: 2, status: "EARLY" }),
      installment({ number: 3, status: "DUE" }),
    ]);
    expect(summary.settled_count).toBe(2);
    expect(summary.repaid).toBe(200_000_000);
    expect(summary.outstanding).toBe(100_000_000);
  });

  it("splits repaid and outstanding across principal and interest", () => {
    const summary = summarizeFunding(funding(), [
      installment({
        number: 1,
        principal: 70_000_000,
        interest: 15_000_000,
        status: "PAID",
      }),
      installment({ number: 2, principal: 71_000_000, interest: 14_000_000 }),
    ]);
    expect(summary.repaid).toBe(85_000_000);
    expect(summary.outstanding).toBe(85_000_000);
  });

  it("takes the next owed installment in schedule order", () => {
    const summary = summarizeFunding(funding(), [
      installment({ number: 1, status: "PAID" }),
      installment({ number: 2, status: "DUE" }),
      installment({ number: 3, status: "UPCOMING" }),
    ]);
    expect(summary.next?.number).toBe(2);
  });

  it("reports no next installment once the schedule is settled", () => {
    const summary = summarizeFunding(funding(), [
      installment({ number: 1, status: "PAID" }),
      installment({ number: 2, status: "EARLY" }),
    ]);
    expect(summary.next).toBeNull();
    expect(summary.outstanding).toBe(0);
  });

  it("handles an empty schedule", () => {
    const summary = summarizeFunding(funding(), []);
    expect(summary).toMatchObject({
      repaid: 0,
      outstanding: 0,
      settled_count: 0,
      total_count: 0,
      next: null,
    });
  });
});

describe("MOCK_SME_FUNDING / MOCK_INSTALLMENTS", () => {
  it("cannot have raised more than it asked for", () => {
    expect(MOCK_SME_FUNDING.funded).toBeLessThanOrEqual(
      MOCK_SME_FUNDING.requested,
    );
  });

  it("amortizes: principal rises and interest falls across the schedule", () => {
    // Flat columns would betray hand-typed numbers rather than a schedule.
    for (let i = 1; i < MOCK_INSTALLMENTS.length; i += 1) {
      expect(MOCK_INSTALLMENTS[i].principal).toBeGreaterThan(
        MOCK_INSTALLMENTS[i - 1].principal,
      );
      expect(MOCK_INSTALLMENTS[i].interest).toBeLessThan(
        MOCK_INSTALLMENTS[i - 1].interest,
      );
    }
  });

  it("numbers installments consecutively from 1", () => {
    MOCK_INSTALLMENTS.forEach((item, index) => {
      expect(item.number).toBe(index + 1);
    });
  });

  it("carries a paid_date on settled rows only", () => {
    for (const item of MOCK_INSTALLMENTS) {
      const settled = item.status === "PAID" || item.status === "EARLY";
      expect(Boolean(item.paid_date)).toBe(settled);
    }
  });

  it("settles an EARLY row before its due date", () => {
    for (const item of MOCK_INSTALLMENTS) {
      if (item.status === "EARLY") {
        expect(new Date(item.paid_date!).getTime()).toBeLessThan(
          new Date(item.due_date).getTime(),
        );
      }
    }
  });

  it("keeps exactly one DUE row, and places it after every settled row", () => {
    const due = MOCK_INSTALLMENTS.filter((i) => i.status === "DUE");
    expect(due).toHaveLength(1);
    const lastSettled = MOCK_INSTALLMENTS.filter(
      (i) => i.status === "PAID" || i.status === "EARLY",
    ).at(-1);
    expect(due[0].number).toBeGreaterThan(lastSettled!.number);
  });
});
