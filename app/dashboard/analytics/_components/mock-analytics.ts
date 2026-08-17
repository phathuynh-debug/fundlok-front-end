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
  /** Cumulative capital deployed to date, USD. */
  deployed_cumulative: number;
  /** Cumulative returns received to date, USD. */
  returns_cumulative: number;
  /** Returns received in this month alone, USD. */
  returns_monthly: number;
}

export interface IndustryAllocation {
  industry: string;
  /** Capital currently deployed into this industry, USD. */
  deployed: number;
}

// 12 months to 2026-08. Deployments are lumpy (capital goes out when a deal
// closes); returns compound gently as more positions come online.
export const MOCK_MONTHLY: MonthlyPoint[] = [
  {
    month: "2025-09",
    deployed_cumulative: 30000,
    returns_cumulative: 0,
    returns_monthly: 0,
  },
  {
    month: "2025-10",
    deployed_cumulative: 30000,
    returns_cumulative: 1200,
    returns_monthly: 1200,
  },
  {
    month: "2025-11",
    deployed_cumulative: 50000,
    returns_cumulative: 3300,
    returns_monthly: 2100,
  },
  {
    month: "2025-12",
    deployed_cumulative: 50000,
    returns_cumulative: 5900,
    returns_monthly: 2600,
  },
  {
    month: "2026-01",
    deployed_cumulative: 65000,
    returns_cumulative: 8800,
    returns_monthly: 2900,
  },
  {
    month: "2026-02",
    deployed_cumulative: 65000,
    returns_cumulative: 12100,
    returns_monthly: 3300,
  },
  {
    month: "2026-03",
    deployed_cumulative: 90000,
    returns_cumulative: 15700,
    returns_monthly: 3600,
  },
  {
    month: "2026-04",
    deployed_cumulative: 90000,
    returns_cumulative: 19900,
    returns_monthly: 4200,
  },
  {
    month: "2026-05",
    deployed_cumulative: 100000,
    returns_cumulative: 24400,
    returns_monthly: 4500,
  },
  {
    month: "2026-06",
    deployed_cumulative: 130000,
    returns_cumulative: 29200,
    returns_monthly: 4800,
  },
  {
    month: "2026-07",
    deployed_cumulative: 145000,
    returns_cumulative: 34600,
    returns_monthly: 5400,
  },
  {
    month: "2026-08",
    deployed_cumulative: 170000,
    returns_cumulative: 40500,
    returns_monthly: 5900,
  },
];

// Sums to the final deployed_cumulative above (170,000).
export const MOCK_ALLOCATION: IndustryAllocation[] = [
  { industry: "Technology", deployed: 52000 },
  { industry: "Agriculture", deployed: 38000 },
  { industry: "Manufacturing", deployed: 32000 },
  { industry: "Healthcare", deployed: 28000 },
  { industry: "Energy", deployed: 20000 },
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
