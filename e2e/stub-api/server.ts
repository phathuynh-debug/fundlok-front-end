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
 * SMTP and the GVerify partner APIs. So the suite points `API_URL` at
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
  STUB_ADMIN_STATS,
  STUB_ADMIN_USERS,
  STUB_AUDIT_LOGS,
  STUB_PASSWORD,
  STUB_PUBLIC_PROJECTS,
  STUB_USERS,
  projectsFor,
  userKeyForEmail,
  type StubUserKey,
} from "./fixtures";

const PORT = Number(process.env.PORT ?? 8100);

/**
 * 2FA state, in memory and per stub user.
 *
 * The one place this stub keeps mutable state, because the feature is a state
 * machine — off, mid-enrolment, on — and a stateless stub could not tell the
 * three apart. Reset per process, and the stub is never reused between runs
 * (playwright.config.ts sets reuseExistingServer: false for exactly this kind
 * of reason).
 *
 * `STUB_TOTP_CODE` stands in for a real authenticator: the frontend cannot
 * compute an RFC 6238 code, and wiring a TOTP library into the test suite would
 * be testing pyotp rather than the UI.
 */
const STUB_TOTP_CODE = "123456";
const STUB_RECOVERY_CODE = "RECOVERY01";
const twoFactor = new Map<
  string,
  { enabled: boolean; pendingSecret: string | null; recoveryRemaining: number }
>();

/** Forced-503 switch for the unconfigured-server case. */
let setupUnavailable = false;

/**
 * KYB approvals earned during a run, keyed by stub user.
 *
 * Mutable for the same reason 2FA is: approval is a transition, and the whole
 * point of the post-verification redirect is what happens the moment it flips.
 * A fixture flag alone can only express "already approved" or "never", never
 * the change itself. Only ever set by POST /gverify/kyb/verify.
 */
const kybApproved = new Set<string>();

function totpState(key: string) {
  if (!twoFactor.has(key)) {
    twoFactor.set(key, {
      enabled: false,
      pendingSecret: null,
      recoveryRemaining: 0,
    });
  }
  return twoFactor.get(key)!;
}
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

/**
 * Registered passkeys per stub account.
 *
 * Reset between specs by `resetStubState`, because unlike the rest of this
 * server it is mutable — a spec that removes a passkey must not change what
 * the next one sees.
 */
/**
 * Must be a registrable suffix of the host the page is served from, or the
 * browser refuses the ceremony before it reaches the authenticator.
 *
 * WebAuthn rejects bare IP addresses outright — "SecurityError: This is an
 * invalid domain" — so although the rest of the suite runs on 127.0.0.1, the
 * passkey spec drives the same server through localhost. That is a real
 * constraint, not a test artefact: an app served from an IP cannot use
 * passkeys at all.
 */
const RP_ID = "localhost";

function randomChallenge(): string {
  return toBase64Url(
    String.fromCharCode(
      ...Array.from({ length: 32 }, () => Math.floor(Math.random() * 256)),
    ),
  );
}

