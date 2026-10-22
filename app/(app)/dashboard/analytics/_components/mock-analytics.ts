// Frontend-only sample data for /dashboard/analytics.
//
// Same reasoning as app/dashboard/transactions/_components/mock-transactions.ts:
// there is no backend analytics API yet, so this deliberately sits outside
// services/ rather than pretending to be the real data pipeline. When the API
// lands, move the types into a service, add the endpoint/service/hook layers,
// delete the MOCK_* constants and read from the hook. The derive* helpers below
// are pure and move across unchanged.

export interface MonthlyPoint {
  /** ISO year-month, e.g. "2026-08". */
  month: string;
  /** Cumulative capital deployed to date, VND. */
  deployed_cumulative: number;
  /**
   * Cumulative money received back to date, VND — principal AND yield, not
   * yield alone. Most of what arrives on any given day is the investor's own
   * capital coming home, not earnings.
   */
  returns_cumulative: number;
  /** Money received back in this month alone, VND. Principal + yield. */
  returns_monthly: number;
  /**
   * The principal half of `returns_monthly`, VND — capital returned, which is
   * not profit.
   */
  principal_monthly: number;
  /**
   * The interest half of `returns_monthly`, VND — the only part that is
   * actually earnings.
   *
   * `principal_monthly + yield_monthly === returns_monthly` for every row;
   * mock-analytics.test.ts enforces it. Split out because "how much came back"
   * and "how much did I make" are different questions and a single number
   * cannot answer both — reading a repayment as profit overstates returns by
   * roughly 15x at these ratios.
   */
  yield_monthly: number;
}

export interface IndustryAllocation {
  industry: string;
  /** Capital currently deployed into this industry, VND. */
  deployed: number;
}

// 12 months to 2026-08. Deployments are lumpy (capital goes out when a deal
// closes); returns compound gently as more positions come online.
export const MOCK_MONTHLY: MonthlyPoint[] = [
  {
    month: "2025-09",
    deployed_cumulative: 750000000,
    returns_cumulative: 0,
    returns_monthly: 0,
    principal_monthly: 0,
    yield_monthly: 0,
  },
  {
    month: "2025-10",
    deployed_cumulative: 750000000,
    returns_cumulative: 30000000,
    returns_monthly: 30000000,
    principal_monthly: 28000000,
    yield_monthly: 2000000,
  },
  {
    month: "2025-11",
    deployed_cumulative: 1250000000,
    returns_cumulative: 82500000,
    returns_monthly: 52500000,
    principal_monthly: 49000000,
    yield_monthly: 3500000,
  },
  {
    month: "2025-12",
    deployed_cumulative: 1250000000,
    returns_cumulative: 147500000,
    returns_monthly: 65000000,
    principal_monthly: 60800000,
    yield_monthly: 4200000,
  },
  {
    month: "2026-01",
    deployed_cumulative: 1625000000,
    returns_cumulative: 220000000,
    returns_monthly: 72500000,
    principal_monthly: 67800000,
    yield_monthly: 4700000,
  },
  {
    month: "2026-02",
    deployed_cumulative: 1625000000,
    returns_cumulative: 302500000,
    returns_monthly: 82500000,
    principal_monthly: 77100000,
    yield_monthly: 5400000,
  },
  {
    month: "2026-03",
    deployed_cumulative: 2250000000,
    returns_cumulative: 392500000,
    returns_monthly: 90000000,
    principal_monthly: 84100000,
    yield_monthly: 5900000,
  },
  {
    month: "2026-04",
    deployed_cumulative: 2250000000,
    returns_cumulative: 497500000,
    returns_monthly: 105000000,
    principal_monthly: 98200000,
    yield_monthly: 6800000,
  },
  {
    month: "2026-05",
    deployed_cumulative: 2500000000,
    returns_cumulative: 610000000,
    returns_monthly: 112500000,
    principal_monthly: 105200000,
    yield_monthly: 7300000,
  },
  {
    month: "2026-06",
    deployed_cumulative: 3250000000,
    returns_cumulative: 730000000,
    returns_monthly: 120000000,
    principal_monthly: 112200000,
    yield_monthly: 7800000,
  },
  {
    month: "2026-07",
    deployed_cumulative: 3625000000,
    returns_cumulative: 865000000,
    returns_monthly: 135000000,
    principal_monthly: 126200000,
    yield_monthly: 8800000,
  },
  {
    month: "2026-08",
    deployed_cumulative: 4250000000,
    returns_cumulative: 1012500000,
    returns_monthly: 147500000,
    principal_monthly: 137900000,
    yield_monthly: 9600000,
  },
];

