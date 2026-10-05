import { test, expect } from "@playwright/test";

import { signInAs } from "../support/auth";
import { t } from "../support/i18n";

// /dashboard/analytics is two different screens. FE-013 made the SME view
// deliberately unlike the investor one — a borrower cares about their own
// repayment progress and grade, not about portfolio allocation — so the most
// valuable assertions here are the ones that would fail if the two ever
// collapsed back into one shared screen.

test.describe("investor analytics", () => {
  test.beforeEach(async ({ context, page }) => {
    await signInAs(context, "investor");
    await page.goto("/dashboard/analytics");
  });

  test("shows the portfolio charts", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        name: t("dashboard.analytics.title"),
        exact: true,
      }),
    ).toBeVisible();

    for (const key of [
      "dashboard.analytics.charts.capitalFlowTitle",
      "dashboard.analytics.charts.monthlyReturnsTitle",
      "dashboard.analytics.charts.allocationTitle",
    ]) {
      await expect(page.getByText(t(key), { exact: true })).toBeVisible();
    }
  });

  test("renders the industry allocation chart, not just its heading", async ({
    page,
  }) => {
    // A Recharts pie that fails to mount leaves the card heading in place and
    // an empty box beneath it, so the heading alone proves nothing.
    const slices = page.locator(
      "svg .recharts-pie-sector, svg path.recharts-sector",
    );
    await expect(slices.first()).toBeVisible({ timeout: 15_000 });
  });

  test("KPI tiles are present", async ({ page }) => {
    await expect(page.locator("svg.recharts-surface").first()).toBeVisible();
    await expect(
      page.getByText(t("dashboard.analytics.mockNotice")),
    ).toBeVisible();
  });

  test("does not show the SME loan view", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        name: t("dashboard.smeAnalytics.title"),
        exact: true,
      }),
    ).toHaveCount(0);
  });
});

test.describe("SME analytics", () => {
  test.beforeEach(async ({ context, page }) => {
    await signInAs(context, "sme");
    await page.goto("/dashboard/analytics");
  });

  test("shows the loan analytics screen", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        name: t("dashboard.smeAnalytics.title"),
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(t("dashboard.smeAnalytics.mockNotice")),
    ).toBeVisible();
  });

  test("does not show the investor portfolio view", async ({ page }) => {
    // The whole point of FE-013: an SME must not be shown capital allocation
    // across other people's projects.
    await expect(
      page.getByText(t("dashboard.analytics.charts.allocationTitle"), {
        exact: true,
      }),
    ).toHaveCount(0);
  });

  test("renders its charts", async ({ page }) => {
    await expect(page.locator("svg.recharts-surface").first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
