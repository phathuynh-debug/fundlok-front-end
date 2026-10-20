import { NextRequest } from "next/server";
import { backendSecretHeaders } from "@/lib/backend-secret";
import { clientIpHeaders } from "@/lib/client-ip";

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

async function fetchMaintenance(
  request: NextRequest,
): Promise<MaintenanceFlag> {
  try {
    const response = await fetch(new URL("/system/maintenance", API_BASE_URL), {
      // Server-to-server hop, so it needs the shared secret like every other
      // Next → FastAPI call. These bypass the /api rewrite entirely, so each
      // one also states the visitor's address itself (lib/client-ip.ts).
      headers: {
        ...clientIpHeaders(request.headers),
        ...backendSecretHeaders(),
      },
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

type SessionLookupResult = CurrentUser | typeof SUSPENDED | null;

// Concurrent proxy invocations for the same cookie (e.g. a dashboard or admin
// page load plus its 6-8 sidebar <Link> RSC prefetches) share one in-flight
// request instead of each starting its own round trip to /users/me or
// /gverify/*/status.
const currentUserInFlight = new Map<string, Promise<SessionLookupResult>>();
const verificationInFlight = new Map<string, Promise<boolean>>();

/**
 * Checks whether a 3-part JWT's `exp` claim is already in the past.
 *
 * Returns false for non-JWT tokens (e.g. E2E stub tokens) or malformed strings
 * so they still delegate to the backend. Skipping an already-expired JWT saves
 * a guaranteed 401 round trip to /users/me before refreshSession runs.
 */
function isJwtExpired(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    const payload = JSON.parse(json) as { exp?: unknown };
    if (typeof payload.exp === "number") {
      return payload.exp * 1000 <= Date.now();
    }
    return false;
  } catch {
    return false;
  }
}

export const middlewareService = {
  // Reads the platform maintenance flag from the public maintenance endpoint
  // (GET /system/maintenance — readable without auth so the gate can apply to
  // anonymous visitors). Fails open (returns null) on any error so a backend
  // hiccup never locks the whole site out.
  //
  // Only the auth entry point (/login, which also serves sign-up at
  // ?mode=register) and /maintenance itself call this — public pages are never
  // gated, so they never trigger a lookup.
  //
  // The flag is shared, but the call is not anonymous: it is counted against
  // the visitor whose page load found the cache empty. Without an address it
  // would be counted against Vercel's, shared by every visitor.
  async getMaintenance(request: NextRequest): Promise<MaintenanceFlag> {
    const now = Date.now();

    if (maintenanceCache && maintenanceCache.expiresAt > now) {
      return maintenanceCache.value;
    }
    if (maintenanceInFlight) {
      return maintenanceInFlight;
    }

    maintenanceInFlight = fetchMaintenance(request)
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
  async getCurrentUser(request: NextRequest): Promise<SessionLookupResult> {
    const accessToken = request.cookies.get("access_token")?.value;

    if (!accessToken || isJwtExpired(accessToken)) {
      return null;
    }

    const cookieHeader = request.headers.get("cookie") ?? accessToken;
    const inflightKey = `${accessToken}:${cookieHeader}`;
    const existing = currentUserInFlight.get(inflightKey);
    if (existing) {
      return existing;
    }

    const lookup = (async (): Promise<SessionLookupResult> => {
      try {
        const response = await fetch(new URL("/users/me", API_BASE_URL), {
          headers: {
            cookie: request.headers.get("cookie") ?? "",
            ...clientIpHeaders(request.headers),
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
    })().finally(() => {
      currentUserInFlight.delete(inflightKey);
    });

    currentUserInFlight.set(inflightKey, lookup);
    return lookup;
  },

  /**
   * Trade the refresh cookie for a new token pair, server-side.
   *
   * Returns the backend's Set-Cookie lines verbatim, or null when it refused.
   * Verbatim matters: the backend alone decides whether the new cookies are
   * persistent (remember me) or session-scoped, from its `remember_session`
   * marker, and re-deriving that here would let the two drift apart.
   *
   * The browser's User-Agent and address go along because the backend
   * records them on the session row at every rotation — without them, a
   * refresh made here would relabel the user's device on the security screen
   * as this server, at this server's address. The address is X-Client-IP, as
   * on every other call; X-Forwarded-For is still forwarded unchanged for a
   * backend without the secret, so its TRUSTED_PROXY_HOPS rule reads this
   * path the same way as the /api rewrite.
   */
  async refreshSession(request: NextRequest): Promise<string[] | null> {
    const forwarded: Record<string, string> = {};
    for (const name of ["user-agent", "x-forwarded-for"]) {
      const value = request.headers.get(name);
      if (value) forwarded[name] = value;
    }

    try {
      const response = await fetch(new URL("/auth/refresh", API_BASE_URL), {
        method: "POST",
        headers: {
          cookie: request.headers.get("cookie") ?? "",
          ...forwarded,
          ...clientIpHeaders(request.headers),
          ...backendSecretHeaders(),
        },
        cache: "no-store",
      });

      if (!response.ok) {
        return null;
      }

      return response.headers.getSetCookie();
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
    const cookieHeader = request.headers.get("cookie") ?? "";
    const inflightKey = `${role ?? ""}:${cookieHeader}`;
    const existing = verificationInFlight.get(inflightKey);
    if (existing) {
      return existing;
    }

    const lookup = (async (): Promise<boolean> => {
      try {
        const response = await fetch(new URL(statusPath, API_BASE_URL), {
          headers: {
            cookie: cookieHeader,
            ...clientIpHeaders(request.headers),
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
    })().finally(() => {
      verificationInFlight.delete(inflightKey);
    });

    verificationInFlight.set(inflightKey, lookup);
    return lookup;
  },
};
