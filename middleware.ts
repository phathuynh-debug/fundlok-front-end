import { NextRequest, NextResponse } from "next/server";

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
// Identity verification gate; users must be KYC-approved before the app.
const KYC_ROUTE = "/kyc";
// Frontend system-settings page (distinct from the backend /system API prefix).
const SYSTEM_SETTINGS_ROUTE = "/admin/system";
const MAINTENANCE_ROUTE = "/maintenance";
// During maintenance only the auth entry points are blocked — public pages and
// the rest of the site stay accessible.
const MAINTENANCE_BLOCKED_ROUTES = ["/login", "/register"];

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type CurrentUser = {
  role?: string;
  email_verified?: boolean;
};

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

// Reads the platform maintenance flag from the public maintenance endpoint
// (GET /system/maintenance — readable without auth so the gate can apply to
// anonymous visitors). Fails open (returns null) on any error so a backend
// hiccup never locks the whole site out.
async function getMaintenance() {
  try {
    const response = await fetch(new URL("/system/maintenance", API_BASE_URL), {
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

async function getCurrentUser(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    return null;
  }

  try {
    const response = await fetch(new URL("/users/me", API_BASE_URL), {
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as CurrentUser;
  } catch {
    return null;
  }
}

async function getProjectCount(request: NextRequest) {
  try {
    const response = await fetch(new URL("/projects", API_BASE_URL), {
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as
      | unknown[]
      | { content?: unknown[]; data?: unknown[] };

    if (Array.isArray(data)) {
      return data.length;
    }

    const payload = data as { content?: unknown[]; data?: unknown[] };

    if (Array.isArray(payload.content)) {
      return payload.content.length;
    }

    if (Array.isArray(payload.data)) {
      return payload.data.length;
    }

    return null;
  } catch {
    return null;
  }
}

// Reads whether the user's KYC is approved (GET /kyc/status → is_approved).
// 404 means they never started KYC. Fails closed (false) on any error — the gate
// must not be bypassable, and a backend outage already breaks the app anyway.
async function getKycApproved(request: NextRequest) {
  try {
    const response = await fetch(new URL("/kyc/status", API_BASE_URL), {
      headers: { cookie: request.headers.get("cookie") ?? "" },
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
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("access_token")?.value;
  const isAuthenticated = !!accessToken;
  const currentUser = isAuthenticated ? await getCurrentUser(request) : null;
  const isSystemAdmin = currentUser?.role === "SYSTEM_ADMIN";
  const isAdmin = currentUser?.role === "ADMIN";
  // Both ADMIN and SYSTEM_ADMIN may enter the /admin area (mirrors require_admin).
  const canAccessAdmin = isAdmin || isSystemAdmin;
  const isInvestor = currentUser?.role === "INVESTOR";
  const isSme = currentUser?.role === "SME";
  // Authenticated users with no role yet must pick one on the select-role page.
  const hasRole = !!currentUser?.role;

  // --- Maintenance gate ---
  // During maintenance only the auth entry points (login/register) are blocked;
  // public pages stay fully accessible. System admins are never blocked.
  const isMaintenancePage = pathname === MAINTENANCE_ROUTE;
  const isBlockedDuringMaintenance = MAINTENANCE_BLOCKED_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );
  if (isMaintenancePage || isBlockedDuringMaintenance) {
    const maintenance = await getMaintenance();
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

  // KYC is required once a (non-admin) user has a verified email and a role.
  // Admins are backend-managed and skip it. Only fetch the status when it could
  // actually apply, to avoid an extra request on every other route.
  const needsKyc =
    isAuthenticated &&
    !!currentUser &&
    currentUser.email_verified !== false &&
    hasRole &&
    !canAccessAdmin;
  const kycApproved = needsKyc ? await getKycApproved(request) : true;

  // Only SMEs are routed by project count, and only once they're past KYC —
  // skip the lookup for everyone else (investors, admins, no-role, pre-KYC).
  const projectCount = isSme && kycApproved ? await getProjectCount(request) : null;
  const hasProjects = typeof projectCount === "number" ? projectCount > 0 : null;

  const authRedirectTarget = canAccessAdmin
    ? ADMIN_ROUTE
    : !hasRole
      ? SELECT_ROLE_ROUTE
      : !kycApproved
        ? KYC_ROUTE
        : isInvestor
          ? DASHBOARD_ROUTE
          : hasProjects === false
            ? APPLICATION_ROUTE
            : DASHBOARD_ROUTE;

  // Redirect unauthenticated users away from /verify-email to login.
  if (!isAuthenticated && pathname === "/verify-email") {
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

  // KYC gate: a role-having, non-admin user must be verified before entering
  // the app. Keep them on the KYC pages until approved. (Runs after the
  // verify-email and role gates, so by here they're verified and have a role.)
  if (
    isAuthenticated &&
    hasRole &&
    !canAccessAdmin &&
    !kycApproved &&
    !pathname.startsWith(KYC_ROUTE)
  ) {
    return NextResponse.redirect(new URL(KYC_ROUTE, request.url));
  }

  // Approved users (and admins) shouldn't linger on the KYC pages.
  if (
    isAuthenticated &&
    (kycApproved || canAccessAdmin) &&
    pathname.startsWith(KYC_ROUTE)
  ) {
    return NextResponse.redirect(new URL(authRedirectTarget, request.url));
  }

  // Redirect authenticated users away from auth pages to their landing page.
  if (isAuthenticated && AUTH_ROUTES.some((r) => pathname === r)) {
    return NextResponse.redirect(new URL(authRedirectTarget, request.url));
  }

  // Redirect unauthenticated users away from protected pages to login.
  if (!isAuthenticated && PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
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

  // Users without projects should land on the application form instead of the dashboard.
  if (
    isAuthenticated &&
    !isInvestor &&
    !canAccessAdmin &&
    hasProjects === false &&
    pathname.startsWith(DASHBOARD_ROUTE)
  ) {
    return NextResponse.redirect(new URL(APPLICATION_ROUTE, request.url));
  }

  // Users with projects (and admins) should not stay on the application page.
  if (
    isAuthenticated &&
    (canAccessAdmin || isInvestor || hasProjects === true) &&
    pathname.startsWith(APPLICATION_ROUTE)
  ) {
    return NextResponse.redirect(new URL(authRedirectTarget, request.url));
  }

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
