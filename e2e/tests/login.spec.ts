import { test, expect } from "@playwright/test";

import { STUB_PASSWORD, STUB_USERS } from "../stub-api/fixtures";
import { t } from "../support/i18n";
import { toast } from "../support/ui";

/**
 * The one place the login form is driven end to end.
 *
 * Every other spec seeds the session cookie instead (see support/auth.ts) — this
 * file is what proves the form, the API call and the cookie handshake actually
 * work, so the shortcut elsewhere stands on something tested.
 *
 * Turnstile: the suite runs with NEXT_PUBLIC_DISABLE_TURNSTILE=true, the app's
 * own escape hatch in hooks/use-turnstile.ts, which supplies a "mock-token" and
 * renders no widget. No CAPTCHA is being solved or circumvented — the real
 * challenge is simply not part of this build, and the stub API accepts any
 * token. A production build has the widget and is unaffected.
 */

test("renders the sign-in form", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByLabel(t("auth.login.emailLabel"))).toBeVisible();
  await expect(page.getByLabel(t("auth.login.passwordLabel"))).toBeVisible();
  await expect(
    page.getByRole("button", { name: t("auth.login.submit"), exact: true }),
  ).toBeEnabled();
});

test("signs an investor in and lets them reach the dashboard", async ({
  page,
}) => {
  await page.goto("/login");

  await page
    .getByLabel(t("auth.login.emailLabel"))
    .fill(STUB_USERS.investor.email);
  await page.getByLabel(t("auth.login.passwordLabel")).fill(STUB_PASSWORD);
  await page
    .getByRole("button", { name: t("auth.login.submit"), exact: true })
    .click();

  await expect(toast(page, t("auth.login.successTitle"))).toBeVisible();

  // The form does not navigate on success — the session cookie is what matters,
  // and the proxy routes on the next navigation. Assert the cookie exists and
  // is httpOnly, then follow it.
  const cookie = (await page.context().cookies()).find(
    (c) => c.name === "access_token",
  );
  expect(cookie, "login should set a session cookie").toBeTruthy();
  expect(cookie!.httpOnly, "session cookie must not be readable from JS").toBe(
    true,
  );

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: t("dashboard.investor.title") }),
  ).toBeVisible();
});

test("an SME signing in lands on the SME dashboard", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel(t("auth.login.emailLabel")).fill(STUB_USERS.sme.email);
  await page.getByLabel(t("auth.login.passwordLabel")).fill(STUB_PASSWORD);
  await page
    .getByRole("button", { name: t("auth.login.submit"), exact: true })
    .click();
  await expect(toast(page, t("auth.login.successTitle"))).toBeVisible();

  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "E2E Manufacturing Co" }),
  ).toBeVisible();
});

test("rejects a wrong password without revealing whether the email exists", async ({
  page,
}) => {
  await page.goto("/login");

  await page
    .getByLabel(t("auth.login.emailLabel"))
    .fill(STUB_USERS.investor.email);
  await page.getByLabel(t("auth.login.passwordLabel")).fill("not-the-password");
  await page
    .getByRole("button", { name: t("auth.login.submit"), exact: true })
    .click();

  await expect(toast(page, t("auth.login.failedTitle"))).toBeVisible();
  // Same message the stub returns for an unknown address.
  await expect(toast(page, "Incorrect email or password")).toBeVisible();

  const cookie = (await page.context().cookies()).find(
    (c) => c.name === "access_token",
  );
  expect(cookie, "a failed login must not create a session").toBeFalsy();
});

test("an unknown email fails the same way", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel(t("auth.login.emailLabel")).fill("nobody@e2e.test");
  await page.getByLabel(t("auth.login.passwordLabel")).fill(STUB_PASSWORD);
  await page
    .getByRole("button", { name: t("auth.login.submit"), exact: true })
    .click();

  await expect(toast(page, "Incorrect email or password")).toBeVisible();
});

test("remember me extends the session cookie beyond the browser session", async ({
  page,
}) => {
  await page.goto("/login");

  await page
    .getByLabel(t("auth.login.emailLabel"))
    .fill(STUB_USERS.investor.email);
  await page.getByLabel(t("auth.login.passwordLabel")).fill(STUB_PASSWORD);
  await page.getByLabel(t("auth.login.rememberMe")).check();
  await page
    .getByRole("button", { name: t("auth.login.submit"), exact: true })
    .click();
  await expect(toast(page, t("auth.login.successTitle"))).toBeVisible();

  const cookie = (await page.context().cookies()).find(
    (c) => c.name === "access_token",
  );
  // -1 is Playwright's value for a session cookie; a persistent one has a real
  // expiry. This is the distinction the remember-me work turned on.
  expect(cookie!.expires).toBeGreaterThan(0);
});