// Sums to the final deployed_cumulative above: 4,250,000,000 VND.
//
// Industry values are the grading engine's canonical strings from
// lib/constants/industries.ts. A made-up label ("Technology", "Energy") renders
// an untinted card and stays in English under the Vietnamese locale, and
// "Energy" is not something the engine can score at all.
export const MOCK_ALLOCATION: IndustryAllocation[] = [
  { industry: "IT Services", deployed: 1300000000 },
  { industry: "Agriculture & Farming", deployed: 950000000 },
  { industry: "Manufacturing", deployed: 800000000 },
  { industry: "Healthcare & Pharmacy", deployed: 700000000 },
  { industry: "Logistics & Transport", deployed: 500000000 },
];

export interface CapitalStatusAllocation {
  statusKey: "active" | "repaying" | "completed" | "writtenDown";
  amount: number;
}

// Breakdown of deployed capital across facility lifecycle stages. Sums to
// 4,250,000,000 VND.
//
// The written-down slice is deliberate. A status chart with only healthy
// stages tells an investor that capital either performs or is still working,
// which is an implied floor the product does not offer (fundlok-domain §5) —
// the investor bears the loss when a business underperforms.
export const MOCK_CAPITAL_STATUS: CapitalStatusAllocation[] = [
  { statusKey: "active", amount: 2450000000 },
  { statusKey: "repaying", amount: 1020000000 },
  { statusKey: "completed", amount: 680000000 },
  { statusKey: "writtenDown", amount: 100000000 },
];

export const MOCK_ACTIVE_POSITIONS = 8;

export type RangeKey = "3M" | "6M" | "12M";

export const RANGE_MONTHS: Record<RangeKey, number> = {
  "3M": 3,
  "6M": 6,
  "12M": 12,
};

export function sliceByRange(
  points: MonthlyPoint[],
  range: RangeKey,
): MonthlyPoint[] {
  return points.slice(-RANGE_MONTHS[range]);
}

export interface AnalyticsKpis {
  deployed: number;
  returns: number;
  /** Returns as a share of deployed capital, in percent. */
  roi: number;
  activePositions: number;
  /** Capital deployed during the selected range only. */
  deployedInRange: number;
  /** Returns received during the selected range only. */
  returnsInRange: number;
}

// Cumulative series: the headline is the latest point, and the "in range"
// figures are the movement across the window rather than a re-based total.
export function deriveKpis(points: MonthlyPoint[]): AnalyticsKpis {
  const latest = points[points.length - 1];
  const first = points[0];

  if (!latest || !first) {
    return {
      deployed: 0,
      returns: 0,
      roi: 0,
      activePositions: MOCK_ACTIVE_POSITIONS,
      deployedInRange: 0,
      returnsInRange: 0,
    };
  }

  return {
    deployed: latest.deployed_cumulative,
    returns: latest.returns_cumulative,
    roi:
      latest.deployed_cumulative === 0
        ? 0
        : (latest.returns_cumulative / latest.deployed_cumulative) * 100,
    activePositions: MOCK_ACTIVE_POSITIONS,
    deployedInRange: latest.deployed_cumulative - first.deployed_cumulative,
    returnsInRange: points.reduce((sum, p) => sum + p.returns_monthly, 0),
  };
}

export function totalAllocated(allocation: IndustryAllocation[]): number {
  return allocation.reduce((sum, a) => sum + a.deployed, 0);
}

// Axis tick for a "2026-08" month key. English gets the locale's short month
// name; Vietnamese gets the conventional "T8" form, which is far shorter on an
// axis than Intl's "thg 8". Deliberately not formatDate() -- that formats whole
// numeric dates, and a bare month label is a different job.
export function monthTickLabel(month: string, locale: string): string {
  const [year, monthPart] = month.split("-");
  const monthNumber = Number(monthPart);

  if (locale === "vi") return `T${monthNumber}`;

  return new Date(Number(year), monthNumber - 1, 1).toLocaleDateString(
    "en-US",
    {
      month: "short",
    },
  );
}
