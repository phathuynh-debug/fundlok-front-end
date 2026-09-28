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
  STUB_ADMIN_ONLY_PROJECT,
  STUB_ADMIN_COMPLETE_PROJECT,
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

/**
 * Admin project preview state: one KYB attempt and one funding request per
 * stub project, both decidable.
 *
 * Mutable for the same reason the 2FA map is — the panel exists to record a
 * DECISION, and a fixture that is permanently PENDING (or permanently
 * approved) cannot exercise the transition. Built lazily so each project the
 * suite opens gets its own records rather than sharing one.
 */
interface StubAdminApplication {
  id: string;
  requested_amount: number;
  purpose: string | null;
  repayment_preference: string | null;
  status: string;
  admin_approval: string;
  submitted_at: string | null;
  decided_at: string | null;
  decision_note: string | null;
  created_at: string | null;
  documents: Array<{
    id: string;
    document_type: string;
    original_filename: string;
    content_type: string | null;
    file_size_bytes: number | null;
    status: string;
    uploaded_at: string | null;
  }>;
}

interface StubAdminKyb {
  id: string;
  status: string;
  is_approved: boolean;
  rejection_reason: string | null;
  business_name: string | null;
  tax_code: string | null;
  updated_at: string | null;
}

const adminApplications = new Map<string, StubAdminApplication>();
const adminKybAttempts = new Map<string, StubAdminKyb>();
const adminProjectSeeded = new Set<string>();

/** Status changes made during a run, keyed by stub user id. */
const adminUserStatuses = new Map<string, string>();

/** Notifications, keyed by stub user. Mutable: read state is the whole point. */
const notificationsByUser = new Map<string, StubNotification[]>();

