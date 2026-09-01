import { test, expect } from "@playwright/test";

import { signInAs } from "../support/auth";
import { t } from "../support/i18n";
import { settle } from "../support/ui";

/**
 * Navigation integrity.
 *
 * This replaces a test that pinned /dashboard/settings/account and
 * /dashboard/settings/billing as known 404s. Those links have since been
 * removed — account capabilities already live on the profile and security
 * pages, and the product has no per-user billing — so rather than pin two more
 * paths by name, this asserts the general rule: the sidebar may only link to
 * routes that exist. That catches the next dead link without anyone
 * remembering to add a case.
 */

test("every sidebar link resolves", async ({ page, context }) => {
  await signInAs(context, "investor");
  await page.goto("/dashboard");
  await settle(page);

  const hrefs = await page
    .locator('nav a[href^="/dashboard"]')
    .evaluateAll((links) => [
      ...new Set(
        links
          .map((link) => link.getAttribute("href"))
          .filter((href): href is string => Boolean(href)),
      ),
    ]);

  // Sanity-check the locator itself: if the nav failed to render, an empty list
  // would make the loop below pass without testing anything.
  expect(hrefs.length, "sidebar links were not found").toBeGreaterThan(4);

  for (const href of hrefs) {
    const response = await page.request.get(href);
    expect(
      response.status(),
      `${href} is linked in the sidebar but returns ${response.status()}`,
    ).toBeLessThan(400);
  }
});

test("settings offers exactly profile and appearance", async ({
  page,
  context,
}) => {
  // Pins the information architecture decision: identity lives on Profile,
  // credentials and sessions on the top-level Security page, and there is no
  // third account page duplicating them.
  await signInAs(context, "investor");
  await page.goto("/dashboard");
  await settle(page);

  const settingsLinks = [
    ...new Set(
      await page
        .locator('nav a[href^="/dashboard/settings"]')
        .evaluateAll((links) => links.map((link) => link.getAttribute("href"))),
    ),
  ];

  expect(settingsLinks).toContain("/dashboard/settings/profile");
  expect(settingsLinks).toContain("/dashboard/settings/appearance");
  // The two removed sections. Named explicitly rather than asserting an exact
  // set, because /dashboard/settings itself is legitimately linked from the
  // mobile nav (it redirects to profile).
  expect(settingsLinks).not.toContain("/dashboard/settings/account");
  expect(settingsLinks).not.toContain("/dashboard/settings/billing");
});

test("security is reachable from the sidebar as a top-level item", async ({
  page,
  context,
}) => {
  // It is not under Settings on purpose — sessions and sign-in alerts are the
  // things a user reaches for in a hurry.
  await signInAs(context, "investor");
  await page.goto("/dashboard");
  await settle(page);

  await page
    .getByRole("link", { name: t("dashboard.sidebar.security"), exact: true })
    .click();

  await expect(page).toHaveURL(/\/dashboard\/security$/);
});
