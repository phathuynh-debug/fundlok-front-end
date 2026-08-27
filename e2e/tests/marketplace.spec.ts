import { test, expect } from "@playwright/test";

import { STUB_PUBLIC_PROJECTS } from "../stub-api/fixtures";
import { signInAs } from "../support/auth";
import { t } from "../support/i18n";

// /dashboard/projects — the investor marketplace. Rows come from
// GET /projects/public, so this is real-data-path coverage rather than mock
// rendering.

test.beforeEach(async ({ context, page }) => {
  await signInAs(context, "investor");
  await page.goto("/dashboard/projects");
});

test("lists the available opportunities", async ({ page }) => {
  await expect(
    page.getByRole("heading", {
      name: t("dashboard.projects.title"),
      exact: true,
    }),
  ).toBeVisible();

  for (const project of STUB_PUBLIC_PROJECTS) {
    await expect(page.getByText(project.legal_name)).toBeVisible();
  }
});

test("reports how many opportunities are available", async ({ page }) => {
  await expect(
    page.getByText(
      t("dashboard.projects.opportunitiesAvailable", {
        count: STUB_PUBLIC_PROJECTS.length,
      }),
    ),
  ).toBeVisible();
});

test("each card links through to the project details", async ({ page }) => {
  const first = STUB_PUBLIC_PROJECTS[0];
  const card = page
    .locator("a[href*='/dashboard/project-details']")
    .filter({ hasText: first.legal_name })
    .or(
      page
        .locator("div")
        .filter({ hasText: first.legal_name })
        .locator("a[href*='/dashboard/project-details']"),
    );

  await expect(card.first()).toHaveAttribute(
    "href",
    new RegExp(`/dashboard/project-details\\?id=${first.id}`),
  );
});

test("the details link is the card's only call to action", async ({ page }) => {
  // FE-008 removed "Invest Now" from the card and made "View Details"
  // full-width; a reappearing invest button would be a regression.
  await expect(
    page.getByRole("button", { name: t("dashboard.projects.investNow") }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: t("dashboard.projects.investNow") }),
  ).toHaveCount(0);
});

test("searching for a project narrows the list", async ({ page }) => {
  const target = STUB_PUBLIC_PROJECTS[0];
  const other = STUB_PUBLIC_PROJECTS[1];

  await page
    .getByPlaceholder(t("dashboard.projects.searchPlaceholder"))
    .fill(target.legal_name);

  await expect(page.getByText(target.legal_name)).toBeVisible();
  await expect(page.getByText(other.legal_name)).toHaveCount(0);
});

test("a search that matches nothing explains itself", async ({ page }) => {
  await page
    .getByPlaceholder(t("dashboard.projects.searchPlaceholder"))
    .fill("zzz-no-such-company");

  await expect(
    page.getByText(t("dashboard.projects.noProjectsTitle")),
  ).toBeVisible();
});

test("searching by industry works, not just by name", async ({ page }) => {
  // The placeholder promises "name or industry" — this is that promise.
  const target = STUB_PUBLIC_PROJECTS[1];
  await page
    .getByPlaceholder(t("dashboard.projects.searchPlaceholder"))
    .fill(target.industry);

  await expect(page.getByText(target.legal_name)).toBeVisible();
});
