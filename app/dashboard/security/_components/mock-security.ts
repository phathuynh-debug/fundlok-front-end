// Frontend-only sample data for the PROTECTIONS half of /dashboard/security.
//
// Sessions and activity are real now: /auth/sessions reads refresh_tokens and
// /auth/security-events reads audit_logs, both via
// hooks/use-authentication.ts. What remains mocked is the protection list —
// 2FA, passkeys, sign-in alerts and the payout-account lock have no backend at
// all yet, so the toggles change this screen only.
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
export type ProtectionState =
  | "on"
  | "off"
  | "recommended"
  // No backend at all yet. Rendered as a disabled row rather than a toggle:
  // a switch that claims to arm two-factor auth and does nothing is worse than
  // no switch, and a badge reading "on" would be a straight lie.
  | "unavailable";

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

/**
 * The protection rows, with only the states we can actually stand behind.
 *
 *   password    real  — always set for a password account; the row opens the
 *                       change-password dialog
 *   loginAlerts real  — users.signin_alerts_enabled, toggled through the API
 *   totp        none  — needs a TOTP library, secret storage and a login-flow
 *                       change; shown as unavailable, never as "on"
 *   passkey     none  — needs WebAuthn on both sides
 *   payoutLock  mock  — deliberately left as-is for now
 *
 * `signinAlertsEnabled` comes from the API, so the list is built per render
 * rather than being a constant.
 */
export function buildProtections(
  signinAlertsEnabled: boolean,
): ProtectionItem[] {
  return [
    { key: "password", state: "on", toggleable: false, weight: 25 },
    { key: "totp", state: "unavailable", toggleable: false, weight: 30 },
    {
      key: "withdrawalLock",
      state: "on",
      updated_at: "2026-06-02T15:10:00+07:00",
      toggleable: false,
      weight: 20,
    },
    { key: "passkey", state: "unavailable", toggleable: false, weight: 15 },
    {
      key: "loginAlerts",
      state: signinAlertsEnabled ? "on" : "off",
      toggleable: true,
      weight: 10,
    },
  ];
}

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
