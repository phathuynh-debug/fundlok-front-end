import { test, expect } from "@playwright/test";

import { STUB_PROJECT } from "../stub-api/fixtures";
import { signInAs } from "../support/auth";
import { t } from "../support/i18n";

/**
 * The amber "sample data" notice, in either language. The dashboard used to end
 * with a panel of sample funding and repayment figures that carried one; it
 * shows nothing of the kind now, so any such notice would be the panel back.
 */
const SAMPLE_NOTICE = /Dữ liệu mẫu|Sample data/;

/** The raised amount of the old sample panel (875.000.000 ₫, 14 investors). */
const SAMPLE_RAISED = "875.000.000";

test.describe("an SME with a project", () => {
  test.beforeEach(async ({ context }) => {
    await signInAs(context, "sme");
  });

  test("sees its real company profile in the hero", async ({ page }) => {
    // Everything in the hero comes from GET /projects — the stub's fixture —
    // so this proves the real data path.
    await page.goto("/dashboard");

    await expect(
      page.getByRole("heading", { name: STUB_PROJECT.legal_name }),
    ).toBeVisible();
    await expect(page.getByText(STUB_PROJECT.tax_id)).toBeVisible();
    // The status is shown as a translated label, not the raw enum.
    await expect(
      page.getByText(t(`enums.projectStatus.${STUB_PROJECT.status}`)).first(),
    ).toBeVisible();
  });

  test("sees no sample funding or repayment figures", async ({ page }) => {
    // The dashboard used to end with a panel of invented figures: 875m raised
    // of 1bn, 14 investors, a repayment schedule. Nothing real backs them (the
    // contract and ledger have no read API), and showing them to every SME,
    // approved or not, said things that were not true.
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: STUB_PROJECT.legal_name }),
    ).toBeVisible();

    await expect(page.getByText(SAMPLE_NOTICE)).toHaveCount(0);
    await expect(page.getByText(SAMPLE_RAISED, { exact: false })).toHaveCount(
      0,
    );
  });

  test("is not told about funding before there is an approval", async ({
    page,
  }) => {
    // This application is still with the reviewers (SUBMITTED).
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: STUB_PROJECT.legal_name }),
    ).toBeVisible();

    await expect(page.getByTestId("funding-status")).toHaveCount(0);
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

  test("sees no sample figures, because there is nothing funded", async ({
    page,
    context,
  }) => {
    await signInAs(context, "smeNoProject");
    await page.goto("/dashboard");

    await expect(
      page.getByRole("heading", { name: t("dashboard.sme.emptyTitle") }),
    ).toBeVisible();
    await expect(page.getByText(SAMPLE_NOTICE)).toHaveCount(0);
    await expect(page.getByTestId("funding-status")).toHaveCount(0);
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
    // A refusal has no funding to speak of.
    await expect(page.getByTestId("funding-status")).toHaveCount(0);
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

test.describe("an SME whose request was approved", () => {
  test.beforeEach(async ({ context }) => {
    await signInAs(context, "smeApprovedApplication");
  });

  test("is congratulated once, with the score and rate", async ({ page }) => {
    await page.goto("/dashboard");

    const dialog = page.getByRole("dialog", {
      name: t("dashboard.sme.approval.celebrateTitle"),
    });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(t("dashboard.sme.approval.score"));
    // The numbers count up; wait for where they land.
    await expect(dialog).toContainText("60.16");
    await expect(dialog).toContainText("15.19%");

    await dialog
      .getByRole("button", { name: t("dashboard.sme.approval.celebrateCta") })
      .click();
    await expect(dialog).toHaveCount(0);

    // Seen once: a reload does not celebrate again.
    await page.reload();
    await expect(page.getByTestId("approval-summary")).toBeVisible();
    await expect(
      page.getByRole("dialog", {
        name: t("dashboard.sme.approval.celebrateTitle"),
      }),
    ).toHaveCount(0);
  });

  test("shows the decision as the finished last step, with the terms", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.keyboard.press("Escape");

    await expect(
      page.getByRole("heading", {
        name: t("dashboard.sme.statusApprovedTitle"),
      }),
    ).toBeVisible();
    // No longer "awaiting review", although `status` is still UNDER_REVIEW.
    await expect(
      page.getByText(t("dashboard.sme.statusReviewNote")),
    ).toHaveCount(0);

    const summary = page.getByTestId("approval-summary");
    await expect(summary).toContainText("60.16");
    await expect(summary).toContainText("15.19%");
    await expect(summary).toContainText(/53[.,]164[.,]039/);
    await expect(summary).toContainText(/483[.,]309/);
    // The compliance wording: a reference, not a rating, and no promise.
    await expect(summary).toContainText(t("dashboard.sme.approval.disclaimer"));
    // Nothing is "still missing" on an approval (the registration is the
    // verified certificate, not an upload).
    await expect(
      page.getByText(t("dashboard.sme.statusMissingHeading")),
    ).toHaveCount(0);
  });

  test("says that nothing has been invested yet, and shows no sample figures", async ({
    page,
  }) => {
    // Approved is not funded: investors fund the listing after the offer is
    // signed. There is nothing real to show about funding, so the dashboard
    // says so rather than inventing progress.
    await page.goto("/dashboard");
    await page.keyboard.press("Escape");

    const funding = page.getByTestId("funding-status");
    await expect(funding).toBeVisible();
    await expect(funding).toContainText(t("dashboard.sme.funding.none"));
    // No promise: whether investors fund it is theirs to decide.
    await expect(funding).toContainText(t("dashboard.sme.funding.noneHint"));

    await expect(page.getByText(SAMPLE_NOTICE)).toHaveCount(0);
    await expect(page.getByText(SAMPLE_RAISED, { exact: false })).toHaveCount(
      0,
    );
  });
});
