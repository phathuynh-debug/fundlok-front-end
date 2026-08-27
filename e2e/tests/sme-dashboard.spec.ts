import { test, expect } from "@playwright/test";

import {
  MOCK_INSTALLMENTS,
  MOCK_SME_FUNDING,
  summarizeFunding,
} from "../../app/dashboard/_components/mock-sme-funding";
import { formatCurrency } from "../../lib/format-currency";
import { STUB_PROJECT } from "../stub-api/fixtures";
import { signInAs } from "../support/auth";
import { normalizeSpaces, t } from "../support/i18n";

const summary = summarizeFunding(MOCK_SME_FUNDING, MOCK_INSTALLMENTS);

test.describe("an SME with a project", () => {
  test.beforeEach(async ({ context }) => {
    await signInAs(context, "sme");
  });

  test("sees its real company profile in the hero", async ({ page }) => {
    // Everything in the hero comes from GET /projects — the stub's fixture —
    // so this proves the real data path, not the mock panel below it.
    await page.goto("/dashboard");

    await expect(
      page.getByRole("heading", { name: STUB_PROJECT.legal_name }),
    ).toBeVisible();
    await expect(page.getByText(STUB_PROJECT.tax_id)).toBeVisible();
    await expect(page.getByText(STUB_PROJECT.status).first()).toBeVisible();
  });

  test("sees the funding and repayment panel", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(
      page.getByRole("heading", { name: t("dashboard.smeFunding.title") }),
    ).toBeVisible();

    // Raised, and the percentage derived from it.
    await expect(
      page.getByText(
        normalizeSpaces(formatCurrency(MOCK_SME_FUNDING.funded, "en")),
        { exact: false },
      ),
    ).toBeVisible();
    await expect(page.getByText(`${summary.funded_pct}%`)).toBeVisible();
  });

  test("distinguishes the mocked figures from the real profile", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByText(t("dashboard.smeFunding.mockNotice")),
    ).toBeVisible();
  });

  test("renders the full repayment schedule", async ({ page }) => {
    await page.goto("/dashboard");

    const schedule = page.getByRole("list").filter({
      hasText: t("dashboard.smeFunding.status.DUE"),
    });
    await expect(schedule.getByRole("listitem")).toHaveCount(
      MOCK_INSTALLMENTS.length,
    );

    await expect(
      page.getByText(
        t("dashboard.smeFunding.scheduleProgress", {
          done: summary.settled_count,
          total: summary.total_count,
        }),
      ),
    ).toBeVisible();
  });

  test("shows early repayment as its own state, not just paid", async ({
    page,
  }) => {
    // Early repayment is a platform value (CLAUDE.md); flattening it into
    // "paid" would erase it from the borrower's view.
    await page.goto("/dashboard");
    await expect(
      page.getByText(t("dashboard.smeFunding.status.EARLY")),
    ).toBeVisible();
  });

  test("is kept off the marketplace", async ({ page }) => {
    await page.goto("/dashboard/projects");
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});

test.describe("an SME with no project yet", () => {
  test("is invited to apply for funding", async ({ page, context }) => {
    await signInAs(context, "smeNoProject");
    await page.goto("/dashboard");

    await expect(
      page.getByRole("heading", { name: t("dashboard.sme.emptyTitle") }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: t("dashboard.sme.emptyCta") }),
    ).toHaveAttribute("href", "/project-application");
  });

  test("sees no funding panel, because there is nothing funded", async ({
    page,
    context,
  }) => {
    await signInAs(context, "smeNoProject");
    await page.goto("/dashboard");

    await expect(
      page.getByRole("heading", { name: t("dashboard.smeFunding.title") }),
    ).toHaveCount(0);
  });
});
