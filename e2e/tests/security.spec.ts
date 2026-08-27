import { test, expect } from "@playwright/test";

import { STUB_PASSWORD } from "../stub-api/fixtures";
import { signInAs } from "../support/auth";
import { t } from "../support/i18n";
import { toast } from "../support/ui";

// /dashboard/security is half real and half mocked, and the split matters: the
// session list and activity feed come from the API (refresh_tokens and
// audit_logs), while the protection rows for 2FA and passkeys have no backend
// at all. The tests below pin that boundary — a future change that starts
// claiming 2FA is "on" should fail here.

test.beforeEach(async ({ context, page }) => {
  await signInAs(context, "investor");
  await page.goto("/dashboard/security");
});

test("shows the security posture and protection list", async ({ page }) => {
  await expect(
    page.getByRole("heading", {
      name: t("dashboard.security.title"),
      exact: true,
    }),
  ).toBeVisible();

  for (const key of [
    "password",
    "totp",
    "withdrawalLock",
    "passkey",
    "loginAlerts",
  ]) {
    await expect(
      page.getByText(t(`dashboard.security.protections.items.${key}`), {
        exact: true,
      }),
    ).toBeVisible();
  }
});

test("never claims two-factor auth or passkeys are enabled", async ({
  page,
}) => {
  // There is no TOTP library and no WebAuthn on either side, so these rows must
  // read "unavailable" and their buttons must be dead. A switch that pretends
  // to arm 2FA is worse than no switch.
  for (const key of ["totp", "passkey"]) {
    const row = page.getByRole("listitem").filter({
      hasText: t(`dashboard.security.protections.items.${key}`),
    });
    await expect(row).toContainText(
      t("dashboard.security.protections.state.unavailable"),
    );
    await expect(
      row.getByRole("button", {
        name: t("dashboard.security.protections.action.unavailable"),
      }),
    ).toBeDisabled();
  }
});

test("lists the signed-in device from the API", async ({ page }) => {
  // Served by the stub as the current session, so this covers the real
  // /auth/sessions path rather than a fixture in the page.
  await expect(
    page.getByText("Chrome", { exact: false }).first(),
  ).toBeVisible();
  await expect(
    page.getByText(t("dashboard.security.sessions.currentAction")),
  ).toBeVisible();
});

test("the current session cannot be signed out from the list", async ({
  page,
}) => {
  // Revoking your own session from this screen would log you out mid-page; the
  // row shows "In use" instead of a button.
  const current = page.getByRole("listitem").filter({
    hasText: t("dashboard.security.sessions.currentAction"),
  });
  // Assert the row exists BEFORE asserting anything about its contents —
  // otherwise a list that failed to render passes this test vacuously.
  await expect(current).toHaveCount(1);

  // The button on your own session is relabelled "In use" and disabled, rather
  // than offering a "Sign out" that would end the session you are reading from.
  await expect(
    current.getByRole("button", {
      name: t("dashboard.security.sessions.currentAction"),
      exact: true,
    }),
  ).toBeDisabled();
  await expect(
    current.getByRole("button", {
      name: t("dashboard.security.sessions.revoke"),
      exact: true,
    }),
  ).toHaveCount(0);

  // The other device, by contrast, can be signed out.
  const other = page.getByRole("listitem").filter({ hasText: "iPhone" });
  await expect(
    other.getByRole("button", {
      name: t("dashboard.security.sessions.revoke"),
      exact: true,
    }),
  ).toBeEnabled();
});

test("signing out everywhere else reports how many sessions ended", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: t("dashboard.security.sessions.revokeAll") })
    .click();

  await expect(
    toast(page, t("dashboard.security.sessions.revokedAllTitle")),
  ).toBeVisible();
});

test("shows the account's security history", async ({ page }) => {
  // From audit_logs via /auth/security-events — the stub returns a SIGN_IN.
  await expect(page.getByText("127.0.0.1").first()).toBeVisible();
});

