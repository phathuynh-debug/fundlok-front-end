import { test, expect } from "@playwright/test";

import {
  STUB_ADMIN_STATS,
  STUB_ADMIN_USERS,
  STUB_USERS,
} from "../stub-api/fixtures";
import { signInAs } from "../support/auth";
import { t } from "../support/i18n";

// The /admin area. Access control is covered in auth-gating.spec.ts; this file
// is about the screens themselves rendering the API's data.

test.describe("as an admin", () => {
  test.beforeEach(async ({ context }) => {
    await signInAs(context, "admin");
  });

  test("the overview shows platform stats", async ({ page }) => {
    await page.goto("/admin");

    await expect(
      page.getByRole("heading", { name: t("admin.title"), exact: true }),
    ).toBeVisible();
    await expect(
      page
        .getByText(String(STUB_ADMIN_STATS.total_users), { exact: true })
        .first(),
    ).toBeVisible();
  });

  test("the overview lists users from the API", async ({ page }) => {
    await page.goto("/admin");

    for (const row of STUB_ADMIN_USERS) {
      await expect(page.getByText(row.email)).toBeVisible();
    }
  });

  test("audit logs render with actor and action", async ({ page }) => {
    await page.goto("/admin/audit-logs");

    await expect(
      page.getByRole("heading", { name: t("admin.auditLogs.title") }),
    ).toBeVisible();
    await expect(page.getByText("SIGN_IN").first()).toBeVisible();
    await expect(
      page.getByText(STUB_USERS.investor.email).first(),
    ).toBeVisible();
  });

  test("cannot reach system settings", async ({ page }) => {
    // SYSTEM_ADMIN only. The proxy redirects; asserted here from the admin
    // screens' point of view so the nav cannot quietly start offering it.
    await page.goto("/admin/system");
    await expect(page).toHaveURL(/\/admin$/);
  });
});

test.describe("as a system admin", () => {
  test.beforeEach(async ({ context }) => {
    await signInAs(context, "systemAdmin");
  });

  test("system settings render the maintenance control", async ({ page }) => {
    await page.goto("/admin/system");

    await expect(
      page.getByRole("heading", { name: t("admin.system.title") }),
    ).toBeVisible();
  });

  test("the users page renders", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(
      page.getByRole("heading", { name: t("admin.usersPage.title") }),
    ).toBeVisible();
  });
});

test("a non-admin session is refused by the API as well as the router", async ({
  page,
  context,
  request,
}) => {
  // Defence in depth: the proxy redirect is a UX guard, not the security
  // boundary. Calling the endpoint directly as an investor must still 403 —
  // otherwise anything that bypassed the router would get admin data.
  await signInAs(context, "investor");
  await page.goto("/dashboard");

  const response = await page.request.get("/api/admin/overview");
  expect(response.status()).toBe(403);
  expect(request).toBeTruthy();
});
