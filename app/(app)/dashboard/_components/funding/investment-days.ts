import type { ProjectedDay, RepaymentRow } from "@/services/repayment.service";

// One investment's repayment days as the business pays them: one ticket per
// working day, and how far through them it is. Shared by the business's
// investment page and its tests.

export type DayStatus = "paid" | "missing" | "due" | "upcoming";

/** One working day's ticket for one investment: its rows that day added up
 *  (the first day also carries the first-period interest). */
export interface InvestmentDay {
  /** Its period, from 1: Kỳ 1 is the first working day. */
  index: number;
  due_date: string;
  principal_vnd: number;
  interest_vnd: number;
  gross_vnd: number;
  tax_withheld_vnd: number;
  net_vnd: number;
  /** null while projected: nothing is due yet. */
  status: DayStatus | null;
}

const PAID = new Set(["PRESUMED_PAID", "MATCHED"]);

/** An investment's rows as the business pays them, one ticket per day. */
export function ticketsByDay(
  rows: (RepaymentRow | ProjectedDay)[],
  today: string,
): InvestmentDay[] {
  const byDate = new Map<string, { day: InvestmentDay; states: string[] }>();
  for (const row of rows) {
    const entry = byDate.get(row.due_date) ?? {
      day: {
        index: 0,
        due_date: row.due_date,
        principal_vnd: 0,
        interest_vnd: 0,
        gross_vnd: 0,
        tax_withheld_vnd: 0,
        net_vnd: 0,
        status: null,
      },
      states: [],
    };
    entry.day.principal_vnd += row.principal_vnd;
    entry.day.interest_vnd += row.interest_vnd;
    entry.day.gross_vnd += row.gross_vnd;
    entry.day.tax_withheld_vnd += row.tax_withheld_vnd;
    entry.day.net_vnd += row.net_vnd;
    if ("status" in row) entry.states.push(row.status);
    byDate.set(row.due_date, entry);
  }
  return [...byDate.values()]
    .sort((a, b) => a.day.due_date.localeCompare(b.day.due_date))
    .map(({ day, states }, position) => ({
      ...day,
      index: position + 1,
      status:
        states.length === 0
          ? null
          : states.includes("REPORTED_MISSED")
            ? "missing"
            : states.every((state) => PAID.has(state))
              ? "paid"
              : day.due_date <= today
                ? "due"
                : "upcoming",
    }));
}

/** How far the business is through one investment: days paid and left, what
 *  it has transferred and still owes, the next ticket, and the days already
 *  past that it has not marked paid. A day reported missing is not paid. */
export function investmentProgress(days: InvestmentDay[], today: string) {
  const paid = days.filter((day) => day.status === "paid");
  const unpaid = days.filter((day) => day.status !== "paid");
  return {
    count: days.length,
    paidDays: paid.length,
    leftDays: unpaid.length,
    paidNet: paid.reduce((sum, day) => sum + day.net_vnd, 0),
    totalNet: days.reduce((sum, day) => sum + day.net_vnd, 0),
    leftGross: unpaid.reduce((sum, day) => sum + day.gross_vnd, 0),
    leftNet: unpaid.reduce((sum, day) => sum + day.net_vnd, 0),
    overdue: days.filter((day) => day.status === "due" && day.due_date < today)
      .length,
    next: days.find((day) => day.status === "due" || day.status === "upcoming"),
  };
}