test.describe("sign-in alerts", () => {
  test("can be turned on, and the row updates", async ({ page }) => {
    const row = page.getByRole("listitem").filter({
      hasText: t("dashboard.security.protections.items.loginAlerts"),
    });

    await expect(row).toContainText(
      t("dashboard.security.protections.state.off"),
    );
    await row
      .getByRole("button", {
        name: t("dashboard.security.protections.action.turnOn"),
      })
      .click();

    await expect(row).toContainText(
      t("dashboard.security.protections.state.on"),
    );
  });
});

test.describe("change password", () => {
  const openDialog = async (page: import("@playwright/test").Page) => {
    const row = page.getByRole("listitem").filter({
      hasText: t("dashboard.security.protections.items.password"),
    });
    await row
      .getByRole("button", {
        name: t("dashboard.security.protections.action.managed"),
      })
      .click();
    await expect(
      page.getByRole("dialog", { name: t("security.changePassword.title") }),
    ).toBeVisible();
  };

  test("opens from the password row", async ({ page }) => {
    await openDialog(page);
    await expect(
      page.getByText(t("security.changePassword.revokeNotice")),
    ).toBeVisible();
  });

  test("rejects a mismatched confirmation before calling the API", async ({
    page,
  }) => {
    await openDialog(page);

    await page
      .getByLabel(t("security.changePassword.currentLabel"))
      .fill(STUB_PASSWORD);
    await page
      .getByLabel(t("security.changePassword.newLabel"), { exact: true })
      .fill("a-new-password");
    await page
      .getByLabel(t("security.changePassword.confirmLabel"))
      .fill("something-else");
    await page
      .getByRole("button", { name: t("security.changePassword.submit") })
      .click();

    await expect(
      page.getByText(t("security.changePassword.errorMismatch")),
    ).toBeVisible();
  });

  test("rejects a password shorter than the minimum", async ({ page }) => {
    await openDialog(page);

    await page
      .getByLabel(t("security.changePassword.currentLabel"))
      .fill(STUB_PASSWORD);
    await page
      .getByLabel(t("security.changePassword.newLabel"), { exact: true })
      .fill("short");
    await page
      .getByLabel(t("security.changePassword.confirmLabel"))
      .fill("short");
    await page
      .getByRole("button", { name: t("security.changePassword.submit") })
      .click();

    await expect(
      page.getByText(t("security.changePassword.errorLength", { min: 8 })),
    ).toBeVisible();
  });

  test("surfaces the backend's rejection of a wrong current password", async ({
    page,
  }) => {
    await openDialog(page);

    await page
      .getByLabel(t("security.changePassword.currentLabel"))
      .fill("not-my-password");
    await page
      .getByLabel(t("security.changePassword.newLabel"), { exact: true })
      .fill("a-new-password");
    await page
      .getByLabel(t("security.changePassword.confirmLabel"))
      .fill("a-new-password");
    await page
      .getByRole("button", { name: t("security.changePassword.submit") })
      .click();

    await expect(page.getByText("Current password is incorrect")).toBeVisible();
  });

  test("succeeds and says how many other sessions were ended", async ({
    page,
  }) => {
    // The count is load-bearing: a user who does not expect to be signed out
    // elsewhere will think something broke.
    await openDialog(page);

    await page
      .getByLabel(t("security.changePassword.currentLabel"))
      .fill(STUB_PASSWORD);
    await page
      .getByLabel(t("security.changePassword.newLabel"), { exact: true })
      .fill("a-brand-new-password");
    await page
      .getByLabel(t("security.changePassword.confirmLabel"))
      .fill("a-brand-new-password");
    await page
      .getByRole("button", { name: t("security.changePassword.submit") })
      .click();

    await expect(
      toast(page, t("security.changePassword.successTitle")),
    ).toBeVisible();
    await expect(
      toast(
        page,
        t("security.changePassword.successDescription", { count: 2 }),
      ),
    ).toBeVisible();
  });
});
