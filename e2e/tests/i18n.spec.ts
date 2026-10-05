import { test, expect } from "@playwright/test";

import { signInAs, useLocale } from "../support/auth";
import { t } from "../support/i18n";
import { settle } from "../support/ui";

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
    await settle(page);

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

  test("the annualised ROI label fits the marketplace card", async ({
    page,
  }) => {
    // "Tỷ suất lợi nhuận năm" is nearly twice the length of the "ROI dự kiến"
    // it replaced, and it sits in a fixed-height callout on every project
    // card. Long copy in a small box is the exact failure this file exists to
    // catch, so the check is a measurement rather than a visibility assertion:
    // the label must not be wider than the box that holds it.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard/projects");
    await settle(page);

    const label = page
      .getByText(t("dashboard.projectCard.expectedRoi", undefined, "vi"), {
        exact: true,
      })
      .first();
    await expect(label).toBeVisible();

    const overflow = await label.evaluate(
      (el) => el.scrollWidth - el.clientWidth,
    );
    expect(
      overflow,
      "ROI label is wider than its container",
    ).toBeLessThanOrEqual(1);

    // And the card it sits in must not push the page sideways.
    const scrollsSideways = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(scrollsSideways, "marketplace scrolls horizontally").toBe(false);
  });
});

test("the same screen works in English", async ({ page, context }) => {
  await signInAs(context, "investor");
  await useLocale(context, "en");
  await page.goto("/dashboard");

  await expect(
    page.getByRole("heading", {
      name: t("dashboard.investor.title", undefined, "en"),
    }),
  ).toBeVisible();
});

test.describe("switching language on the marketing site", () => {
  /**
   * The homepage builds its copy on the SERVER from the NEXT_LOCALE cookie
   * (app/page.tsx), while the header, the tabs and the step cards are client
   * components reading the same locale from context.
   *
   * That split broke in production: the switcher updated React state, the
   * client half changed language, and every server-rendered section — hero,
   * process, partners, team, the team bios — stayed in the previous one. A
   * visitor reading "English" in the switcher saw a Vietnamese page.
   *
   * The fix writes the cookie synchronously and calls router.refresh(); this
   * pins it, because only the server half can regress without the client half
   * noticing.
   */
  test("server-rendered sections follow the switch, not just the chrome", async ({
    page,
    context,
  }) => {
    // Vietnamese is the app default, so English is pinned to have something
    // to switch FROM. The switch itself is what this test is about.
    await useLocale(context, "en");
    await page.goto("/");
    const bodyText = () => page.locator("body").innerText();

    const english = await bodyText();
    expect(english).toContain("Flexible capital for MSMEs");

    await page.getByRole("button", { name: "Vietnamese" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: /Sàn vốn linh hoạt/ }),
    ).toBeVisible();

    const vietnamese = await bodyText();
    // One assertion per server-rendered section: they are separate reads of
    // the same dictionary and could regress independently.
    expect(vietnamese, "hero").toContain("Sàn vốn linh hoạt");
    expect(vietnamese, "process section").toContain(
      "Vay vốn minh bạch hơn nhờ công nghệ",
    );
    expect(vietnamese, "partners section").toContain("Đối tác & chương trình");
    expect(vietnamese, "team section").toContain("Đội ngũ sáng lập");
    expect(vietnamese, "team bio").toContain("Huy dẫn dắt");
    expect(vietnamese, "old language must be gone").not.toContain(
      "Flexible capital for MSMEs",
    );
  });

  test("switches back again", async ({ page, context }) => {
    await useLocale(context, "en");
    await page.goto("/");
    await page.getByRole("button", { name: "Vietnamese" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: /Sàn vốn linh hoạt/ }),
    ).toBeVisible();

    // The switcher labels are themselves translated, so the way back is
    // "Tiếng Anh" rather than "English".
    await page.getByRole("button", { name: "Tiếng Anh" }).click();
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Flexible capital for MSMEs/,
      }),
    ).toBeVisible();
  });
});