interface StubNotification {
  id: string;
  event: string;
  entity_type: string | null;
  entity_id: string | null;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

function notificationsFor(key: StubUserKey): StubNotification[] {
  if (!notificationsByUser.has(key)) {
    // Only the SME accounts have anything: a notification is addressed to the
    // applicant, and an empty bell for everyone else is the correct answer.
    const seeded: StubNotification[] =
      key === "sme" || key === "smeRejectedApplication"
        ? [
            {
              id: `ntf-1-${key}`,
              event: "APPLICATION_REJECTED",
              entity_type: "LOAN_APPLICATION",
              entity_id: "30000000-0000-0000-0000-000000000001",
              data: { amount_vnd: 500000000 },
              read_at: null,
              created_at: "2026-09-12T09:00:00+07:00",
            },
            {
              id: `ntf-2-${key}`,
              event: "APPLICATION_APPROVED",
              entity_type: "LOAN_APPLICATION",
              entity_id: "30000000-0000-0000-0000-000000000001",
              data: { amount_vnd: 500000000 },
              read_at: "2026-09-10T09:00:00+07:00",
              created_at: "2026-09-10T08:00:00+07:00",
            },
          ]
        : [];
    notificationsByUser.set(key, seeded);
  }
  return notificationsByUser.get(key)!;
}

/** Score runs produced during a run, keyed by application id. */
const adminScoreRuns = new Map<string, Record<string, unknown>>();
const adminScoreRunCounts = new Map<string, number>();

function scoreRunFor(applicationId: string) {
  const run = adminScoreRuns.get(applicationId);
  if (!run) return null;
  // Both are null on an INSUFFICIENT_DATA run: the real engine reports the
  // grade as absent rather than zero (R8), and a stub that invented a 0 here
  // would let the UI ship a bug the API cannot produce.
  const pricing = run.pricing as { interest_rate_pct: number } | null;
  const grade = run.grade as { value: number } | null;
  return {
    id: run.id,
    status: run.status,
    decision: run.decision,
    final_grade: grade?.value ?? null,
    interest_rate_pct: pricing?.interest_rate_pct ?? null,
    engine_version: "1.0.0",
    params_version: "wb-v1-20260917",
    created_at: new Date().toISOString(),
    // What the real API names on an ungraded run: the inputs still absent.
    missing_inputs:
      run.decision === "INSUFFICIENT_DATA"
        ? ["duration_months", "kyc_aml_passed"]
        : [],
  };
}

/** Every company the admin console can open — listings plus admin-only ones. */
function adminProjects() {
  return [
    ...STUB_PUBLIC_PROJECTS,
    STUB_ADMIN_ONLY_PROJECT,
    STUB_ADMIN_COMPLETE_PROJECT,
  ];
}

function adminProjectDetail(projectId: string) {
  const project = adminProjects().find((p) => p.id === projectId);
  if (!project) return null;

  if (!adminProjectSeeded.has(projectId)) {
    adminProjectSeeded.add(projectId);
    adminApplications.set(`app-${projectId}`, {
      id: `app-${projectId}`,
      requested_amount: 500000000,
      purpose: "Kitchen expansion",
      repayment_preference: "MONTHLY",
      status: "SUBMITTED",
      admin_approval: "PENDING",
      submitted_at: "2026-09-01T00:00:00Z",
      decided_at: null,
      decision_note: null,
      created_at: "2026-09-01T00:00:00Z",
      // What the SME wizard collects: step 1 produces two, steps 4 and 5 one
      // each. One left PENDING on purpose — a presign that never completed is
      // a real state the panel has to surface rather than hide.
      documents:
        projectId === STUB_ADMIN_COMPLETE_PROJECT.id
          ? REQUIRED_DOCUMENT_TYPES.map((type) => ({
              id: `doc-${type}-${projectId}`,
              document_type: type,
              original_filename: `${type}.pdf`,
              content_type: "application/pdf",
              file_size_bytes: 120000,
              status: "UPLOADED",
              uploaded_at: "2026-09-01T00:00:00Z",
            }))
          : [
              {
                id: `doc-charter-${projectId}`,
                document_type: "legal_charter",
                original_filename: "dieu-le-cong-ty.pdf",
                content_type: "application/pdf",
                file_size_bytes: 240000,
                status: "UPLOADED",
                uploaded_at: "2026-09-01T00:00:00Z",
              },
              {
                id: `doc-reg-${projectId}`,
                document_type: "business_registration",
                original_filename: "giay-dang-ky-kinh-doanh.pdf",
                content_type: "application/pdf",
                file_size_bytes: 182000,
                status: "PENDING",
                uploaded_at: null,
              },
            ],
    });
    // Parked by the engine — the state an operator is there to settle.
    adminKybAttempts.set(`kyb-${projectId}`, {
      id: `kyb-${projectId}`,
      status: "MANUAL_REVIEW",
      is_approved: false,
      rejection_reason: "OCR confidence too low on the tax code",
      business_name: project.legal_name,
      tax_code: "1501167629",
      updated_at: "2026-09-01T00:00:00Z",
    });
  }

  return {
    id: project.id,
    legal_name: project.legal_name,
    tax_id: "1501167629",
    industry: project.industry,
    status: project.status ?? "DRAFT",
    address: null,
    incorporation_date: "2019-03-15",
    created_at: project.created_at ?? "2026-02-01T00:00:00Z",
    applications: [
      {
        ...adminApplications.get(`app-${projectId}`)!,
        score_run: scoreRunFor(`app-${projectId}`),
        missing_documents: missingDocumentsFor(`app-${projectId}`),
      },
    ],
    kyb: adminKybAttempts.get(`kyb-${projectId}`)!,
  };
}

const REQUIRED_DOCUMENT_TYPES = [
  "legal_charter",
  "business_registration",
  "e_invoice_data",
  "tax_filings",
  "cic_report",
];

/** As app/admin/service.py: only an UPLOADED row counts, and an approved
 * business verification stands in for the registration. */
function missingDocumentsFor(applicationId: string): string[] {
  const application = adminApplications.get(applicationId) as
    { documents: { document_type: string; status: string }[] } | undefined;
  if (!application) return [];
  const kyb = adminKybAttempts.get(applicationId.replace(/^app-/, "kyb-")) as
    { is_approved?: boolean } | undefined;
  const uploaded = new Set(
    application.documents
      .filter((d) => d.status === "UPLOADED")
      .map((d) => d.document_type),
  );
  return REQUIRED_DOCUMENT_TYPES.filter(
    (type) =>
      !uploaded.has(type) &&
      !(type === "business_registration" && kyb?.is_approved),
  );
}

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

/**
 * Accounts the backend refuses outright.
 *
 * The real API rejects a suspended account in get_current_user, so EVERY
 * authenticated route answers 403 — not just login. Mirrored here because the
 * proxy reads /users/me server-side to decide where to send the request, and
 * that decision is the thing under test.
 */
const SUSPENDED_KEYS = new Set<StubUserKey>(["suspended"]);

/**
 * Accounts whose access token is treated as expired: the cookie resolves to a
 * stub identity, but every authenticated route answers 401 exactly as the real
 * API does once the 30-minute token lapses.
 */
const EXPIRED_KEYS = new Set<StubUserKey>(["expiredSession"]);

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

const STUB_INVESTOR_LEAD_ID = "7c1f0c52-2f5e-4b8f-9a0e-3d1f5a9b2c10";

function stubInvestorEstimate(tier: string) {
  const byTier: Record<string, [number, number, number, number]> = {
    conservative: [12.8, 0.5, 9.8, 16.12],
    balanced: [14.0, 1.0, 10.5, 17.27],
    growth: [15.2, 2.0, 10.7, 17.6],
  };
  const [loan, loss, net, apy] = byTier[tier] ?? byTier.balanced;
  return {
    loan_rate_pct: loan,
    expected_loss_pct: loss,
    fee_pct: 2.5,
    net_per_loan_pct: net,
    net_apy_pct: apy,
    estimated_return_vnd: Math.round(1_000_000_000 * (apy / 100)),
    avg_loan_months: 4,
    capital_turns: 3,
  };
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

  // Read by proxy.ts on /login and /maintenance only. GET only: the
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

  // The rate calculator and the investor tab are public on the real backend,
  // so they are answered BEFORE the session guard below. Behind it, an
  // anonymous /rate visitor got a 401 here that production never returns.
  // --- Public Rate Calculator ---------------------------------------------
  if (path === "/api/v1/rates/calculate" && method === "POST") {
    await readBody(req);
    return json(res, 200, {
      inquiry_id: "a98444f0-4591-4cf1-97b7-5f7564d8f161",
      status: "success",
      data: {
        rate_range: {
          min_rate_monthly: 1.2,
          max_rate_monthly: 1.8,
          apr_min: 14.4,
          apr_max: 21.6,
        },
        estimated_monthly_payment: {
          min: 142933333,
          max: 147733333,
        },
        risk_profile: {
          tier: "TIER_A",
          growth_rate_pct: 25.0,
          ebitda_margin_pct: 17.5,
          debt_to_revenue_pct: 20.0,
          is_operating_loss: false,
        },
      },
    });
  }

  // --- Investor tab of /rate --------------------------------------------------
  // Figures are the prototype's locked scenario, so a spec can assert the
  // page renders the server's walk-down rather than computing its own.
  if (path === "/api/v1/rates/investor/tiers" && method === "GET") {
    return json(res, 200, {
      tiers: [
        { risk_tier: "conservative", loan_rate_pct: 12.8 },
        { risk_tier: "balanced", loan_rate_pct: 14.0 },
        { risk_tier: "growth", loan_rate_pct: 15.2 },
      ],
    });
  }

  if (path === "/api/v1/rates/investor/leads" && method === "POST") {
    const body = await readBody(req);
    // The real backend 422s without both consents; the stub does too, so a
    // spec proves the page actually sends them.
    if (
      body.acknowledged_illustrative !== true ||
      body.consent_contact !== true ||
      !body.full_name ||
      !body.email
    ) {
      return detail(res, 422, "consents and contact details are required");
    }
    return json(res, 201, {
      lead_id: STUB_INVESTOR_LEAD_ID,
      reference: "FL-STUB42",
      estimate: stubInvestorEstimate(String(body.risk_tier)),
    });
  }

  const investorEstimateMatch = path.match(
    /^\/api\/v1\/rates\/investor\/leads\/([^/]+)\/(estimate|signup)$/,
  );
  if (investorEstimateMatch && method === "POST") {
    const body = await readBody(req);
    if (investorEstimateMatch[1] !== STUB_INVESTOR_LEAD_ID) {
      return detail(res, 404, "Enquiry not found");
    }
    if (investorEstimateMatch[2] === "signup") {
      return json(res, 200, {
        reference: "FL-STUB42",
        signed_up_at: "2026-09-27T08:00:00.000Z",
      });
    }
    return json(res, 200, stubInvestorEstimate(String(body.risk_tier)));
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

  // An expired access token: the cookie is still sent, the backend rejects it.
  if (EXPIRED_KEYS.has(key)) {
    return json(res, 401, { detail: "Could not validate credentials" });
  }

  // A suspended account is refused on EVERY authenticated route, matching
  // get_current_user server-side — not only at login.
  if (SUSPENDED_KEYS.has(key)) {
    return json(res, 403, { detail: "This account has been suspended" });
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

  // --- Notifications --------------------------------------------------------
  // Mutable per worker, like the other decision state: the point of the panel
  // is what happens when something is marked read, which a frozen fixture
  // cannot express. Keyed by user so the scoping the API enforces is visible
  // here too.
  if (path === "/notifications" && method === "GET") {
    const items = notificationsFor(key);
    return json(res, 200, {
      items,
      unread: items.filter((n) => n.read_at === null).length,
    });
  }

  const markReadMatch = path.match(/^\/notifications\/([^/]+)\/read$/);
  if (markReadMatch && method === "PATCH") {
    const target = notificationsFor(key).find((n) => n.id === markReadMatch[1]);
    if (!target) return json(res, 404, { detail: "Notification not found" });
    target.read_at = target.read_at ?? new Date().toISOString();
    return json(res, 200, target);
  }

  if (path === "/notifications/read-all" && method === "POST") {
    const unread = notificationsFor(key).filter((n) => n.read_at === null);
    for (const item of unread) item.read_at = new Date().toISOString();
    return json(res, 200, { updated: unread.length });
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

  // --- Underwriting ---------------------------------------------------------
  // NOT under /admin/ — the real route is /underwriting/*, and it is gated by
  // require_roles(Role.ADMIN) specifically: a SYSTEM_ADMIN is refused too.
  if (path === "/underwriting/score-runs" && method === "POST") {
    if (user.role !== "ADMIN") {
      return detail(res, 403, "Not authorized for this action");
    }
    const body = await readBody(req);
    const applicationId = String(body.application_id);
    // Like the real backend: a run moves the application to UNDER_REVIEW,
    // and it can be run again only while undecided and not locked.
    const application = adminApplications.get(applicationId) as
      Record<string, unknown> | undefined;
    if (application && application.admin_approval !== "PENDING") {
      return detail(
        res,
        409,
        "This application has been decided; its score is not re-run",
      );
    }
    if (adminScoreRuns.get(applicationId)?.status === "LOCKED") {
      return detail(
        res,
        409,
        "A locked score run already backs this application; it is not re-run",
      );
    }
    const runNumber = (adminScoreRunCounts.get(applicationId) ?? 0) + 1;
    adminScoreRunCounts.set(applicationId, runNumber);
    // One company has no financials behind it, so the engine declines to
    // grade it. That is a 201 with a decision, not an error — the operator
    // gets an answer, just not a score.
    const ungraded = applicationId.endsWith(STUB_ADMIN_ONLY_PROJECT.id);
    const run = ungraded
      ? {
          id: `run-${applicationId}`,
          application_id: applicationId,
          status: "READY",
          decision: "INSUFFICIENT_DATA",
          grade: null,
          pricing: null,
          fired_gates: [],
          versions: { engine: "1.0.0", params: "wb-v1-20260917" },
        }
      : {
          id: `run-${applicationId}`,
          application_id: applicationId,
          status: "READY",
          decision: "APPROVED",
          grade: { value: 75.91 },
          pricing: {
            interest_rate_pct: 13.93,
            target_payment_vnd: 534817122,
            target_daily_vnd: 4051644,
          },
          fired_gates: [],
          versions: { engine: "1.0.0", params: "wb-v1-20260917" },
        };
    // Each run is a new one, as in the real score_runs table.
    run.id = `run-${applicationId}-${runNumber}`;
    adminScoreRuns.set(applicationId, run);
    if (application) application.status = "UNDER_REVIEW";
    return json(res, 201, run);
  }

  // --- Step-2 e-invoice preview -------------------------------------------
  // The real endpoint reads the raw .zip body. The stub cannot parse xlsx, so
  // it answers with a fixed 12-month year; a body containing "BROKEN" gets the
  // not-a-zip refusal, so a spec can drive the error path.
  if (path === "/uploads/einvoice-preview" && method === "POST") {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    if (Buffer.concat(chunks).toString("latin1").includes("BROKEN")) {
      return json(
        res,
        422,
        { detail: "The upload is not a readable .zip" },
        { "x-error-code": "EINVOICE_NOT_A_ZIP" },
      );
    }
    const months = Array.from({ length: 12 }, (_, i) => {
      const month = ((8 + i) % 12) + 1;
      const year = 2025 + (8 + i >= 12 ? 1 : 0);
      return {
        period: `${String(month).padStart(2, "0")}/${year}`,
        revenue_vnd: 5_000_000_000 + i * 100_000_000,
      };
    });
    const amounts = months.map((m) => m.revenue_vnd);
    return json(res, 200, {
      seller_tax_code: "0312345678",
      period_start: months[0].period,
      period_end: months[11].period,
      months_covered: 12,
      monthly_revenue: months,
      revenue_last_12m: amounts.reduce((a, b) => a + b, 0),
      revenue_best_month: Math.max(...amounts),
      revenue_worst_month: Math.min(...amounts),
      conc_top1_pct: 9.99,
      conc_top3_pct: 22.29,
      warnings: [],
    });
  }

  // The step-4 read of the CIC report, shaped like the reference report: an
  // individual's, score 629, rank 2, 17 million of standard card debt.
  if (path === "/uploads/cic-preview" && method === "POST") {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    if (Buffer.concat(chunks).toString("latin1").includes("BROKEN")) {
      return json(
        res,
        422,
        { detail: "This PDF is not a CIC credit report" },
        { "x-error-code": "CIC_NOT_CIC" },
      );
    }
    return json(res, 200, {
      subject_type: "individual",
      subject_name: "NGUYỄN VĂN MẪU",
      score: 629,
      rank: 2,
      rank_band: [622, 644],
      rank_label: "very_good",
      percentile: 85,
      scored_on: "2026-04-23",
      queried_on: "2026-05-07",
      age_days: 20,
      lenders: 1,
      debt_total_vnd_million: 17,
      debt_attention_vnd_million: 0,
      debt_bad_vnd_million: 0,
      negative_history: false,
      signed: false,
      warnings: [
        { code: "UNSIGNED", detail: "the PDF carries no digital signature" },
        { code: "INDIVIDUAL_REPORT", detail: "an individual's report" },
      ],
    });
  }

  // The step-3 read of the tax filings. Shaped like the reference FY2025
  // TT133 package: selling expense 0, nothing paid out to the owners.
  if (path === "/uploads/tax-filings-preview" && method === "POST") {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    if (Buffer.concat(chunks).toString("latin1").includes("BROKEN")) {
      return json(
        res,
        422,
        {
          detail:
            "No year-end financial statement (B02 package XML) in the .zip",
        },
        { "x-error-code": "TAXFILINGS_NO_STATEMENTS" },
      );
    }
    return json(res, 200, {
      fiscal_year: 2025,
      regime: "TT133",
      signed: true,
      tax_code: "0312345678",
      // Below the stub invoices' 66.6bn year, so the costs leave a profit.
      cogs_y1: 40_000_000_000,
      owner_withdrawal_pct: 0,
      admin_expense_vnd: 3_160_138_988,
      selling_expense_vnd: 0,
      revenue_net_vnd: 70_000_000_000,
      net_profit_vnd: 1_491_457_916,
      interest_expense_vnd: 2_485_096_004,
      vat_months: 24,
      vat_period: "08/2024–07/2026",
      warnings: [],
    });
  }

  // --- Admin ---------------------------------------------------------------
  // Guarded like the real backend: a non-admin session must get a 403 here, so
  // a test can prove the API is not the only thing keeping them out.
  if (path.startsWith("/admin/")) {
    if (user.role !== "ADMIN" && user.role !== "SYSTEM_ADMIN") {
      return detail(res, 403, "Not enough permissions");
    }

    if (path === "/admin/rates/investor-leads" && method === "GET") {
      const items = [
        {
          id: STUB_INVESTOR_LEAD_ID,
          reference: "FL-STUB42",
          created_at: "2026-09-27T07:30:00.000Z",
          full_name: "Trần Thị Nhà Đầu Tư",
          email: "investor.lead@example.com",
          phone: "0901 234 567",
          locale: "vi",
          amount_vnd: 1000000000,
          commitment_months: 12,
          risk_tier: "balanced",
          reinvestment_cadence: "monthly",
          bank_rate_pct: 12.0,
          loan_rate_pct: 14.0,
          net_per_loan_pct: 10.5,
          net_apy_pct: 17.27,
          estimated_return_vnd: 172704000,
          acknowledged_illustrative_at: "2026-09-27T07:29:00.000Z",
          consented_contact_at: "2026-09-27T07:30:00.000Z",
          signed_up_at: "2026-09-27T07:35:00.000Z",
          signup_amount_vnd: 1000000000,
          signup_commitment_months: 12,
          signup_risk_tier: "growth",
          signup_reinvestment_cadence: "daily",
          signup_net_apy_pct: 22.1,
          session_id: "sess_stub_456",
          ip_address: "127.0.0.1",
          user_agent: "Mozilla/5.0",
        },
      ];
      return json(res, 200, { total: 1, page: 1, page_size: 15, items });
    }

    if (path === "/admin/rates/inquiries" && method === "GET") {
      const items = [
        {
          id: "a98444f0-4591-4cf1-97b7-5f7564d8f161",
          created_at: "2026-09-26T15:45:00.000Z",
          created_at_formatted: "26/09/2026 22:45",
          industry: "retail_fmcg",
          industry_display: "Retail FMCG",
          operating_months: 36,
          employee_count: 25,
          tenure_staff_display: "36 mos / 25 staff",
          revenue_l12m: 4000000000,
          revenue_l12m_formatted: "4.000.000.000 ₫",
          revenue_prev_12m: 3200000000,
          cogs_l12m: 2400000000,
          fixed_costs_l12m: 600000000,
          variable_costs_l12m: 300000000,
          yoy_growth_pct: 25.0,
          yoy_growth_display: "+25.0%",
          requested_amount: 800000000,
          tenor_months: 6,
          loan_ask_display: "800M ₫ / 6 mos",
          estimated_rate_min: 1.2,
          estimated_rate_max: 1.8,
          calculated_rate_display: "1.2% - 1.8% / mo",
          risk_tier: "TIER_A",
          tier_display: "Tier A",
          calculated_monthly_payment: 142933333,
          calculated_monthly_payment_formatted: "142.933.333 ₫",
          session_id: "sess_stub_123",
          ip_address: "127.0.0.1",
          user_agent: "Mozilla/5.0",
          full_name: "Lê Thị Chủ Shop",
          company_name: "Công ty TNHH Bán Lẻ Mẫu",
          email: "owner@retail.vn",
          phone: "0912 345 678",
          consented_contact_at: "2026-09-26T15:45:00.000Z",
        },
      ];
      return json(res, 200, {
        total: items.length,
        page: 1,
        page_size: 20,
        items,
      });
    }

    const rateInquiryDetailMatch = path.match(
      /^\/admin\/rates\/inquiries\/([^/]+)$/,
    );
    if (rateInquiryDetailMatch && method === "GET") {
      return json(res, 200, {
        id: rateInquiryDetailMatch[1],
        created_at: "2026-09-26T15:45:00.000Z",
        created_at_formatted: "26/09/2026 22:45",
        industry: "retail_fmcg",
        industry_display: "Retail FMCG",
        operating_months: 36,
        employee_count: 25,
        tenure_staff_display: "36 mos / 25 staff",
        revenue_l12m: 4000000000,
        revenue_l12m_formatted: "4.000.000.000 ₫",
        revenue_prev_12m: 3200000000,
        cogs_l12m: 2400000000,
        fixed_costs_l12m: 600000000,
        variable_costs_l12m: 300000000,
        yoy_growth_pct: 25.0,
        yoy_growth_display: "+25.0%",
        requested_amount: 800000000,
        tenor_months: 6,
        loan_ask_display: "800M ₫ / 6 mos",
        estimated_rate_min: 1.2,
        estimated_rate_max: 1.8,
        calculated_rate_display: "1.2% - 1.8% / mo",
        risk_tier: "TIER_A",
        tier_display: "Tier A",
        calculated_monthly_payment: 142933333,
        calculated_monthly_payment_formatted: "142.933.333 ₫",
        session_id: "sess_stub_123",
        ip_address: "127.0.0.1",
        user_agent: "Mozilla/5.0",
      });
    }

    if (path === "/admin/overview" && method === "GET") {
      const mode =
        url.searchParams.get("mode") === "projects" ? "projects" : "users";
      const items =
        mode === "projects"
          ? adminProjects()
          : STUB_ADMIN_USERS.map((u) => ({
              ...u,
              status: adminUserStatuses.get(u.id) ?? u.status,
            }));
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

    // --- Admin project preview: the two-approval gate --------------------- //
    // Mutable, like the 2FA block above and for the same reason: the whole
    // point of the panel is what happens when a decision flips, which a
    // stateless fixture cannot express.
    const userStatusMatch = path.match(/^\/admin\/users\/([^/]+)\/status$/);
    if (userStatusMatch && method === "PATCH") {
      const body = await readBody(req);
      const target = STUB_ADMIN_USERS.find((u) => u.id === userStatusMatch[1]);
      if (!target) return json(res, 404, { detail: "User not found" });
      // The server's two guards, mirrored so the suite can assert the UI
      // respects them rather than only that it renders them.
      if (target.id === user.id) {
        return json(res, 409, {
          detail: "You cannot change your own account status",
        });
      }
      if (
        ["ADMIN", "SYSTEM_ADMIN"].includes(String(target.role)) &&
        user.role !== "SYSTEM_ADMIN"
      ) {
        return json(res, 403, {
          detail: "Only a system admin can change an admin account's status",
        });
      }
      adminUserStatuses.set(target.id, String(body.status));
      return json(res, 200, {
        ...target,
        status: String(body.status),
      });
    }

    const projectDetailMatch = path.match(/^\/admin\/projects\/([^/]+)$/);
    if (projectDetailMatch && method === "GET") {
      const detail = adminProjectDetail(projectDetailMatch[1]);
      if (!detail) return json(res, 404, { detail: "Project not found" });
      return json(res, 200, detail);
    }

    const decisionMatch = path.match(
      /^\/admin\/applications\/([^/]+)\/decision$/,
    );
    if (decisionMatch && method === "POST") {
      const body = await readBody(req);
      const application = adminApplications.get(decisionMatch[1]);
      if (!application)
        return json(res, 404, { detail: "Application not found" });
      if (application.admin_approval !== "PENDING") {
        return json(res, 409, {
          detail: `Application has already been ${application.admin_approval.toLowerCase()}`,
        });
      }
      const missing = missingDocumentsFor(decisionMatch[1]);
      if (body.decision === "APPROVED" && missing.length > 0) {
        return json(
          res,
          409,
          { detail: `Required documents missing: ${missing.join(", ")}` },
          { "x-error-code": "DOCUMENTS_MISSING" },
        );
      }
      application.admin_approval = String(body.decision);
      application.decision_note = (body.note as string) ?? null;
      application.decided_at = new Date().toISOString();
      return json(res, 200, application);
    }

    const resolveMatch = path.match(
      /^\/admin\/kyb-verifications\/([^/]+)\/resolve$/,
    );
    if (resolveMatch && method === "POST") {
      const body = await readBody(req);
      const attempt = adminKybAttempts.get(resolveMatch[1]);
      if (!attempt)
        return json(res, 404, { detail: "KYB verification not found" });
      if (attempt.status !== "MANUAL_REVIEW") {
        return json(res, 409, {
          detail: "Only a MANUAL_REVIEW attempt can be resolved",
        });
      }
      attempt.status = String(body.decision);
      attempt.is_approved = attempt.status === "APPROVED";
      if (attempt.status === "REJECTED") {
        attempt.rejection_reason = (body.note as string) ?? null;
      }
      return json(res, 200, attempt);
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
