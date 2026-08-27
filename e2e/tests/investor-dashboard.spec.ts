import { test, expect } from "@playwright/test";

import {
  MOCK_HOLDINGS,
  summarizePortfolio,
} from "../../app/dashboard/_components/mock-investor-dashboard";
import { formatCurrency } from "../../lib/format-currency";
import { signInAs } from "../support/auth";
import { normalizeSpaces, t } from "../support/i18n";

const summary = summarizePortfolio(MOCK_HOLDINGS);

// Importing the same mock module the page renders means these assertions verify
// the whole pipeline — summarize → format → DOM — rather than restating numbers
// that could drift from the fixture.

test.beforeEach(async ({ context }) => {
  await signInAs(context, "investor");
});

test("renders the portfolio KPIs from the mock data", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(
    page.getByRole("heading", { name: t("dashboard.investor.title") }),
  ).toBeVisible();

  const totalInvested = formatCurrency(summary.total_invested, "en");
  const totalReturns = formatCurrency(summary.total_returns, "en");

  await expect(
    page.getByText(t("dashboard.investor.totalInvested")),
  ).toBeVisible();
  await expect(
    page.getByText(normalizeSpaces(totalInvested), { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText(normalizeSpaces(totalReturns), { exact: false }),
  ).toBeVisible();

  // Active count excludes the COMPLETED position — the summary's one real rule.
  await expect(
    page.getByText(t("dashboard.investor.activeInvestments")),
  ).toBeVisible();
  await expect(
    page.getByText(String(summary.active_count), { exact: true }),
  ).toBeVisible();
});

test("says out loud that the figures are sample data", async ({ page }) => {
  // A dashboard showing money the user does not have must never look real.
  await page.goto("/dashboard");
  await expect(
    page.getByText(t("dashboard.investor.mockNotice")),
  ).toBeVisible();
});

test("lists every position with its project and industry", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(
    page.getByRole("heading", {
      name: t("dashboard.investor.holdingsTitle", {
        count: MOCK_HOLDINGS.length,
      }),
    }),
  ).toBeVisible();

  const rows = page.getByRole("listitem");
  await expect(rows).toHaveCount(MOCK_HOLDINGS.length);

  for (const holding of MOCK_HOLDINGS) {
    await expect(page.getByText(holding.project_name)).toBeVisible();
  }
});

test("a completed position shows no next payout date", async ({ page }) => {
  await page.goto("/dashboard");

  const completed = MOCK_HOLDINGS.find((h) => h.status === "COMPLETED")!;
  const row = page
    .getByRole("listitem")
    .filter({ hasText: completed.project_name });

  await expect(row).toContainText(
    t("dashboard.investor.holdingStatus.COMPLETED"),
  );
  await expect(row).toContainText(t("common.na"));
  await expect(row).toContainText("100%");
});

test("each position links to its project details", async ({ page }) => {
  await page.goto("/dashboard");

  const first = MOCK_HOLDINGS[0];
  const row = page
    .getByRole("listitem")
    .filter({ hasText: first.project_name });

  await expect(
    row.getByRole("link", { name: t("dashboard.investor.holdingViewDetails") }),
  ).toHaveAttribute("href", `/dashboard/project-details?id=${first.id}`);
});

test.describe("clipped-figure tooltip", () => {
  // The reason this belongs in Playwright and not vitest: the component decides
  // whether to show a tooltip by MEASURING the rendered element
  // (scrollWidth > clientWidth). jsdom performs no layout, so the unit tests
  // have to stub those values — only a real browser proves the behaviour.

  test("reveals the full amount when the card is too narrow to show it", async ({
    page,
  }) => {
    // Narrow enough that a 10-digit VND figure cannot fit its card.
    await page.setViewportSize({ width: 900, height: 900 });
    await page.goto("/dashboard");

    const full = normalizeSpaces(formatCurrency(summary.total_invested, "en"));
    const figure = page.getByText(full, { exact: false }).first();
    await expect(figure).toBeVisible();

    // Confirm the premise — if it is not actually clipped, the tooltip is
    // correctly absent and this test would be asserting nothing.
    const isClipped = await figure.evaluate(
      (el) => el.scrollWidth > el.clientWidth + 1,
    );
    expect(isClipped, "KPI figure should be clipped at this width").toBe(true);

    await figure.hover();
    const tooltip = page.getByRole("tooltip");
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText(full);
  });

  test("stays quiet when the figure already fits", async ({ page }) => {
    // A tooltip repeating fully visible text is noise.
    await page.setViewportSize({ width: 1920, height: 1000 });
    await page.goto("/dashboard");

    const full = normalizeSpaces(formatCurrency(summary.total_invested, "en"));
    const figure = page.getByText(full, { exact: false }).first();

    const isClipped = await figure.evaluate(
      (el) => el.scrollWidth > el.clientWidth + 1,
    );
    expect(isClipped, "KPI figure should fit at this width").toBe(false);

    await figure.hover();
    await expect(page.getByRole("tooltip")).toHaveCount(0);
  });

  test("is reachable by keyboard when clipped", async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 900 });
    await page.goto("/dashboard");

    const full = normalizeSpaces(formatCurrency(summary.total_invested, "en"));
    const figure = page.getByText(full, { exact: false }).first();

    await figure.focus();
    await expect(page.getByRole("tooltip")).toBeVisible();
  });
});
