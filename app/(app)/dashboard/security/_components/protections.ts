// Protection rows for the security screen (/dashboard/security and
// /admin/security, which share one component).
//
// Every row reflects real backend state: /auth/sessions reads refresh_tokens,
// /auth/security-events reads audit_logs, and password, sign-in alerts,
// two-factor auth and passkeys all have live endpoints (see
// hooks/use-authentication.ts). The payout-account lock was removed as out of
// scope — it had no backend and was rendered as a hardcoded fake "on" row,
// which the score then counted.
//
// `deriveScore` below is pure: pass it whatever the API returns.

/** A protection the account can have on or off. */
export type ProtectionState =
  | "on"
  | "off"
  | "recommended"
  // Rendered as a disabled row rather than a toggle: a switch that claims to
  // arm a protection and does nothing is worse than no switch, and a badge
  // reading "on" would be a straight lie.
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
 *   password    real — always set for a password account; the row opens the
 *                      change-password dialog
 *   loginAlerts real — users.signin_alerts_enabled, toggled through the API
 *   totp        real — users.totp_enabled, enrolled through /auth/2fa/*; the
 *                      row opens the setup or disable dialog
 *   passkey     real — webauthn_credentials via /auth/passkeys; the row opens
 *                      the manage dialog (add a device, remove one)
 *
 * `signinAlertsEnabled`, `totpEnabled` and `passkeyCount` all come from the
 * API, so the list is built per render rather than being a constant.
 */
export function buildProtections(
  signinAlertsEnabled: boolean,
  totpEnabled = false,
  passkeyCount = 0,
): ProtectionItem[] {
  return [
    { key: "password", state: "on", toggleable: false, weight: 25 },
    // users.totp_enabled via GET /auth/2fa. It used to be hardcoded
    // "unavailable" because there was no backend; there is one, so the row
    // reflects the account instead of the roadmap.
    {
      key: "totp",
      state: totpEnabled ? "on" : "off",
      toggleable: true,
      weight: 30,
    },
    // webauthn_credentials via GET /auth/passkeys. It was hardcoded
    // "unavailable" while there was no backend; there is one, so the row
    // reflects the account rather than the roadmap — the same path the 2FA
    // row took above.
    {
      key: "passkey",
      state: passkeyCount > 0 ? "on" : "off",
      toggleable: true,
      weight: 15,
    },
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
