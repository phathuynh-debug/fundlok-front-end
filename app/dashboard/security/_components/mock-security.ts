// Frontend-only sample data for /dashboard/security.
//
// Same reasoning as app/dashboard/analytics/_components/mock-analytics.ts:
// there is no backend security API yet (no sessions endpoint, no audit-log
// endpoint, no 2FA enrolment), so this deliberately sits outside services/
// rather than pretending to be the real data pipeline. When those endpoints
// land, move the types into a service, add the endpoint/service/hook layers,
// delete the MOCK_* constants and read from the hook. `deriveScore` below is
// pure and moves across unchanged.
//
// Timestamps are fixed ISO strings rather than Date.now() offsets so the screen
// renders identically on every load and in screenshots.

/** A protection the account can have on or off. */
export type ProtectionState = "on" | "off" | "recommended";

export interface ProtectionItem {
  key: string;
  state: ProtectionState;
  /** ISO timestamp of the last change, when the protection is on. */
  updated_at?: string;
  /** Whether the mock lets the user toggle it from this screen. */
  toggleable: boolean;
  /** Counts toward the posture score. */
  weight: number;
}

export interface DeviceSession {
  id: string;
  /** Free text, intentionally untranslated — browser and OS are proper nouns. */
  device: string;
  browser: string;
  location: string;
  ip: string;
  last_active: string;
  /** The session the user is currently browsing from; cannot be revoked. */
  current: boolean;
  /** Signed in from a device/location not seen before. */
  unrecognized: boolean;
}

export type ActivitySeverity = "info" | "warning" | "critical";

export interface ActivityEvent {
  id: string;
  /** Maps to dashboard.security.activity.events.<key> in the dictionaries. */
  key: string;
  severity: ActivitySeverity;
  at: string;
  /** Interpolated into the translated message. */
  params?: Record<string, string | number>;
}

export const MOCK_PROTECTIONS: ProtectionItem[] = [
  {
    key: "password",
    state: "on",
    updated_at: "2026-05-14T09:20:00+07:00",
    toggleable: false,
    weight: 25,
  },
  {
    key: "totp",
    state: "on",
    updated_at: "2026-05-14T09:34:00+07:00",
    toggleable: true,
    weight: 30,
  },
  {
    key: "withdrawalLock",
    state: "on",
    updated_at: "2026-06-02T15:10:00+07:00",
    toggleable: true,
    weight: 20,
  },
  { key: "passkey", state: "recommended", toggleable: true, weight: 15 },
  { key: "loginAlerts", state: "off", toggleable: true, weight: 10 },
];

export const MOCK_SESSIONS: DeviceSession[] = [
  {
    id: "sess-1",
    device: "MacBook Pro",
    browser: "Chrome 141",
    location: "Ho Chi Minh City, VN",
    ip: "113.161.44.18",
    last_active: "2026-08-18T08:42:00+07:00",
    current: true,
    unrecognized: false,
  },
  {
    id: "sess-2",
    device: "iPhone 16",
    browser: "Safari Mobile",
    location: "Da Nang, VN",
    ip: "27.75.219.4",
    last_active: "2026-08-17T21:05:00+07:00",
    current: false,
    unrecognized: false,
  },
  {
    id: "sess-3",
    device: "Windows 11 PC",
    browser: "Edge 139",
    location: "Singapore, SG",
    ip: "159.223.88.201",
    last_active: "2026-08-16T02:17:00+07:00",
    current: false,
    unrecognized: true,
  },
];

export const MOCK_ACTIVITY: ActivityEvent[] = [
  {
    id: "act-1",
    key: "signIn",
    severity: "info",
    at: "2026-08-18T08:42:00+07:00",
    params: { device: "Chrome on macOS", location: "Ho Chi Minh City" },
  },
  {
    id: "act-2",
    key: "newDevice",
    severity: "warning",
    at: "2026-08-16T02:17:00+07:00",
    params: { device: "Edge on Windows", location: "Singapore" },
  },
  {
    id: "act-3",
    key: "failedAttempts",
    severity: "critical",
    at: "2026-08-16T02:11:00+07:00",
    params: { count: 3, location: "Singapore" },
  },
  {
    id: "act-4",
    key: "payoutAccountAdded",
    severity: "warning",
    at: "2026-06-02T15:10:00+07:00",
    params: { bank: "Vietcombank ••••4417" },
  },
  {
    id: "act-5",
    key: "twoFactorEnabled",
    severity: "info",
    at: "2026-05-14T09:34:00+07:00",
  },
  {
    id: "act-6",
    key: "passwordChanged",
    severity: "info",
    at: "2026-05-14T09:20:00+07:00",
  },
];

/**
 * Posture score out of 100: the share of protection weight that is switched on.
 * Pure so it survives the move to a real API — pass it whatever the endpoint
 * returns.
 */
export function deriveScore(items: ProtectionItem[]): number {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  if (total === 0) return 0;
  const earned = items.reduce(
    (sum, item) => (item.state === "on" ? sum + item.weight : sum),
    0,
  );
  return Math.round((earned / total) * 100);
}

export type PostureBand = "strong" | "fair" | "weak";

export function scoreBand(score: number): PostureBand {
  if (score >= 80) return "strong";
  if (score >= 50) return "fair";
  return "weak";
}
