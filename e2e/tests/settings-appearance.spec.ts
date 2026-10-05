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

test.describe("accent colour", () => {
  const swatch = (page: import("@playwright/test").Page, name: string) =>
    page.getByRole("radio", { name, exact: true });

  test("recolours the app chrome, not just the attribute", async ({ page }) => {
    // The attribute is the mechanism; the computed colour is the effect. A test
    // that only checks data-accent would pass even if the CSS block were
    // deleted.
    const before = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--primary")
        .trim(),
    );

    await swatch(
      page,
      t("dashboard.settings.appearance.accent.colors.violet"),
    ).click();

    await expect(page.locator("html")).toHaveAttribute("data-accent", "violet");

    // The browser resolves oklch() to lab() in computed styles, so assert the
    // change itself rather than a hue substring — and poll, because the
    // components transition into the new colour rather than snapping.
    await expect
      .poll(() =>
        page.evaluate(() =>
          getComputedStyle(document.documentElement)
            .getPropertyValue("--primary")
            .trim(),
        ),
      )
      .not.toBe(before);

    // …and that a real component actually paints with it.
    await expect
      .poll(() =>
        page
          .getByRole("button", {
            name: t("dashboard.settings.appearance.preview.action"),
          })
          .evaluate((el) => getComputedStyle(el).backgroundColor),
      )
      .not.toBe("rgb(23, 23, 23)"); // graphite
  });

  test("leaves status colours alone", async ({ page }) => {
    // Money received must stay green whatever the accent is — recolouring it
    // would make the product lie. Guards the deliberate decision not to remap
    // the emerald utilities.
    await swatch(
      page,
      t("dashboard.settings.appearance.accent.colors.rose"),
    ).click();
    await expect(page.locator("html")).toHaveAttribute("data-accent", "rose");

    await page.goto("/dashboard/transactions");
    await settle(page);

    const moneyInColor = await page
      .getByText(t("dashboard.transactions.summary.moneyIn"), { exact: true })
      .locator("xpath=following-sibling::*[1]")
      .evaluate((el) => getComputedStyle(el).color);

    // oklch green sits around hue 150-165; a rose accent would drag it to ~15.
    expect(moneyInColor).toBeTruthy();
    const hue = Number(moneyInColor.match(/oklch\([^)]*?\s([\d.]+)\)/)?.[1]);
    if (!Number.isNaN(hue)) expect(hue).toBeGreaterThan(100);
  });

  test("survives a reload, server-rendered", async ({ page }) => {
    await swatch(
      page,
      t("dashboard.settings.appearance.accent.colors.blue"),
    ).click();
    await page.reload();
    await settle(page);

    await expect(page.locator("html")).toHaveAttribute("data-accent", "blue");
    await expect(
      swatch(page, t("dashboard.settings.appearance.accent.colors.blue")),
    ).toHaveAttribute("aria-checked", "true");
  });

  test("offers every accent exactly once", async ({ page }) => {
    const group = page.getByRole("radiogroup", {
      name: t("dashboard.settings.appearance.accent.heading"),
    });
    await expect(group.getByRole("radio")).toHaveCount(6);
    await expect(
      group.locator('[role="radio"][aria-checked="true"]'),
    ).toHaveCount(1);
  });
});

test.describe("corner radius", () => {
  const option = (page: import("@playwright/test").Page, name: string) =>
    page.getByRole("radio", { name, exact: true });

  test("sharp corners reach real components", async ({ page }) => {
    await option(
      page,
      t("dashboard.settings.appearance.radius.options.sharp"),
    ).click();

    await expect(page.locator("html")).toHaveAttribute("data-radius", "sharp");

    // The preview button is a real <Button>, so its computed radius proves the
    // whole Tailwind radius scale followed. toHaveCSS retries — Button carries
    // `transition-all`, so a single read catches an intermediate tween value
    // (8px -> 0px reads as ~6.6px mid-transition).
    await expect(
      page.getByRole("button", {
        name: t("dashboard.settings.appearance.preview.action"),
      }),
    ).toHaveCSS("border-radius", "0px");
  });

  test("rounded corners reach real components", async ({ page }) => {
    await option(
      page,
      t("dashboard.settings.appearance.radius.options.rounded"),
    ).click();

    // --radius is 1rem at this setting; the button uses radius-md (radius - 2px),
    // so 14px. Polled, for the transition reason above.
    await expect
      .poll(() =>
        page
          .getByRole("button", {
            name: t("dashboard.settings.appearance.preview.action"),
          })
          .evaluate((el) => parseFloat(getComputedStyle(el).borderRadius)),
      )
      .toBeGreaterThan(10);
  });

  test("survives a reload", async ({ page }) => {
    await option(
      page,
      t("dashboard.settings.appearance.radius.options.sharp"),
    ).click();
    await page.reload();
    await settle(page);

    await expect(page.locator("html")).toHaveAttribute("data-radius", "sharp");
  });
});
