import { NextRequest, NextResponse } from "next/server";

// Routes that require a valid session cookie to access.
const PROTECTED_ROUTES = ["/dashboard", "/project-application"];

// Routes that should redirect based on whether the user already has projects.
const AUTH_ROUTES = ["/login", "/"];
const APPLICATION_ROUTE = "/project-application";
const DASHBOARD_ROUTE = "/dashboard";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type CurrentUser = {
  role?: string;
};

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
  const isInvestor = currentUser?.role === "INVESTOR";
  const projectCount =
    isAuthenticated && !isInvestor ? await getProjectCount(request) : null;
  const hasProjects = typeof projectCount === "number" ? projectCount > 0 : null;

  const authRedirectTarget = isInvestor
    ? DASHBOARD_ROUTE
    : hasProjects === false
      ? APPLICATION_ROUTE
      : DASHBOARD_ROUTE;

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

  // Block SME users from accessing /dashboard/projects
  if (
    isAuthenticated &&
    !isInvestor &&
    pathname.startsWith("/dashboard/projects")
  ) {
    return NextResponse.redirect(new URL(DASHBOARD_ROUTE, request.url));
  }

  // Users without projects should land on the application form instead of the dashboard.
  if (
    isAuthenticated &&
    !isInvestor &&
    hasProjects === false &&
    pathname.startsWith(DASHBOARD_ROUTE)
  ) {
    return NextResponse.redirect(new URL(APPLICATION_ROUTE, request.url));
  }

  // Users with projects should not stay on the application page.
  if (
    isAuthenticated &&
    (isInvestor || hasProjects === true) &&
    pathname.startsWith(APPLICATION_ROUTE)
  ) {
    return NextResponse.redirect(new URL(DASHBOARD_ROUTE, request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run middleware on these paths only — skip static files and API routes.
  matcher: ["/", "/login", "/dashboard/:path*", "/project-application", "/project-application/:path*"],
};
