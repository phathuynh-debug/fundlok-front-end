import { test, expect } from "@playwright/test";

import { signInAs } from "../support/auth";
import { t } from "../support/i18n";

/**
 * The notifications bell.
 *
 * It rendered a hardcoded list until the API landed. These tests hold the two
 * things that make it a real feature rather than a decoration: the badge
 * reflects the server's unread count, and marking read persists across a
 * reload rather than living in component state.
 */

const openBell = async (page: import("@playwright/test").Page) => {
  // The accessible name carries the count, so match on the prefix rather than
  // on the exact string — the count changes as the test marks things read.
  const bell = page
    .getByRole("button", { name: new RegExp(t("notifications.title")) })
    .first();
  await bell.hover();
  await expect(page.getByText(t("notifications.title"))).toBeVisible();
  return bell;
};

test.describe("an SME with notifications", () => {
  test.beforeEach(async ({ context }) => {
    await signInAs(context, "sme");
  });

  test("the bell announces how many are unread", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(
      page
        .getByRole("button", {
          name: t("notifications.ariaLabelUnread").replace("{count}", "1"),
        })
        .first(),
    ).toBeVisible();
  });

  test("lists what the API returned, in the reader's language", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await openBell(page);

    await expect(
      page.getByText(t("notifications.items.applicationRejected")),
    ).toBeVisible();
    await expect(
      page.getByText(t("notifications.items.applicationApproved")),
    ).toBeVisible();
  });

  test("marking all read survives a reload", async ({ page }) => {
    // The old panel cleared the badge in component state, so a refresh brought
    // it back. This is the difference the API makes.
    await page.goto("/dashboard");
    await openBell(page);
    await page.getByText(t("notifications.markAllRead")).click();

    await expect(
      page.getByRole("button", { name: t("notifications.ariaLabel") }).first(),
    ).toBeVisible();

    await page.reload();
    await expect(
      page.getByRole("button", { name: t("notifications.ariaLabel") }).first(),
    ).toBeVisible();
  });
});

test("an investor with no notifications sees an empty bell", async ({
  page,
  context,
}) => {
  await signInAs(context, "investor");
  await page.goto("/dashboard");

  await expect(
    page.getByRole("button", { name: t("notifications.ariaLabel") }).first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: t("notifications.ariaLabel") })
    .first()
    .hover();
  await expect(page.getByText(t("notifications.empty"))).toBeVisible();
});
