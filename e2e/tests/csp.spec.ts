import { test, expect, type Page } from "@playwright/test";

import type { StubUserKey } from "../stub-api/fixtures";
import { signInAs } from "../support/auth";
import { settle } from "../support/ui";

/**
 * Content-Security-Policy (lib/csp.ts, set by proxy.ts).
 *
 * The policy is strict — scripts run only if they carry this request's nonce —
 * so the failure mode is not "the header is missing" but "a page renders and
 * nothing on it works": a script without the nonce is silently blocked and the
 * page never hydrates. These tests therefore assert from a real browser that
 * pages report no violations, not just that the header string looks right.
 */

/** Record every CSP violation the page reports, from the very first byte. */
async function collectViolations(page: Page): Promise<string[]> {
  const violations: string[] = [];
  await page.exposeFunction("__reportCspViolation", (v: string) =>
    violations.push(v),
  );
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (e) => {
      (
        window as unknown as { __reportCspViolation: (v: string) => void }
      ).__reportCspViolation(
        `${e.effectiveDirective} blocked ${e.blockedURI || "inline"} on ${location.pathname}`,
      );
    });
  });
  return violations;
}

function nonceOf(csp: string | undefined): string | undefined {
  return csp?.match(/'nonce-([^']+)'/)?.[1];
}

test("pages are served with a nonce-based policy", async ({ request }) => {
  const res = await request.get("/");
  const csp = res.headers()["content-security-policy"];

  expect(csp).toBeTruthy();
  expect(nonceOf(csp)).toBeTruthy();
  expect(csp).toContain("'strict-dynamic'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
});

test("the nonce changes on every request", async ({ request }) => {
  const a = nonceOf(
    (await request.get("/")).headers()["content-security-policy"],
  );
  const b = nonceOf(
    (await request.get("/")).headers()["content-security-policy"],
  );
  expect(a).not.toEqual(b);
});

test("every executable script in the HTML carries the response's nonce", async ({
  request,
}) => {
  const res = await request.get("/");
  const nonce = nonceOf(res.headers()["content-security-policy"]);
  const html = await res.text();

  const tags = [...html.matchAll(/<script\b[^>]*>/g)].map((m) => m[0]);
  // JSON-LD is data, not code: browsers do not run it and CSP ignores it.
  const executable = tags.filter((tag) => !tag.includes("application/ld+json"));

  expect(executable.length).toBeGreaterThan(0);
  for (const tag of executable) {
    expect(tag, "script rendered without the nonce").toContain(
      `nonce="${nonce}"`,
    );
  }
});

test("pages outside the auth rules get the policy too", async ({ request }) => {
  // Not auth-gated, so the proxy only runs on them for the CSP; a page it
  // skipped would be served with no policy at all.
  for (const path of [
    "/forgot-password",
    "/en/faq",
    "/this-page-does-not-exist",
  ]) {
    const res = await request.get(path);
    expect(
      nonceOf(res.headers()["content-security-policy"]),
      `${path} has no nonce`,
    ).toBeTruthy();
  }
});

// One test per page rather than one walking them all: under parallel workers a
// single test loading ten pages can outrun the 30s timeout.
const PAGES: { path: string; user?: StubUserKey }[] = [
  { path: "/" },
  { path: "/en" },
  { path: "/faq" },
  { path: "/why-us" },
  { path: "/rate" },
  { path: "/contact" },
  { path: "/terms" },
  { path: "/login" },
  { path: "/login?mode=register" },
  { path: "/forgot-password" },
  { path: "/dashboard", user: "sme" },
  // Validates a form on load — the page that caught Zod's eval probe (see
  // instrumentation-client.ts).
  { path: "/dashboard/settings/profile", user: "sme" },
  { path: "/dashboard/security", user: "sme" },
  { path: "/dashboard", user: "investor" },
  { path: "/dashboard/projects", user: "investor" },
  { path: "/admin", user: "admin" },
  { path: "/admin/users", user: "admin" },
  { path: "/admin/kyc-reviews", user: "admin" },
  { path: "/admin/email", user: "admin" },
];

for (const { path, user } of PAGES) {
  test(`${path} (${user ?? "visitor"}) reports no CSP violations`, async ({
    page,
    context,
  }) => {
    if (user) await signInAs(context, user);
    const violations = await collectViolations(page);
    await page.goto(path);
    await settle(page);
    expect(violations).toEqual([]);
  });
}

test("client-side navigation keeps working under the policy", async ({
  page,
  context,
}) => {
  // Chunks loaded after hydration have no nonce of their own; they are
  // allowed only through 'strict-dynamic'. A broken policy shows up here as a
  // click that never navigates.
  await signInAs(context, "investor");
  const violations = await collectViolations(page);
  await page.goto("/dashboard");
  await settle(page);

  await page.locator('nav a[href="/dashboard/projects"]').first().click();
  await expect(page).toHaveURL(/\/dashboard\/projects$/);
  await settle(page);

  expect(violations).toEqual([]);
});
