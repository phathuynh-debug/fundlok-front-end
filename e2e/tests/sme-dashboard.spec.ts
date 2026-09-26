import { test, expect } from "@playwright/test";

import {
  MOCK_REPAYMENT_PERIODS,
  MOCK_SME_FUNDING,
  summarizeFunding,
} from "../../app/dashboard/_components/mock-sme-funding";
import { formatCurrency } from "../../lib/format-currency";
import { STUB_PROJECT } from "../stub-api/fixtures";
import { signInAs } from "../support/auth";
import { normalizeSpaces, t } from "../support/i18n";

const summary = summarizeFunding(MOCK_SME_FUNDING, MOCK_REPAYMENT_PERIODS);

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
        normalizeSpaces(formatCurrency(MOCK_SME_FUNDING.funded, "vi")),
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
      hasText: t("dashboard.smeFunding.status.CURRENT"),
    });
    await expect(schedule.getByRole("listitem")).toHaveCount(
      MOCK_REPAYMENT_PERIODS.length,
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

  test("shows relief as its own state, and says the total did not move", async ({
    page,
  }) => {
    // Relief is the mechanic an SME most needs to understand: the daily
    // amount came down, the total owed did not. Flattening it into "paid"
    // would erase the distinction the handbook insists on (fundlok-domain §2).
    await page.goto("/dashboard");
    await expect(
      page.getByText(t("dashboard.smeFunding.status.RELIEF_APPLIED")).first(),
    ).toBeVisible();
    await expect(
      page.getByText(t("dashboard.smeFunding.fixedAtSigning")),
    ).toBeVisible();
  });

  test("discloses the backstop date and the early-settlement rule", async ({
    page,
  }) => {
    // Both are things an SME is entitled to know from the day they sign.
    await page.goto("/dashboard");
    await expect(
      page.getByText(t("dashboard.smeFunding.backstopHint")),
    ).toBeVisible();
    await expect(
      page.getByText(t("dashboard.smeFunding.earlyRepaymentNote")),
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

// --- A refused application ---------------------------------------------------
// The panel used to render "Submitted — awaiting review" for every status that
// was not DRAFT, so a decided application kept telling the applicant their
// documents were still being read.

test.describe("an SME whose application was refused", () => {
  test.beforeEach(async ({ context }) => {
    await signInAs(context, "smeRejectedApplication");
  });

  test("is told the outcome, not that a review is running", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await expect(
      page.getByRole("heading", {
        name: t("dashboard.sme.statusRejectedTitle"),
      }),
    ).toBeVisible();
    await expect(
      page.getByText(t("dashboard.sme.statusSubmittedTitle")),
    ).toHaveCount(0);
    // And the "no action is needed from you right now" footnote is gone,
    // because it is only true while something is still being decided.
    await expect(
      page.getByText(t("dashboard.sme.statusReviewNote")),
    ).toHaveCount(0);
  });

  test("shows the reviewer's reason and what is still missing", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await expect(
      page.getByText(t("dashboard.sme.statusReasonHeading")),
    ).toBeVisible();
    await expect(
      page.getByText(
        "The revenue in the declarations does not match the figures on the form.",
      ),
    ).toBeVisible();

    // The gap in the file, named. Only the CIC report was withheld in the
    // fixture, so the two steps that became typed figures must not appear —
    // listing documents nobody can upload any more is noise, not a gap.
    const missing = page.getByText(t("dashboard.sme.statusMissingHeading"));
    await expect(missing).toBeVisible();
    await expect(page.getByText(/CIC/).last()).toBeVisible();
    await expect(page.getByText("VAT Declarations")).toHaveCount(0);
    await expect(page.getByText("Financial Statement")).toHaveCount(0);
  });
});
