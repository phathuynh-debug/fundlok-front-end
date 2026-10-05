import { test, expect } from "@playwright/test";

import { STUB_PUBLIC_PROJECTS } from "../stub-api/fixtures";
import { signInAs } from "../support/auth";
import { t } from "../support/i18n";
import { settle } from "../support/ui";

// /dashboard/project-details?id=… — reached from a marketplace card. The page
// reads the id from the query string and finds the project in the public list,
// so a missing or unknown id is a real code path rather than a 404 route.

const project = STUB_PUBLIC_PROJECTS[0];

test.beforeEach(async ({ context }) => {
  await signInAs(context, "investor");
});

test("shows the project it was asked for", async ({ page }) => {
  await page.goto(`/dashboard/project-details?id=${project.id}`);

  await expect(page.getByText(project.legal_name).first()).toBeVisible();
});

test("offers a way back to the marketplace", async ({ page }) => {
  await page.goto(`/dashboard/project-details?id=${project.id}`);

  const back = page.getByRole("link", {
    name: t("dashboard.projectDetails.backToMarketplace"),
  });
  await expect(back).toBeVisible();
  await back.click();
  await expect(page).toHaveURL(/\/dashboard\/projects$/);
});

test("renders both tab controls", async ({ page }) => {
  await page.goto(`/dashboard/project-details?id=${project.id}`);

  // NOTE: these are plain <button>s — no role="tab", no aria-selected, no
  // arrow-key navigation. So this asserts by accessible NAME and by what the
  // panel shows, not by tab semantics. Worth fixing in the component; until
  // then a getByRole("tab") assertion here would simply never match.
  await expect(
    page.getByRole("button", {
      name: t("dashboard.projectDetails.riskAssessment"),
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: t("dashboard.projectDetails.dueDiligence"),
    }),
  ).toBeVisible();
});

test("switching tabs swaps the panel content", async ({ page }) => {
  await page.goto(`/dashboard/project-details?id=${project.id}`);

  // Risk is the default panel.
  await expect(page.getByText(t("investment.risk.title"))).toBeVisible();

  await page
    .getByRole("button", { name: t("dashboard.projectDetails.dueDiligence") })
    .click();

  await expect(
    page.getByText(t("investment.dueDiligence.title")),
  ).toBeVisible();
  await expect(page.getByText(t("investment.risk.title"))).toHaveCount(0);

  // And back again, so the swap is not one-way.
  await page
    .getByRole("button", { name: t("dashboard.projectDetails.riskAssessment") })
    .click();
  await expect(page.getByText(t("investment.risk.title"))).toBeVisible();
});

test("money on this page is VND, never dollars", async ({ page }) => {
  // Three hardcoded "$" figures survived the VND conversion on this screen and
  // had to be fixed by hand; this is the guard that would have caught them.
  await page.goto(`/dashboard/project-details?id=${project.id}`);
  await settle(page);

  const body = await page.locator("main").last().innerText();
  const dollarAmounts = body.match(/\$\s?[0-9][0-9,.]*/g);
  expect(
    dollarAmounts,
    `dollar amounts on a VND-only screen: ${dollarAmounts?.join(", ")}`,
  ).toBeNull();
});

test("an unknown project id does not crash the page", async ({ page }) => {
  await page.goto(
    "/dashboard/project-details?id=99999999-9999-9999-9999-999999999999",
  );
  await settle(page);

  // Whatever it shows — fallback copy or an empty state — it must not be a
  // Next error overlay or a blank document.
  await expect(page.locator("main").last()).not.toBeEmpty();
  await expect(page.getByText("Application error")).toHaveCount(0);
});

test("a missing project id does not crash the page", async ({ page }) => {
  await page.goto("/dashboard/project-details");
  await settle(page);

  await expect(page.locator("main").last()).not.toBeEmpty();
  await expect(page.getByText("Application error")).toHaveCount(0);
});
