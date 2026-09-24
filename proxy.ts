import { NextRequest, NextResponse } from "next/server";
import { SUSPENDED, middlewareService } from "@/services/middleware.service";
import { applyBackendSecret } from "@/lib/backend-secret";

// Same default as next.config.ts and middleware.service.ts. Kept in step with
// both: they all describe one hop, Next → FastAPI.
const API_ORIGIN = process.env.API_URL || "http://127.0.0.1:8000";

// Routes that require a valid session cookie to access.
const PROTECTED_ROUTES = [
  "/dashboard",
  "/project-application",
  "/admin",
  "/select-role",
  "/kyc",
];

// Routes that should redirect based on whether the user already has projects.
// `/login` covers sign-up too (?mode=register); /register was removed and now
// 308s here from next.config.
const AUTH_ROUTES = ["/login", "/"];
const APPLICATION_ROUTE = "/project-application";
const DASHBOARD_ROUTE = "/dashboard";
const ADMIN_ROUTE = "/admin";
// Where users without a role pick one (SME / Investor) before continuing.
const SELECT_ROLE_ROUTE = "/select-role";
// On-demand identity/business verification screen. No longer a blanket entry
// gate — reached only when a user hits a verification-gated action route.
const KYC_ROUTE = "/kyc";
// Frontend system-settings page (distinct from the backend /system API prefix).
const SYSTEM_SETTINGS_ROUTE = "/admin/system";
const MAINTENANCE_ROUTE = "/maintenance";
// Where a suspended account lands. Reachable ONLY while suspended — see the
// gate below.
const SUSPENDED_ROUTE = "/suspended";
// During maintenance only the auth entry points are blocked — public pages and
// the rest of the site stay accessible.
const MAINTENANCE_BLOCKED_ROUTES = ["/login"];

// --- On-demand verification gates ---
// KYC/KYB is NOT a blanket gate after login anymore. Users register, pick a
// role, and browse freely. Verification is only demanded when a user takes a
// value action that legally requires it:
//   INVESTOR invests  → KYC  (the mock /dashboard/invest route)
//   SME asks for fund → KYB  (/project-application)
// Hitting one of these routes unverified sends the user to /kyc?next=<route>,
// and they're returned to the action once approved.
const INVESTOR_KYC_ROUTES = ["/dashboard/invest"];
const SME_KYB_ROUTES = [APPLICATION_ROUTE];

// --- Local-development bypass for the verification gates ---
// The KYB/KYC flows call the GVerify partner API, and app/gverify/client.py
// raises as soon as GVERIFY_BASE_URL / GVERIFY_API_KEY / GVERIFY_PARTNER_CODE
// are unset — so with no partner credentials the screen cannot be passed at
// all locally, which strands SMEs before /project-application.
//
// Two deliberate constraints:
//   * Server-only variable, NOT NEXT_PUBLIC_ — proxy.ts runs on the server, so
//     keeping it off the client bundle means it can never be flipped from the
//     browser.
//   * Hard-guarded on NODE_ENV. These gates enforce a Decree 94 obligation, so
//     a bypass that could be switched on in production would be a real
//     vulnerability rather than a convenience.
//
// This skips the ROUTE GATE only. It does not approve anyone: /gverify/kyb
// still reports the user as unverified, and any backend check stays in force.
const SKIP_VERIFICATION_GATES =
  process.env.NODE_ENV !== "production" &&
  process.env.SKIP_VERIFICATION_GATES === "true";

if (SKIP_VERIFICATION_GATES) {
  console.warn(
    "[proxy] SKIP_VERIFICATION_GATES is on — KYC/KYB route gates are bypassed. " +
      "Local development only; this is inert when NODE_ENV=production.",
  );
}

// The verification kind a route requires for a given role, or null if the route
// is ungated for that role. Matches the exact path and any nested sub-path.
function requiredVerificationForPath(
  pathname: string,
  role?: string,
): "KYC" | "KYB" | null {
  // Returning null here also skips the /gverify/*/status fetch below, since
  // nothing on this request depends on the answer.
  if (SKIP_VERIFICATION_GATES) return null;

  const matches = (routes: string[]) =>
    routes.some((r) => pathname === r || pathname.startsWith(`${r}/`));
  if (role === "INVESTOR" && matches(INVESTOR_KYC_ROUTES)) return "KYC";
  if (role === "SME" && matches(SME_KYB_ROUTES)) return "KYB";
  return null;
}

