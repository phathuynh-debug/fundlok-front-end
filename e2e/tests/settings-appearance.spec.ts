import { test, expect } from "@playwright/test";

import { signInAs } from "../support/auth";
import { t } from "../support/i18n";
import { settle } from "../support/ui";

// /dashboard/settings/appearance
//
// Every assertion here checks a real EFFECT, not just that a control moved:
// the theme test reads the class next-themes writes on <html>, the language
// test reads translated copy, and the motion test reads the cookie the layout
// consumes during SSR. A settings page whose switches flip without changing
// anything is the failure mode worth guarding against.

test.beforeEach(async ({ context, page }) => {
  await signInAs(context, "investor");
  await page.goto("/dashboard/settings/appearance");
});

test("renders all three preference groups", async ({ page }) => {
  await expect(
    page.getByRole("heading", {
      name: t("dashboard.settings.appearance.title"),
      exact: true,
    }),
  ).toBeVisible();

  for (const key of ["theme", "language", "motion"] as const) {
    await expect(
      page.getByRole("heading", {
        name: t(`dashboard.settings.appearance.${key}.heading`),
        exact: true,
      }),
    ).toBeVisible();
  }
});

test.describe("theme", () => {
  // Exact match: the radio's accessible name is the label alone (the
  // description is aria-describedby), so "Light" cannot collide with the dark
  // option's "…low light" hint.
  const option = (page: import("@playwright/test").Page, name: string) =>
    page.getByRole("radio", { name, exact: true });

  test("choosing dark applies it to the document immediately", async ({
    page,
  }) => {
    await option(page, t("dashboard.settings.appearance.theme.dark")).click();

    // next-themes sets `class="dark"` on <html> — the actual mechanism every
    // dark: variant in the app keys off.
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("choosing light removes it again", async ({ page }) => {
    await option(page, t("dashboard.settings.appearance.theme.dark")).click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    await option(page, t("dashboard.settings.appearance.theme.light")).click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("the choice survives a reload", async ({ page }) => {
    await option(page, t("dashboard.settings.appearance.theme.dark")).click();
    await page.reload();
    await settle(page);

    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(
      option(page, t("dashboard.settings.appearance.theme.dark")),
    ).toHaveAttribute("aria-checked", "true");
  });

  test("exactly one option is selected at a time", async ({ page }) => {
    await option(page, t("dashboard.settings.appearance.theme.dark")).click();

    const group = page.getByRole("radiogroup", {
      name: t("dashboard.settings.appearance.theme.heading"),
    });
    await expect(group.getByRole("radio")).toHaveCount(3);
    await expect(
      group.locator('[role="radio"][aria-checked="true"]'),
    ).toHaveCount(1);
  });
});

test.describe("language", () => {
  test("switching to Vietnamese translates the page", async ({ page }) => {
    await page
      .getByRole("radio", { name: new RegExp(t("localeSwitcher.vietnamese")) })
      .click();

    await expect(
      page.getByRole("heading", {
        name: t("dashboard.settings.appearance.title", undefined, "vi"),
        exact: true,
      }),
    ).toBeVisible();
  });

  test("the choice survives a reload, because it is server-rendered", async ({
    page,
  }) => {
    // The locale lives in a cookie that app/layout.tsx reads during SSR, so a
    // reload must come back already translated rather than flashing English.
    await page
      .getByRole("radio", { name: new RegExp(t("localeSwitcher.vietnamese")) })
      .click();
    await page.reload();
    await settle(page);

    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
    await expect(
      page.getByRole("heading", {
        name: t("dashboard.settings.appearance.title", undefined, "vi"),
        exact: true,
      }),
    ).toBeVisible();
  });
});

test.describe("reduce motion", () => {
  const toggle = (page: import("@playwright/test").Page) =>
    page.getByRole("switch", {
      name: t("dashboard.settings.appearance.motion.reduceLabel"),
    });

  test("is off by default", async ({ page }) => {
    await expect(toggle(page)).toHaveAttribute("aria-checked", "false");
  });

  test("turning it on writes the cookie the layout reads", async ({
    page,
    context,
  }) => {
    await toggle(page).click();
    await expect(toggle(page)).toHaveAttribute("aria-checked", "true");

    const cookie = (await context.cookies()).find(
      (c) => c.name === "fl_reduce_motion",
    );
    expect(cookie?.value, "preference must be readable during SSR").toBe("1");
  });

  test("the choice survives a reload", async ({ page }) => {
    await toggle(page).click();
    await page.reload();
    await settle(page);

    await expect(toggle(page)).toHaveAttribute("aria-checked", "true");
  });

  test("can be turned back off", async ({ page, context }) => {
    await toggle(page).click();
    await expect(toggle(page)).toHaveAttribute("aria-checked", "true");

    await toggle(page).click();
    await expect(toggle(page)).toHaveAttribute("aria-checked", "false");

    const cookie = (await context.cookies()).find(
      (c) => c.name === "fl_reduce_motion",
    );
    expect(cookie?.value).toBe("0");
  });
});

test("the page does not scroll sideways on a phone", async ({ page }) => {
  // The theme previews are a 3-up grid; they must stack rather than overflow.
  await page.setViewportSize({ width: 390, height: 850 });
  await page.reload();
  await settle(page);

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
});
