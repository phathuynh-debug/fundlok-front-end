import { NextRequest, NextResponse } from "next/server";

// Routes that require a valid session cookie to access.
const PROTECTED_ROUTES = ["/dashboard", "/project-application", "/admin"];

// Routes that should redirect based on whether the user already has projects.
const AUTH_ROUTES = ["/login", "/"];
const APPLICATION_ROUTE = "/project-application";
const DASHBOARD_ROUTE = "/dashboard";
const ADMIN_ROUTE = "/admin";
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

  const projectCount =
    isAuthenticated && !isInvestor && !canAccessAdmin
      ? await getProjectCount(request)
      : null;
  const hasProjects = typeof projectCount === "number" ? projectCount > 0 : null;

  const authRedirectTarget = canAccessAdmin
    ? ADMIN_ROUTE
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
    "/verify-email",
    "/maintenance",
  ],
};