// Only accept same-origin absolute paths as a post-verification redirect target,
// so a crafted ?next= can't turn /kyc into an open redirect.
function safeNextPath(next: string | null): string | null {
  if (
    !next ||
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.startsWith("/\\")
  ) {
    return null;
  }
  try {
    const parsed = new URL(next, "http://localhost");
    if (
      parsed.origin === "http://localhost" &&
      parsed.pathname.startsWith("/")
    ) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    return null;
  } catch {
    return null;
  }
}

// Paths whose auth/role rules are handled below. The matcher only runs
// middleware on these app routes plus the maintenance-relevant ones.
function isHandledRoute(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/verify-email" ||
    pathname === SELECT_ROLE_ROUTE ||
    pathname === SUSPENDED_ROUTE ||
    pathname.startsWith(KYC_ROUTE) ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/project-application") ||
    pathname.startsWith("/admin")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- /api/* → FastAPI, stamped with the shared secret --------------------
  //
  // This rewrite duplicates the one in next.config.ts because a config rewrite
  // CANNOT add a request header to its destination — `headers()` sets response
  // headers, and `rewrites()` takes `has`/`missing` conditions but nothing that
  // injects one. Doing the rewrite here is the only way to put
  // X-Backend-Secret on browser-originated API traffic without exposing the
  // secret to the browser.
  //
  // MUST stay the first thing in this function: everything below calls the
  // backend to resolve the session, and letting an /api request fall through to
  // that would have the proxy fetch through itself.
  //
  // The next.config.ts rewrite is deliberately left in place as a fallback. If
  // this branch ever stops matching, API calls still reach the backend but
  // without the header — Cloudflare then rejects them loudly, which is a far
  // better failure than every request 404ing.
  if (pathname.startsWith("/api/")) {
    const target = new URL(
      pathname.slice("/api".length) + request.nextUrl.search,
      API_ORIGIN,
    );
    return NextResponse.rewrite(target, {
      request: { headers: applyBackendSecret(new Headers(request.headers)) },
    });
  }

  // Phone side of the KYC QR handoff. Opened by scanning a QR on another
  // device, so there is no session cookie here — auth is the short-lived
  // handoff token in the query string, validated by the backend on submit.
  // Must bypass every session-based gate (login redirect, KYC gate, …).
  if (pathname.startsWith("/kyc/mobile")) {
    return NextResponse.next();
  }
  const accessToken = request.cookies.get("access_token")?.value;
  const isAuthenticated = !!accessToken;
  const session = isAuthenticated
    ? await middlewareService.getCurrentUser(request)
    : null;

  // A suspended account holds a valid cookie but the backend refuses it. Sent
  // to /login it would loop: the password is right, sign-in is refused, and
  // nothing says why. /suspended is the one page that explains it, so this
  // gate runs before every other redirect below.
  const isSuspendedSession = session === SUSPENDED;
  if (isSuspendedSession && pathname !== SUSPENDED_ROUTE) {
    return NextResponse.redirect(new URL(SUSPENDED_ROUTE, request.url));
  }
  // Nobody else has any business on that page.
  if (!isSuspendedSession && pathname === SUSPENDED_ROUTE) {
    return NextResponse.redirect(
      new URL(isAuthenticated ? "/dashboard" : "/login", request.url),
    );
  }

  const currentUser = session === SUSPENDED ? null : session;

  // A cookie the backend will not honour is NOT a session.
  //
  // `isAuthenticated` only means "an access_token cookie exists". Once that
  // token expires the cookie is still there, but /users/me 401s and
  // currentUser is null — and every role gate below then reads the user as
  // having no role. An admin refreshing /admin was bounced to /select-role by
  // the admin gate, because authRedirectTarget computes to SELECT_ROLE_ROUTE
  // when there is no role to redirect on. That is the "it asks me to choose a
  // role again" report: not a lost role, a lost session being mistaken for
  // one.
  //
  // Treat it as signed out and say so, keeping ?from= so the user returns to
  // where they were once they sign in again.
  // `!isSuspendedSession` matters: a suspended session also has a null
  // currentUser, and without this it would be bounced to /login — the exact
  // unexplained loop /suspended exists to prevent.
  if (
    isAuthenticated &&
    !currentUser &&
    !isSuspendedSession &&
    isHandledRoute(pathname)
  ) {
    const isPublicEntry =
      AUTH_ROUTES.some((route) => pathname === route) ||
      pathname === "/verify-email";
    if (!isPublicEntry) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      const response = NextResponse.redirect(loginUrl);
      // Clear the stale pair so the next request is cleanly anonymous rather
      // than repeating this round trip to the backend.
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");
      return response;
    }
  }
  const isSystemAdmin = currentUser?.role === "SYSTEM_ADMIN";
  const isAdmin = currentUser?.role === "ADMIN";
  // Both ADMIN and SYSTEM_ADMIN may enter the /admin area (mirrors require_admin).
  const canAccessAdmin = isAdmin || isSystemAdmin;
  const isInvestor = currentUser?.role === "INVESTOR";
  // Authenticated users with no role yet must pick one on the select-role page.
  const hasRole = !!currentUser?.role;

  // --- Maintenance gate ---
  // During maintenance only the auth entry point (/login, which also serves
  // sign-up at ?mode=register) is blocked; public pages stay fully accessible.
  // System admins are never blocked.
  //
  // Scope is deliberate and load-bearing: the flag is only READ on that route
  // and /maintenance itself. The public marketing pages (/why-us, /faq,
  // /contact, …) aren't in the matcher at all, and `/` is matched but never
  // reaches this branch — so browsing the site costs zero maintenance lookups.
  // The lookup itself is cached in middleware.service.ts; see the note there
  // for why prefetches can't simply be skipped instead.
  const isMaintenancePage = pathname === MAINTENANCE_ROUTE;
  const isBlockedDuringMaintenance = MAINTENANCE_BLOCKED_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );
  if (isMaintenancePage || isBlockedDuringMaintenance) {
    const maintenance = await middlewareService.getMaintenance();
    const maintenanceOn = !!maintenance?.enabled;

    if (maintenanceOn && isBlockedDuringMaintenance && !isSystemAdmin) {
      return NextResponse.redirect(new URL(MAINTENANCE_ROUTE, request.url));
    }

    // Don't strand anyone on the maintenance page once it's lifted.
    if (!maintenanceOn && isMaintenancePage) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Anything outside the auth/role-managed set just passes through.
  if (!isHandledRoute(pathname)) {
    return NextResponse.next();
  }

  // Verification is now on-demand, not a login gate. Fetch approval only when it
  // can actually matter this request — on a verification-gated route, or on
  // /kyc itself — so the common path stays at a single /users/me call. Admins
  // are backend-managed and never verify.
  const requiredKind = requiredVerificationForPath(pathname, currentUser?.role);
  const onKycRoute = pathname.startsWith(KYC_ROUTE);
  const shouldCheckApproval =
    isAuthenticated &&
    !!currentUser &&
    hasRole &&
    !canAccessAdmin &&
    (requiredKind !== null || onKycRoute);
  // null = not looked up / unreadable; only a definite `false` blocks a route
  // and only a definite `true` releases /kyc, so a backend hiccup can't loop.
  const isApproved = shouldCheckApproval
    ? await middlewareService.getVerificationApproved(
        request,
        currentUser?.role,
      )
    : null;

  // Post-login landing no longer depends on KYC or project count — users land on
  // their normal home and are routed to verification only by the action gate.
  const authRedirectTarget = canAccessAdmin
    ? ADMIN_ROUTE
    : !hasRole
      ? SELECT_ROLE_ROUTE
      : DASHBOARD_ROUTE;

  // Where to send the user out of /kyc: back to the action they were attempting
  // (?next=), else their normal landing.
  const postKycTarget =
    safeNextPath(request.nextUrl.searchParams.get("next")) ??
    authRedirectTarget;

  // Redirect unauthenticated users away from /verify-email to login — unless
  // they arrived on the emailed link, which carries its own credential in
  // ?token= and is opened from a mail client with no session cookie (same
  // shape as the /kyc/mobile handoff above). Redirecting those to /login threw
  // the token away, so the first verification email appeared to do nothing and
  // only a resend — clicked while already logged in — could verify an account.
  const hasVerificationToken = !!request.nextUrl.searchParams.get("token");
  if (
    !isAuthenticated &&
    pathname === "/verify-email" &&
    !hasVerificationToken
  ) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated & verified users away from /verify-email.
  if (
    isAuthenticated &&
    currentUser &&
    currentUser.email_verified === true &&
    pathname === "/verify-email"
  ) {
    return NextResponse.redirect(new URL(authRedirectTarget, request.url));
  }

  // Redirect authenticated but unverified users to /verify-email.
  if (
    isAuthenticated &&
    currentUser &&
    currentUser.email_verified === false &&
    pathname !== "/verify-email"
  ) {
    return NextResponse.redirect(new URL("/verify-email", request.url));
  }

  // Send authenticated users without a role to the select-role screen — but
  // only once their email is verified, so this never fights the verify-email
  // gate above (an unverified roleless user stays on /verify-email).
  if (
    isAuthenticated &&
    currentUser &&
    !hasRole &&
    currentUser.email_verified !== false &&
    pathname !== SELECT_ROLE_ROUTE &&
    pathname !== "/verify-email"
  ) {
    return NextResponse.redirect(new URL(SELECT_ROLE_ROUTE, request.url));
  }

  // Users who already have a role shouldn't sit on the select-role screen.
  if (isAuthenticated && hasRole && pathname === SELECT_ROLE_ROUTE) {
    return NextResponse.redirect(new URL(authRedirectTarget, request.url));
  }

  // Action gate: an unverified user attempting a gated action (investor →
  // invest, SME → apply for funding) is sent to /kyc, remembering where they
  // were headed so approval returns them there. Only a definite `false` blocks.
  if (requiredKind !== null && isApproved === false) {
    const kycUrl = new URL(KYC_ROUTE, request.url);
    kycUrl.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(kycUrl);
  }

  // Don't strand a user on /kyc when there's nothing to verify: admins never
  // verify, and an already-approved user is sent on to their intended action
  // (?next=) or landing. A verifying role with an unreadable status
  // (isApproved === null) is left on /kyc so a backend hiccup can't loop them.
  if (onKycRoute && (canAccessAdmin || isApproved === true)) {
    return NextResponse.redirect(new URL(postKycTarget, request.url));
  }

  // Redirect authenticated users away from auth pages to their landing page.
  if (isAuthenticated && AUTH_ROUTES.some((r) => pathname === r)) {
    return NextResponse.redirect(new URL(authRedirectTarget, request.url));
  }

  // Redirect unauthenticated users away from protected pages to login.
  if (
    !isAuthenticated &&
    PROTECTED_ROUTES.some((r) => pathname.startsWith(r))
  ) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Restrict /admin to admin-capable roles — send everyone else to their landing page.
  if (isAuthenticated && !canAccessAdmin && pathname.startsWith(ADMIN_ROUTE)) {
    return NextResponse.redirect(new URL(authRedirectTarget, request.url));
  }

  // Restrict /admin/system to SYSTEM_ADMIN — regular admins go back to /admin.
  if (
    isAuthenticated &&
    !isSystemAdmin &&
    pathname.startsWith(SYSTEM_SETTINGS_ROUTE)
  ) {
    return NextResponse.redirect(new URL(ADMIN_ROUTE, request.url));
  }

  // Block SME users from accessing /dashboard/projects
  if (
    isAuthenticated &&
    !isInvestor &&
    !canAccessAdmin &&
    pathname.startsWith("/dashboard/projects")
  ) {
    return NextResponse.redirect(new URL(DASHBOARD_ROUTE, request.url));
  }

  // Note: SME project-based routing (no-project SMEs see a dashboard empty
  // state; SMEs who already have a project are kept off /project-application)
  // is handled client-side now — the dashboard and application pages redirect
  // themselves. The middleware no longer counts projects.

  return NextResponse.next();
}

export const config = {
  // Run only on app routes + the maintenance-relevant ones. Public marketing
  // pages (/faq, /why-us, /contact, …) are intentionally absent so maintenance
  // never blocks them.
  matcher: [
    // Every backend call the browser makes. Listed first because without it the
    // /api branch above never runs and the secret is never attached — the
    // failure would be silent, since next.config.ts still proxies the traffic.
    "/api/:path*",
    "/",
    "/login",
    "/dashboard/:path*",
    "/project-application",
    "/project-application/:path*",
    "/admin",
    "/admin/:path*",
    "/select-role",
    "/kyc",
    "/kyc/:path*",
    "/suspended",
    "/verify-email",
    "/maintenance",
  ],
};
