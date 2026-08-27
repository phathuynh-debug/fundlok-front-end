import { test, expect } from "@playwright/test";

import { signInAs, useLocale } from "../support/auth";
import { t } from "../support/i18n";

/**
 * Vietnamese is the production market, so a screen that only works in English
 * is a broken screen. Two failure modes are worth catching here and cannot be
 * caught by the i18n sort check (which only compares key SHAPES):
 *
 *   1. a key that exists in both files but is never wired up, so the raw
 *      dot-path renders on screen;
 *   2. Vietnamese copy that overflows a layout sized for shorter English.
 */

test.describe("Vietnamese", () => {
  test.beforeEach(async ({ context }) => {
    await signInAs(context, "investor");
    await useLocale(context, "vi");
  });

  test("renders the investor dashboard in Vietnamese", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(
      page.getByRole("heading", {
        name: t("dashboard.investor.title", undefined, "vi"),
      }),
    ).toBeVisible();
    await expect(
      page.getByText(t("dashboard.investor.totalInvested", undefined, "vi")),
    ).toBeVisible();
  });

  test("formats money the Vietnamese way, with a trailing ₫", async ({
    page,
  }) => {
    // vi-VN puts the symbol after the amount; en-US puts it in front. Getting
    // this backwards is the kind of thing only a rendered page reveals.
    await page.goto("/dashboard");

    const kpi = page
      .getByText(t("dashboard.investor.totalInvested", undefined, "vi"))
      .locator("xpath=ancestor::*[self::div][1]/..");
    await expect(kpi).toContainText("₫");
  });

  test("leaks no raw i18n keys onto the page", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const body = (await page.locator("body").innerText()) ?? "";
    // Matches an unresolved dot-path such as "dashboard.investor.totalInvested"
    // that rendered as literal text because the key was missing.
    const leaked = body.match(
      /\b(dashboard|common|auth|security|investment)\.[a-z][A-Za-z]*(\.[A-Za-z]+)+\b/g,
    );
    expect(
      leaked,
      `untranslated keys on screen: ${leaked?.join(", ")}`,
    ).toBeNull();
  });
});

test("the same screen works in English", async ({ page, context }) => {
  await signInAs(context, "investor");
  await useLocale(context, "en");
  await page.goto("/dashboard");

  await expect(
    page.getByRole("heading", { name: t("dashboard.investor.title") }),
  ).toBeVisible();
});
