/**
 * Stub FastAPI backend for the E2E suite.
 *
 * WHY THIS EXISTS
 * The frontend's auth model is httpOnly cookies proxied to a FastAPI backend,
 * and `proxy.ts` makes its own SERVER-SIDE fetches to /users/me,
 * /system/maintenance and the /gverify status endpoints before it will
 * render a gated page.
 * Playwright's `page.route()` can only intercept requests the BROWSER makes, so
 * it cannot fake those — meaning route gating is untestable with request
 * interception alone.
 *
 * Running the real backend in CI instead would mean Postgres, Alembic, R2,
 * SMTP and the Didit/GVerify partner APIs. So the suite points `API_URL` at
 * this process: a dependency-free HTTP server that answers the handful of
 * endpoints the frontend actually reads, keyed off the `access_token` cookie.
 *
 * WHAT IT IS NOT
 * Not a mock of backend BEHAVIOUR and not a contract test. It asserts nothing
 * about the real API. If an endpoint's shape changes, this file has to be
 * updated by hand — the same caveat as lib/constants/industries.ts mirroring
 * the grading YAML. It exists so the suite can test the FRONTEND: routing,
 * gating, rendering, i18n and layout.
 *
 * Run: bun e2e/stub-api/server.ts   (PORT defaults to 8100)
 */

import { createServer, type IncomingMessage, type ServerResponse } from "http";

import {
  STUB_PASSWORD,
  STUB_PUBLIC_PROJECTS,
  STUB_USERS,
  projectsFor,
  userKeyForEmail,
  type StubUserKey,
} from "./fixtures";

const PORT = Number(process.env.PORT ?? 8100);
const COOKIE_NAME = "access_token";

function readCookie(req: IncomingMessage, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

/** The signed-in stub user for this request, or null when unauthenticated. */
function currentUser(req: IncomingMessage) {
  const token = readCookie(req, COOKIE_NAME);
  if (!token) return null;
  const key = token as StubUserKey;
  return key in STUB_USERS ? { key, user: STUB_USERS[key] } : null;
}

function json(
  res: ServerResponse,
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json",
    "content-length": Buffer.byteLength(payload),
    // The frontend talks to this only through the Next /api rewrite, so it is
    // always same-origin from the browser's point of view. No CORS needed.
    ...headers,
  });
  res.end(payload);
}

/** FastAPI's error shape — the frontend reads `detail` everywhere. */
function detail(res: ServerResponse, status: number, message: string) {
  json(res, status, { detail: message });
}

async function readBody(
  req: IncomingMessage,
): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
}

function sessionCookie(token: string, maxAge: number) {
  // HttpOnly mirrors the real backend, so the browser cannot read it from JS —
  // which is also what makes the cookie-seeding helper in support/auth.ts use
  // the Playwright context API rather than document.cookie.
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const path = url.pathname;
  const method = req.method ?? "GET";
  const session = currentUser(req);

  // --- Public ---------------------------------------------------------------

  // Read by proxy.ts on /login, /register and /maintenance only.
  if (path === "/system/maintenance") {
    return json(res, 200, { enabled: false });
  }

  if (path === "/health") {
    return json(res, 200, { status: "ok" });
  }

  // --- Auth -----------------------------------------------------------------

  if (path === "/auth/login" && method === "POST") {
    const body = await readBody(req);
    const email = String(body.email ?? "");
    const key = userKeyForEmail(email);

    if (!key || body.password !== STUB_PASSWORD) {
      // Matches the real backend: one message for both cases, so the response
      // never reveals whether an address is registered.
      return detail(res, 401, "Incorrect email or password");
    }

    // `remember_me` drives cookie lifetime on the real backend; mirrored here
    // so a test can assert the persistent-vs-session distinction.
    const remember = body.remember_me === true;
    return json(res, 200, STUB_USERS[key], {
      "set-cookie": sessionCookie(key, remember ? 60 * 60 * 24 * 30 : 60 * 60),
    });
  }

  if (path === "/auth/logout" && method === "POST") {
    return json(
      res,
      200,
      { detail: "Logged out" },
      {
        "set-cookie": `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
      },
    );
  }

  if (path === "/auth/refresh" && method === "POST") {
    if (!session) return detail(res, 401, "Not authenticated");
    return json(res, 200, session.user, {
      "set-cookie": sessionCookie(session.key, 60 * 60),
    });
  }

  // --- Everything below needs a session ------------------------------------

  if (!session) {
    return detail(res, 401, "Not authenticated");
  }
  const { key, user } = session;

  if (path === "/users/me" && method === "GET") {
    return json(res, 200, user);
  }

  if (path === "/users/me/security-preferences") {
    return json(res, 200, { signin_alerts_enabled: false });
  }

  if (path === "/auth/sessions" && method === "GET") {
    return json(res, 200, [
      {
        session_id: "session-current",
        device: "Mac",
        browser: "Chrome",
        ip_address: "127.0.0.1",
        created_at: "2026-08-20T09:00:00+07:00",
        last_used_at: "2026-08-27T09:00:00+07:00",
        is_current: true,
      },
    ]);
  }

  if (path === "/auth/security-events" && method === "GET") {
    return json(res, 200, [
      {
        id: "event-1",
        action: "SIGN_IN",
        severity: "info",
        ip_address: "127.0.0.1",
        created_at: "2026-08-27T09:00:00+07:00",
      },
    ]);
  }

  // The proxy's on-demand verification gate. Both prefixes answer from the same
  // fixture flag; the proxy picks one by role.
  if (path === "/gverify/kyc/status" || path === "/gverify/kyb/status") {
    return json(res, 200, {
      is_approved: user.is_approved,
      status: user.is_approved ? "APPROVED" : "PENDING",
    });
  }

  if (path === "/projects" && method === "GET") {
    return json(res, 200, projectsFor(key));
  }

  if (path === "/projects/public" && method === "GET") {
    return json(res, 200, STUB_PUBLIC_PROJECTS);
  }

  // Loud on purpose: a 404 here means the frontend reads an endpoint the stub
  // does not know about, and the test that hit it should say so rather than
  // silently rendering an error state.
  console.warn(`[stub-api] unhandled ${method} ${path}`);
  return detail(res, 404, `Stub API has no handler for ${method} ${path}`);
});

server.listen(PORT, () => {
  console.log(`[stub-api] listening on http://127.0.0.1:${PORT}`);
});
