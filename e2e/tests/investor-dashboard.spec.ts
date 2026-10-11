import { test, expect } from "@playwright/test";

import { signInAs } from "../support/auth";
import { t } from "../support/i18n";

test.beforeEach(async ({ context }) => {
  await signInAs(context, "investor");
});

test("shows the investor dashboard with empty state", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(
    page.getByRole("heading", { name: t("dashboard.investor.title") }),
  ).toBeVisible();

  await expect(
    page.getByRole("heading", {
      name: t("dashboard.investor.noInvestmentsTitle"),
    }),
  ).toBeVisible();

  await expect(
    page.getByText(t("dashboard.investor.noInvestmentsDescription")),
  ).toBeVisible();

  const cta = page.getByRole("link", {
    name: t("dashboard.investor.browseProjects"),
  });
  await expect(cta).toBeVisible();
  await expect(cta).toHaveAttribute("href", "/dashboard/projects");
});

test("navigates to projects from the empty state CTA", async ({ page }) => {
  await page.goto("/dashboard");

  const cta = page.getByRole("link", {
    name: t("dashboard.investor.browseProjects"),
  });
  await cta.click();
  await expect(page).toHaveURL(/\/dashboard\/projects$/);
});