function toBase64Url(value: string): string {
  return Buffer.from(value, "binary")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

const stubPasskeys = new Map<string, Record<string, unknown>[]>();

/**
 * Passkeys are the only mutable state in this server, so they are the only
 * thing that can leak between specs sharing a worker. Each test sets its own
 * `stub_scope` cookie and gets its own bucket; without one the account key is
 * used, so behaviour is unchanged for every other spec.
 */
function passkeyScope(req: IncomingMessage, key: string): string {
  return readCookie(req, "stub_scope") ?? key;
}

export function seedStubPasskeys(key: string, rows: Record<string, unknown>[]) {
  stubPasskeys.set(key, rows);
}

/**
 * Whether this account has already been through the first-run walkthrough.
 *
 * Driven by a cookie rather than stub state so it stays per-test: the stub is
 * shared across every test in a worker, and a `POST .../complete` from one
 * spec must not silently onboard the next one. support/auth.ts sets the cookie
 * for every spec that is not testing the tour itself.
 */
const ONBOARDED_COOKIE = "stub_onboarded";

function withOnboarding<T extends object>(req: IncomingMessage, user: T) {
  return {
    ...user,
    onboarding_tour_completed_at:
      readCookie(req, ONBOARDED_COOKIE) === "1"
        ? "2026-01-01T00:00:00+00:00"
        : null,
  };
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

/**
 * Per-path tally of requests that arrived with a correct X-Backend-Secret vs
 * without one.
 *
 * Exists because proxy.ts makes its own server-side fetches (/users/me, the
 * GVerify status endpoints, /system/maintenance) that never pass through the
 * /api rewrite, so the browser cannot observe them. Counters rather than a flag:
 * they are monotonic, which makes them safe to read while parallel workers are
 * still writing — the assertion is "none were ever missing", and that can only
 * become more true, never flap.
 */
const secretAudit = new Map<string, { ok: number; missing: number }>();

function auditSecret(path: string, req: IncomingMessage) {
  const expected = process.env.BACKEND_SECRET_KEY;
  if (!expected) return;
  const row = secretAudit.get(path) ?? { ok: 0, missing: 0 };
  if (req.headers["x-backend-secret"] === expected) row.ok += 1;
  else row.missing += 1;
  secretAudit.set(path, row);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const path = url.pathname;
  const method = req.method ?? "GET";
  const session = currentUser(req);

  if (!path.startsWith("/_test/")) auditSecret(path, req);

  if (path === "/_test/secret-audit" && method === "GET") {
    return json(res, 200, Object.fromEntries(secretAudit));
  }

  // --- Public ---------------------------------------------------------------

  // Read by proxy.ts on /login, /register and /maintenance only. GET only: the
  // authenticated PUT (admin toggle) is handled further down.
  if (path === "/system/maintenance" && method === "GET") {
    return json(res, 200, { enabled: false });
  }

  if (path === "/health") {
    return json(res, 200, { status: "ok" });
  }

  // Test-only. Reports what this hop actually received, so a spec can prove the
  // proxy attaches X-Backend-Secret to browser-originated /api traffic. The
  // header is added server-side and stripped from responses, so it is otherwise
  // invisible from the browser — asserting on the code that sets it would only
  // restate the implementation.
  if (path === "/_test/echo-backend-secret" && method === "GET") {
    const received = req.headers["x-backend-secret"];
    return json(res, 200, {
      received: typeof received === "string" ? received : null,
      matches: received === process.env.BACKEND_SECRET_KEY,
    });
  }

  // Test-only. The 2FA endpoints below are the stub's only mutable state, and
  // one stub process serves every parallel worker — so a spec that enrols has
  // to be able to put it back. Namespaced under /_test/ and obviously absent
  // from the real API.
  // Test-only: makes POST /auth/2fa/setup answer 503, the way a server with no
  // TOTP_ENCRYPTION_KEY does. Exists because that exact case shipped as a hung
  // dialog once — the skeleton spun forever instead of reporting the failure.
  if (path === "/_test/2fa/unavailable" && method === "POST") {
    const body = await readBody(req);
    setupUnavailable = body.unavailable === true;
    return json(res, 200, { unavailable: setupUnavailable });
  }

  if (path === "/_test/2fa/reset" && method === "POST") {
    const body = await readBody(req);
    const target = String(body.user ?? "");
    if (target) twoFactor.delete(target);
    else twoFactor.clear();
    setupUnavailable = false;
    return json(res, 200, { reset: true });
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

    // 2FA on: no cookies, only a challenge — same contract as the real
    // backend, so the frontend's two-step flow is exercised for real.
    if (totpState(key).enabled) {
      return json(res, 200, {
        totp_required: true,
        challenge_token: `challenge-${key}`,
      });
    }

    // `remember_me` drives cookie lifetime on the real backend; mirrored here
    // so a test can assert the persistent-vs-session distinction.
    const remember = body.remember_me === true;
    return json(res, 200, STUB_USERS[key], {
      "set-cookie": sessionCookie(key, remember ? 60 * 60 * 24 * 30 : 60 * 60),
    });
  }

  if (path === "/auth/login/2fa" && method === "POST") {
    const body = await readBody(req);
    const token = String(body.challenge_token ?? "");
    const key = token.startsWith("challenge-")
      ? (token.slice("challenge-".length) as StubUserKey)
      : null;

    if (!key || !(key in STUB_USERS)) {
      return detail(res, 401, "Invalid or expired two-factor challenge");
    }

    const submitted = String(body.code ?? "").toUpperCase();
    const state = totpState(key);
    if (submitted === STUB_TOTP_CODE) {
      // fine
    } else if (
      submitted === STUB_RECOVERY_CODE &&
      state.recoveryRemaining > 0
    ) {
      state.recoveryRemaining -= 1;
    } else {
      return detail(res, 401, "That code is not valid");
    }

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

  // Passkey sign-in is deliberately reachable without a session: the caller
  // has none yet, which is the entire point of the feature.
  if (path === "/auth/passkeys/login/options" && method === "POST") {
    return json(res, 200, {
      rpId: RP_ID,
      challenge: randomChallenge(),
      timeout: 60000,
      // Empty, like the real endpoint: a discoverable credential means the
      // browser knows which account it is, and sending a list would let an
      // unauthenticated caller enumerate who has passkeys.
      allowCredentials: [],
      userVerification: "preferred",
    });
  }

  if (path === "/auth/passkeys/login/verify" && method === "POST") {
    // Signs in as whichever account the spec seeded. The real backend finds
    // the account from the credential id; the stub cannot, so the test names
    // it with a cookie set beforehand.
    const asUser = readCookie(req, "stub_passkey_user") as StubUserKey | null;
    if (!asUser || !(asUser in STUB_USERS)) {
      return detail(res, 401, "That passkey was not recognised.");
    }
    return json(res, 200, withOnboarding(req, STUB_USERS[asUser]), {
      "set-cookie": sessionCookie(asUser, 60 * 60),
    });
  }

  // --- Everything below needs a session ------------------------------------

  if (!session) {
    return detail(res, 401, "Not authenticated");
  }
  const { key, user } = session;

  // --- Passkeys -----------------------------------------------------------
  // Registration and sign-in need a real authenticator, so those ceremonies
  // are driven by a Chrome DevTools virtual authenticator in the spec rather
  // than faked here. What the stub owns is the list the security screen reads.
  if (path === "/auth/passkeys" && method === "GET") {
    return json(res, 200, stubPasskeys.get(passkeyScope(req, key)) ?? []);
  }

  // The ceremonies. The stub issues spec-shaped options and ACCEPTS whatever
  // the authenticator returns without verifying the signature — it has no
  // crypto and no business having any.
  //
  // What this lets the e2e prove is the frontend integration: options reach
  // navigator.credentials in a shape it accepts, the result is encoded back
  // into what the API expects, and the screens react. The cryptographic half
  // is proven separately against the real backend (app/auth/passkeys.py),
  // where a full register-then-assert round trip runs and a replayed
  // assertion is refused.
  if (path === "/auth/passkeys/register/options" && method === "POST") {
    return json(res, 200, {
      rp: { id: RP_ID, name: "FundLok" },
      user: {
        id: toBase64Url(user.id),
        name: user.email,
        displayName: user.full_name,
      },
      challenge: randomChallenge(),
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      timeout: 60000,
      excludeCredentials: [],
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
      attestation: "none",
    });
  }

  if (path === "/auth/passkeys/register/verify" && method === "POST") {
    const body = await readBody(req);
    const scope = passkeyScope(req, key);
    const created = {
      id: `pk-${(stubPasskeys.get(scope) ?? []).length + 1}`,
      name: (body.name as string) || "Passkey",
      device_type: "multi_device",
      backed_up: true,
      created_at: new Date().toISOString(),
      last_used_at: null,
    };
    stubPasskeys.set(scope, [...(stubPasskeys.get(scope) ?? []), created]);
    return json(res, 201, created);
  }

  if (path.startsWith("/auth/passkeys/") && method === "DELETE") {
    const id = path.split("/").pop();
    const scope = passkeyScope(req, key);
    stubPasskeys.set(
      scope,
      (stubPasskeys.get(scope) ?? []).filter((p) => p.id !== id),
    );
    res.writeHead(204);
    return res.end();
  }

  if (path === "/users/me" && method === "GET") {
    return json(res, 200, withOnboarding(req, user));
  }

  // Records that the account has seen the first-run walkthrough. The real
  // endpoint returns the refreshed /me payload so the frontend can seed its
  // cache without a follow-up GET; mirrored here.
  if (path === "/users/me/onboarding-tour/complete" && method === "POST") {
    return json(res, 200, {
      ...user,
      onboarding_tour_completed_at: new Date().toISOString(),
    });
  }

  // Profile edit (/dashboard/settings/profile). Echoes the patch back rather
  // than persisting: the stub is stateless so parallel workers cannot interfere
  // with each other, which matters more here than round-trip fidelity.
  if (path === "/users/me" && method === "PATCH") {
    const body = await readBody(req);
    return json(res, 200, { ...user, ...body });
  }

  // Role selection (/select-role).
  if (path === "/users/me/role" && method === "PATCH") {
    const body = await readBody(req);
    return json(res, 200, { ...user, role: body.role });
  }

  if (path === "/users/me/password/change" && method === "POST") {
    const body = await readBody(req);
    if (body.current_password !== STUB_PASSWORD) {
      return detail(res, 400, "Current password is incorrect");
    }
    if (body.new_password === STUB_PASSWORD) {
      return detail(res, 400, "New password must differ from the current one");
    }
    return json(res, 200, { sessions_revoked: 2 });
  }

  if (path === "/auth/resend-verification" && method === "POST") {
    return json(res, 200, { detail: "Verification email sent" });
  }

  if (path.startsWith("/auth/sessions/") && method === "POST") {
    // Both /revoke and /revoke-others.
    return json(res, 200, { revoked: path.endsWith("/revoke") ? 1 : 3 });
  }

  if (path === "/auth/2fa" && method === "GET") {
    const state = totpState(key);
    return json(res, 200, {
      enabled: state.enabled,
      confirmed_at: state.enabled ? "2026-08-27T09:00:00+07:00" : null,
      recovery_codes_remaining: state.recoveryRemaining,
    });
  }

  if (path === "/auth/2fa/setup" && method === "POST") {
    if (setupUnavailable) {
      return detail(
        res,
        503,
        "Two-factor authentication is temporarily unavailable.",
      );
    }
    const state = totpState(key);
    if (state.enabled) {
      return detail(res, 409, "Two-factor authentication is already enabled");
    }
    state.pendingSecret = "JBSWY3DPEHPK3PXP";
    return json(res, 201, {
      secret: state.pendingSecret,
      provisioning_uri: `otpauth://totp/FundLok:${encodeURIComponent(
        user.email,
      )}?secret=${state.pendingSecret}&issuer=FundLok`,
    });
  }

  if (path === "/auth/2fa/enable" && method === "POST") {
    const body = await readBody(req);
    const state = totpState(key);
    if (!state.pendingSecret) {
      return detail(res, 400, "Start two-factor setup before enabling it");
    }
    if (String(body.code ?? "") !== STUB_TOTP_CODE) {
      return detail(
        res,
        400,
        "That code is not valid. Check your authenticator app and try again.",
      );
    }
    state.enabled = true;
    state.recoveryRemaining = 8;
    return json(res, 200, {
      enabled: true,
      recovery_codes: [
        STUB_RECOVERY_CODE,
        "RECOVERY02",
        "RECOVERY03",
        "RECOVERY04",
        "RECOVERY05",
        "RECOVERY06",
        "RECOVERY07",
        "RECOVERY08",
      ],
    });
  }

  if (path === "/auth/2fa/disable" && method === "POST") {
    const body = await readBody(req);
    const state = totpState(key);
    if (!state.enabled) {
      return detail(res, 400, "Two-factor authentication is not enabled");
    }
    if (body.password !== STUB_PASSWORD) {
      return detail(res, 400, "Password is incorrect");
    }
    const submitted = String(body.code ?? "").toUpperCase();
    if (submitted !== STUB_TOTP_CODE && submitted !== STUB_RECOVERY_CODE) {
      return detail(
        res,
        400,
        "That code is not valid. Use a code from your app or a recovery code.",
      );
    }
    state.enabled = false;
    state.pendingSecret = null;
    state.recoveryRemaining = 0;
    return json(res, 200, {
      enabled: false,
      confirmed_at: null,
      recovery_codes_remaining: 0,
    });
  }

  if (path === "/users/me/security-preferences") {
    // PATCH echoes the requested value back, so the UI toggle settles in the
    // new state instead of snapping back on refetch.
    if (method === "PATCH") {
      const body = await readBody(req);
      return json(res, 200, {
        signin_alerts_enabled: body.signin_alerts_enabled === true,
      });
    }
    return json(res, 200, { signin_alerts_enabled: false });
  }

  if (path === "/auth/sessions" && method === "GET") {
    // Two sessions, one of them current. `current` (not `is_current`) is the
    // field DeviceSession declares — getting it wrong hides the "In use" badge
    // and makes the revoke button appear on the user's own session.
    return json(res, 200, [
      {
        session_id: "session-current",
        device: "Mac",
        browser: "Chrome 141",
        ip_address: "127.0.0.1",
        created_at: "2026-08-20T09:00:00+07:00",
        last_used_at: "2026-08-27T09:00:00+07:00",
        current: true,
      },
      {
        session_id: "session-other",
        device: "iPhone",
        browser: "Safari 18",
        ip_address: "203.0.113.7",
        created_at: "2026-08-25T19:30:00+07:00",
        last_used_at: "2026-08-26T21:05:00+07:00",
        current: false,
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
  // A KYB submission. The real provider returns the verdict synchronously, so
  // there is no webhook to wait on: the attempt is terminal by the time this
  // responds, and the caller counts as approved from here on.
  if (path === "/gverify/kyb/verify" && method === "POST") {
    kybApproved.add(key);
    return json(res, 201, {
      verification_id: `00000000-0000-0000-0000-00000000kyb1`.slice(0, 36),
      status: "APPROVED",
      is_approved: true,
      rejection_reason: null,
      tax_code: user.kyb?.tax_code ?? null,
      license_code: null,
      business_name: user.kyb?.business_name ?? null,
      business_type: "Công ty Cổ phần",
      business_status: "Đang hoạt động",
      representatives: [],
      created_at: new Date().toISOString(),
    });
  }

  if (path === "/gverify/kyc/status" || path === "/gverify/kyb/status") {
    const approved =
      user.is_approved ||
      (path === "/gverify/kyb/status" && kybApproved.has(key));
    // KYB additionally carries what the certificate OCR read, which the SME
    // project application prefills from. Null (not absent) when the fixture
    // has no certificate data — that is the real endpoint's shape too.
    const certificate =
      path === "/gverify/kyb/status"
        ? {
            business_name: user.kyb?.business_name ?? null,
            tax_code: user.kyb?.tax_code ?? null,
            company_address: user.kyb?.company_address ?? null,
            date_of_establishment: user.kyb?.date_of_establishment ?? null,
          }
        : {};
    return json(res, 200, {
      is_approved: approved,
      status: approved ? "APPROVED" : "PENDING",
      ...certificate,
    });
  }

  if (path === "/projects" && method === "GET") {
    return json(res, 200, projectsFor(key));
  }

  if (path === "/projects/public" && method === "GET") {
    return json(res, 200, STUB_PUBLIC_PROJECTS);
  }

  // --- Lite grading figures ------------------------------------------------
  // PUT /loans/applications/:id/figures. Echoes the body back the way the real
  // endpoint does, and enforces the one rule a test could otherwise not see
  // fail: required figures must actually be present. Everything finer-grained
  // (bounds, cross-field consistency) is the backend's job and is covered by
  // tests/loans/test_lite_grading_figures.py — duplicating it here would only
  // let the stub and the backend drift apart.
  if (
    /^\/loans\/applications\/[^/]+\/figures$/.test(path) &&
    method === "PUT"
  ) {
    const figures = await readBody(req);
    const required = [
      "revenue_last_12m",
      "revenue_prior_12m",
      "cogs_y1",
      "fixed_cost_y1",
      "variable_cost_excl_cogs_y1",
    ];
    const missing = required.filter(
      (field) => figures[field] === undefined || figures[field] === null,
    );
    if (missing.length > 0) {
      return json(res, 422, {
        detail: `Missing required figures: ${missing.join(", ")}`,
      });
    }
    return json(res, 200, {
      ...figures,
      figures_updated_at: "2026-09-06T23:59:00+07:00",
    });
  }

  // --- Admin ---------------------------------------------------------------
  // Guarded like the real backend: a non-admin session must get a 403 here, so
  // a test can prove the API is not the only thing keeping them out.
  if (path.startsWith("/admin/")) {
    if (user.role !== "ADMIN" && user.role !== "SYSTEM_ADMIN") {
      return detail(res, 403, "Not enough permissions");
    }

    if (path === "/admin/overview" && method === "GET") {
      const mode =
        url.searchParams.get("mode") === "projects" ? "projects" : "users";
      const items =
        mode === "projects" ? STUB_PUBLIC_PROJECTS : STUB_ADMIN_USERS;
      const search = url.searchParams.get("search");
      const filtered = search
        ? items.filter((row) =>
            JSON.stringify(row).toLowerCase().includes(search.toLowerCase()),
          )
        : items;

      return json(res, 200, {
        stats: STUB_ADMIN_STATS,
        mode,
        table: {
          items: filtered,
          total: filtered.length,
          page: Number(url.searchParams.get("page") ?? 1),
          page_size: Number(url.searchParams.get("page_size") ?? 20),
        },
      });
    }

    if (path === "/admin/audit-logs" && method === "GET") {
      return json(res, 200, STUB_AUDIT_LOGS);
    }
  }

  // Maintenance toggle. Deliberately NOT persisted: the flag is global to the
  // app server and cached for 5s in middleware.service.ts, so a test that
  // flipped it would change every other test running in parallel. The write is
  // accepted and echoed so the admin screen's happy path can be exercised
  // without turning maintenance on for anyone else.
  if (path === "/system/maintenance" && method === "PUT") {
    if (user.role !== "SYSTEM_ADMIN") {
      return detail(res, 403, "Not enough permissions");
    }
    const body = await readBody(req);
    return json(res, 200, {
      enabled: body.enabled === true,
      message: (body.message as string | null) ?? null,
      updated_at: "2026-08-27T09:00:00+07:00",
      updated_by: user.email,
    });
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
