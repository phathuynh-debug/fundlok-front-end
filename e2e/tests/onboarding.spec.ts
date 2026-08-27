import { test, expect } from "@playwright/test";

import { signInAs } from "../support/auth";
import { t } from "../support/i18n";
import { toast } from "../support/ui";

// The two screens a new account passes through before it has a dashboard:
// /select-role and /verify-email. Both are easy to break and hard to notice,
// because an existing account never sees either again.

test.describe("/select-role", () => {
  test.beforeEach(async ({ context, page }) => {
    await signInAs(context, "noRole");
    await page.goto("/select-role");
  });

  test("offers both roles", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: t("auth.selectRole.title") }),
    ).toBeVisible();
    await expect(page.getByText(t("auth.selectRole.smeTitle"))).toBeVisible();
    await expect(
      page.getByText(t("auth.selectRole.investorTitle")),
    ).toBeVisible();
  });

  test("explains what each role is for", async ({ page }) => {
    // Users pick once and cannot change it themselves, so the descriptions are
    // load-bearing rather than decorative.
    await expect(
      page.getByText(t("auth.selectRole.smeDescription")),
    ).toBeVisible();
    await expect(
      page.getByText(t("auth.selectRole.investorDescription")),
    ).toBeVisible();
  });

  test("selecting a role confirms and moves the user on", async ({ page }) => {
    const investorCard = page
      .locator("div")
      .filter({ hasText: t("auth.selectRole.investorTitle") })
      .last();

    await investorCard
      .getByRole("button", { name: t("auth.selectRole.select") })
      .click();

    await expect(toast(page, t("auth.selectRole.successTitle"))).toBeVisible();
  });
});

test.describe("/verify-email", () => {
  test.beforeEach(async ({ context, page }) => {
    await signInAs(context, "unverifiedEmail");
    await page.goto("/verify-email");
  });

  test("tells the user where the link was sent", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: t("auth.verifyEmail.title") }),
    ).toBeVisible();
    await expect(
      page.getByText(t("auth.verifyEmail.statusLabel")),
    ).toBeVisible();
    await expect(page.getByText("unverified@e2e.test")).toBeVisible();
  });

  test("can resend the verification email", async ({ page }) => {
    await page
      .getByRole("button", { name: t("auth.verifyEmail.resendBtn") })
      .click();

    await expect(
      page.getByText(t("auth.verifyEmail.resendSuccess")).first(),
    ).toBeVisible();
  });

  test("offers a way out without verifying", async ({ page }) => {
    // Without this the screen is a trap: an unverified user cannot reach any
    // other page, so signing out has to be available here.
    await expect(
      page.getByRole("button", { name: t("auth.verifyEmail.logoutBtn") }),
    ).toBeVisible();
  });

  test("signing out returns the user to a public page", async ({ page }) => {
    await page
      .getByRole("button", { name: t("auth.verifyEmail.logoutBtn") })
      .click();

    await expect(page).toHaveURL(/\/(login)?$/);
  });
});
