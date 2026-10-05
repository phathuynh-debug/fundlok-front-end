import { NextRequest } from "next/server";
import { backendSecretHeaders } from "@/lib/backend-secret";

// Same fallback as the /api rewrite in next.config.ts — without it, every
// server-side lookup here throws on new URL(..., undefined) and the proxy
// routes blind (currentUser null for everyone).
const API_BASE_URL = process.env.API_URL || "http://127.0.0.1:8000";

export type CurrentUser = {
  role?: string;
  email_verified?: boolean;
};

type MaintenanceFlag = { enabled?: boolean } | null;

// The maintenance flag is global — same answer for every visitor — so it's
// cached in module scope rather than re-fetched per request.
//
// Without this the proxy hit GET /system/maintenance on every request to
// /login, including the RSC prefetches Next fires when those links merely
// scroll into view on a public page. That produced a continuous
// stream of requests against the API for a value that changes maybe twice a
// year. Prefetches can't be filtered out instead: Next strips `rsc`,
// `next-router-state-tree` and `next-router-prefetch` from `request.headers`
// in Proxy by design, so a prefetch is indistinguishable from a real
// navigation there.
//
// TTL matches the backend's own maintenance cache (app/system/service.py,
// _MAINT_TTL_SECONDS = 5), so toggling maintenance still takes effect within
// seconds — the ceiling on staleness is the sum of the two, not minutes.
const MAINTENANCE_TTL_MS = 5_000;

let maintenanceCache: { value: MaintenanceFlag; expiresAt: number } | null =
  null;
// Concurrent proxy invocations share one in-flight request instead of each
// starting its own — a burst of prefetches collapses to a single call.
let maintenanceInFlight: Promise<MaintenanceFlag> | null = null;

async function fetchMaintenance(): Promise<MaintenanceFlag> {
  try {
    const response = await fetch(new URL("/system/maintenance", API_BASE_URL), {
      // Server-to-server hop, so it needs the shared secret like every other
      // Next → FastAPI call. These three bypass the /api rewrite entirely.
      headers: { ...backendSecretHeaders() },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as { enabled?: boolean };
  } catch {
    return null;
  }
}

/** The backend rejected this session because the account is suspended. */
export const SUSPENDED = "SUSPENDED" as const;

export const middlewareService = {
  // Reads the platform maintenance flag from the public maintenance endpoint
  // (GET /system/maintenance — readable without auth so the gate can apply to
  // anonymous visitors). Fails open (returns null) on any error so a backend
  // hiccup never locks the whole site out.
  //
  // Only the auth entry point (/login, which also serves sign-up at
  // ?mode=register) and /maintenance itself call this — public pages are never
  // gated, so they never trigger a lookup.
  async getMaintenance(): Promise<MaintenanceFlag> {
    const now = Date.now();

    if (maintenanceCache && maintenanceCache.expiresAt > now) {
      return maintenanceCache.value;
    }
    if (maintenanceInFlight) {
      return maintenanceInFlight;
    }

    maintenanceInFlight = fetchMaintenance()
      .then((value) => {
        // A failed lookup is cached too, for the same short window: when the
        // API is down, failing open on every single request would hammer it
        // while it's trying to recover.
        maintenanceCache = {
          value,
          expiresAt: Date.now() + MAINTENANCE_TTL_MS,
        };
        return value;
      })
      .finally(() => {
        maintenanceInFlight = null;
      });

    return maintenanceInFlight;
  },

  // Returns the currently authenticated user
  /**
   * Resolve the session.
   *
   * Returns the sentinel `SUSPENDED` rather than null when the backend rejects
   * the account as suspended. Collapsing that into null would route a
   * suspended user to /login, where their password is correct but sign-in is
   * refused — a loop with no explanation. The proxy needs to tell the two
   * apart to send them somewhere that says what happened.
   */
  async getCurrentUser(
    request: NextRequest,
  ): Promise<CurrentUser | typeof SUSPENDED | null> {
    const accessToken = request.cookies.get("access_token")?.value;

    if (!accessToken) {
      return null;
    }

    try {
      const response = await fetch(new URL("/users/me", API_BASE_URL), {
        headers: {
          cookie: request.headers.get("cookie") ?? "",
          ...backendSecretHeaders(),
        },
        cache: "no-store",
      });

      if (!response.ok) {
        // 403 alone is not enough — an unverified email answers 403 too on
        // some routes. Match the backend's own detail so only a suspension
        // takes this branch, and fall back to "no session" otherwise.
        if (response.status === 403) {
          const detail = await response
            .clone()
            .json()
            .then((body) => String(body?.detail ?? ""))
            .catch(() => "");
          if (detail.toLowerCase().includes("suspended")) {
            return SUSPENDED;
          }
        }
        return null;
      }

      return (await response.json()) as CurrentUser;
    } catch {
      return null;
    }
  },

  // Reads whether the user's verification is approved — both roles via
  // GVerify now: investors /gverify/kyc/status, SMEs /gverify/kyb/status
  // (calling the wrong one 403s). 404 means they never started. Fails closed
  // (false) on any error — the gate must not be bypassable, and a backend
  // outage already breaks the app anyway.
  async getVerificationApproved(
    request: NextRequest,
    role?: string,
  ): Promise<boolean> {
    const statusPath =
      role === "SME" ? "/gverify/kyb/status" : "/gverify/kyc/status";
    try {
      const response = await fetch(new URL(statusPath, API_BASE_URL), {
        headers: {
          cookie: request.headers.get("cookie") ?? "",
          ...backendSecretHeaders(),
        },
        cache: "no-store",
      });

      if (!response.ok) {
        return false;
      }

      const data = (await response.json()) as { is_approved?: boolean };
      return data?.is_approved === true;
    } catch {
      return false;
    }
  },
};
