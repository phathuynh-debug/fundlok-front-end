import { test, expect } from "@playwright/test";

import { signInAs } from "../support/auth";

/**
 * Every Next → FastAPI call must carry X-Backend-Secret, so a Cloudflare rule
 * in front of the backend can drop anything that arrives without it.
 *
 * This is asserted from the browser, against the hop the browser actually
 * makes, because the interesting property is not "the code sets a header" — it
 * is that the header survives the /api proxy, that the secret never reaches the
 * client, and that a client cannot forge it. A unit test on
 * lib/backend-secret.ts would restate the implementation and prove none of
 * those three.
 *
 * The stub reports what it received at /_test/echo-backend-secret, and
 * playwright.config.ts gives the app and the stub the same known value.
 */

const ECHO = "/api/_test/echo-backend-secret";

test("the proxy attaches the secret to browser-originated API calls", async ({
  page,
}) => {
  await page.goto("/login");

  const seen = await page.evaluate(async (url) => {
    const res = await fetch(url);
    return res.json();
  }, ECHO);

  expect(seen.received).not.toBeNull();
  expect(seen.matches).toBe(true);
});

test("the secret never reaches the browser", async ({ page }) => {
  // BACKEND_SECRET_KEY has no NEXT_PUBLIC_ prefix, so Next refuses to inline
  // it. If someone ever renames it, this fails — which is the whole point: the
  // rename would look harmless and would quietly publish the secret to every
  // visitor.
  await page.goto("/login");

  const html = await page.content();
  expect(html).not.toContain("e2e-backend-secret-not-a-real-key");

  const inEnv = await page.evaluate(() =>
    JSON.stringify(
      (globalThis as unknown as { process?: { env?: unknown } }).process?.env ??
        {},
    ),
  );
  expect(inEnv).not.toContain("e2e-backend-secret-not-a-real-key");
});

test("a client cannot forge the header through the proxy", async ({ page }) => {
  // The header is the server's assertion, not the caller's. Without the
  // delete-before-set in applyBackendSecret, a browser could send its own value
  // and have the proxy forward it verbatim — which would let anyone who
  // guessed the header NAME probe whether a value was accepted.
  await page.goto("/login");

  const seen = await page.evaluate(async (url) => {
    const res = await fetch(url, {
      headers: { "X-Backend-Secret": "forged-by-the-client" },
    });
    return res.json();
  }, ECHO);

  expect(seen.received).not.toBe("forged-by-the-client");
  expect(seen.matches).toBe(true);
});

test("the proxy's own server-side lookups carry it", async ({
  context,
  page,
  request,
}) => {
  // proxy.ts calls /users/me and the GVerify status endpoints directly, not
  // through the /api rewrite, so those are a second code path with its own way
  // to be wrong. Visiting a gated route is what forces them.
  await signInAs(context, "sme");
  await page.goto("/dashboard");

  const audit = await (await request.get("/api/_test/secret-audit")).json();

  // Every path the stub saw must have been reached with the secret. Asserting
  // over the whole audit rather than a fixed list means a NEW server-side
  // fetch added later fails here instead of shipping unprotected.
  const unprotected = Object.entries(
    audit as Record<string, { ok: number; missing: number }>,
  ).filter(([, counts]) => counts.missing > 0);

  expect(
    unprotected,
    `these backend paths were reached without ${"X-Backend-Secret"}: ${unprotected
      .map(([p]) => p)
      .join(", ")}`,
  ).toEqual([]);

  expect(audit["/users/me"]?.ok ?? 0).toBeGreaterThan(0);
});

test("authenticated traffic carries it too", async ({ context, page }) => {
  // The signed-in path goes through the same proxy branch, but it is the one
  // that actually matters: it is where every real API call lives.
  await signInAs(context, "investor");
  await page.goto("/dashboard");

  const seen = await page.evaluate(async (url) => {
    const res = await fetch(url);
    return res.json();
  }, ECHO);

  expect(seen.matches).toBe(true);
});
