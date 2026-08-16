import { NextRequest, NextResponse } from "next/server";
import { middlewareService } from "@/services/middleware.service";

// Routes that require a valid session cookie to access.
const PROTECTED_ROUTES = [
  "/dashboard",
  "/project-application",
  "/admin",
  "/select-role",
  "/kyc",
];

// Routes that should redirect based on whether the user already has projects.
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
// During maintenance only the auth entry points are blocked — public pages and
// the rest of the site stay accessible.
const MAINTENANCE_BLOCKED_ROUTES = ["/login", "/register"];

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

// The verification kind a route requires for a given role, or null if the route
// is ungated for that role. Matches the exact path and any nested sub-path.
function requiredVerificationForPath(
  pathname: string,
  role?: string,
): "KYC" | "KYB" | null {
  const matches = (routes: string[]) =>
    routes.some((r) => pathname === r || pathname.startsWith(`${r}/`));
  if (role === "INVESTOR" && matches(INVESTOR_KYC_ROUTES)) return "KYC";
  if (role === "SME" && matches(SME_KYB_ROUTES)) return "KYB";
  return null;
}

// Only accept same-origin absolute paths as a post-verification redirect target,
// so a crafted ?next= can't turn /kyc into an open redirect.
function safeNextPath(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

// Paths whose auth/role rules are handled below. The matcher only runs
// middleware on these app routes plus the maintenance-relevant ones.
function isHandledRoute(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/verify-email" ||
    pathname === SELECT_ROLE_ROUTE ||
    pathname.startsWith(KYC_ROUTE) ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/project-application") ||
    pathname.startsWith("/admin")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Phone side of the KYC QR handoff. Opened by scanning a QR on another
  // device, so there is no session cookie here — auth is the short-lived
  // handoff token in the query string, validated by the backend on submit.
  // Must bypass every session-based gate (login redirect, KYC gate, …).
  if (pathname.startsWith("/kyc/mobile")) {
    return NextResponse.next();
  }
  const accessToken = request.cookies.get("access_token")?.value;
  const isAuthenticated = !!accessToken;
  const currentUser = isAuthenticated
    ? await middlewareService.getCurrentUser(request)
    : null;
  const isSystemAdmin = currentUser?.role === "SYSTEM_ADMIN";
  const isAdmin = currentUser?.role === "ADMIN";
  // Both ADMIN and SYSTEM_ADMIN may enter the /admin area (mirrors require_admin).
  const canAccessAdmin = isAdmin || isSystemAdmin;
  const isInvestor = currentUser?.role === "INVESTOR";
  // Authenticated users with no role yet must pick one on the select-role page.
  const hasRole = !!currentUser?.role;

  // --- Maintenance gate ---
  // During maintenance only the auth entry points (login/register) are blocked;
  // public pages stay fully accessible. System admins are never blocked.
  //
  // Scope is deliberate and load-bearing: the flag is only READ on those two
  // routes and /maintenance itself. The public marketing pages (/why-us, /faq,
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
    "/",
    "/login",
    "/register",
    "/dashboard/:path*",
    "/project-application",
    "/project-application/:path*",
    "/admin",
    "/admin/:path*",
    "/select-role",
    "/kyc",
    "/kyc/:path*",
    "/verify-email",
    "/maintenance",
  ],
};
