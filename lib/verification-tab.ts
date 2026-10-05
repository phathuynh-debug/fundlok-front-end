import { safeNextPath } from "./safe-next-path";

// Verification (KYC/KYB) in its own tab.
//
// A gated action (Invest, Apply for funding) opens /kyc in a NEW tab instead of
// navigating away from the page the user was on. When that tab reaches an
// approval it tells the original tab, which then goes to the action's page;
// the verification tab closes itself.
//
// The two tabs talk over a same-origin BroadcastChannel, scoped by a random id
// carried in the verification tab's URL, so a second open tab (or a second
// verification in flight) never reacts to someone else's message. The
// original tab acknowledges; without an ack the verification tab assumes the
// original is gone and simply redirects itself, as it always used to.

export const VERIFICATION_CHANNEL = "fundlok-verification";

// Query parameter carrying the tab id on /kyc.
export const VERIFICATION_TAB_PARAM = "vtab";

export type VerificationMessage =
  { type: "verified"; id: string; next: string } | { type: "ack"; id: string };

const TAB_ID_RE = /^[a-z0-9-]{8,64}$/i;

export function isVerificationTabId(value: unknown): value is string {
  return typeof value === "string" && TAB_ID_RE.test(value);
}

export function newVerificationTabId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** The /kyc URL for a gated destination, optionally in tab mode. */
export function verificationUrl(next: string, tabId?: string): string {
  const params = new URLSearchParams({ next });
  if (tabId) params.set(VERIFICATION_TAB_PARAM, tabId);
  return `/kyc?${params.toString()}`;
}

/** A channel, or null where BroadcastChannel is unavailable. */
export function openVerificationChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  try {
    return new BroadcastChannel(VERIFICATION_CHANNEL);
  } catch {
    return null;
  }
}

/**
 * Parse a message from the channel for this tab id. Anything malformed, for
 * another id, or with an off-site destination is ignored (null).
 */
export function readVerificationMessage(
  data: unknown,
  tabId: string,
): VerificationMessage | null {
  if (!data || typeof data !== "object") return null;
  const msg = data as Record<string, unknown>;
  if (msg.id !== tabId) return null;
  if (msg.type === "ack") return { type: "ack", id: tabId };
  if (msg.type === "verified") {
    const next = safeNextPath(typeof msg.next === "string" ? msg.next : null);
    return next ? { type: "verified", id: tabId, next } : null;
  }
  return null;
}
