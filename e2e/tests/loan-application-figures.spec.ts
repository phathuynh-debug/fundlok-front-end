import { test, expect } from "@playwright/test";

import { signInAs } from "../support/auth";
import { t } from "../support/i18n";
import { settle } from "../support/ui";

/**
 * The Lite grading steps of the loan-application wizard.
 *
 * Steps 2 and 3 used to demand documents — the VAT step alone asked for a zip
 * of 48 files — to supply figures the parser never actually read. They now
 * collect those figures as typed input. This is the browser-level proof that
 * the replacement works: that the figure steps render, and that they refuse to
 * advance on missing or impossible numbers.
 *
 * The remaining steps still take files, but uploads are staged locally and
 * deferred until Send, so reaching step 2 needs no R2 and no presigned URLs.
 */

/** A small in-memory PDF, enough to pass client-side file validation. */
const stubFile = (name: string) => ({
  name,
  mimeType: "application/pdf",
  buffer: Buffer.from("%PDF-1.4\n% e2e stub\n"),
});

async function openWizard(page: import("@playwright/test").Page) {
  await page.goto("/dashboard");
  await settle(page);
  await expect(
    page.getByText(t("dashboard.sme.submitLoanApplication")),
  ).toBeVisible();
}

/** Stage both step-1 documents and advance to the revenue step. */
async function advanceToRevenueStep(page: import("@playwright/test").Page) {
  const inputs = page.locator('input[type="file"]');
  await inputs.nth(0).setInputFiles(stubFile("charter.pdf"));
  await inputs.nth(1).setInputFiles(stubFile("registration.pdf"));

  await page.getByRole("button", { name: t("dashboard.sme.nextBtn") }).click();
  await expect(
    page.getByText(t("dashboard.sme.lite.revenueTitle")),
  ).toBeVisible();
}

test.beforeEach(async ({ context, page }) => {
  await signInAs(context, "smeDraftApplication");
  await openWizard(page);
});

test.describe("the revenue step", () => {
  test("asks for figures instead of a document", async ({ page }) => {
    await advanceToRevenueStep(page);

    // The thing this whole change exists to remove.
    await expect(page.locator("#revenue_last_12m")).toBeVisible();
    await expect(page.locator('input[type="file"]')).toHaveCount(0);
  });

  test("explains that nothing needs uploading yet", async ({ page }) => {
    await advanceToRevenueStep(page);

    await expect(
      page.getByText(t("dashboard.sme.lite.revenueSubtitle")),
    ).toBeVisible();
  });

  test("no longer tells the applicant to zip 48 files", async ({ page }) => {
    // The side panel is keyed off the step number, so it kept serving the old
    // document instructions next to a form that accepts no files — the single
    // most confusing thing left over from the upload flow.
    await advanceToRevenueStep(page);

    const panel = page.getByText(t("dashboard.sme.step2How"));
    await expect(panel).toBeVisible();
    await expect(page.getByText(/48/)).toHaveCount(0);
    await expect(page.getByText(/\.zip/)).toHaveCount(0);
    // And the heading cannot still promise a document to obtain.
    await expect(
      page.getByText(t("dashboard.sme.whereToFindThese")),
    ).toBeVisible();
    await expect(
      page.getByText(t("dashboard.sme.howToObtainIt"), { exact: true }),
    ).toHaveCount(0);
  });

  test("marks the optional figures as optional", async ({ page }) => {
    // If every field looks mandatory the step is no less intimidating than the
    // upload it replaced.
    await advanceToRevenueStep(page);

    const optional = page.getByText(t("dashboard.sme.lite.optional"), {
      exact: true,
    });
    await expect(optional).toHaveCount(2);
  });

  test("will not advance while a required figure is blank", async ({
    page,
  }) => {
    await advanceToRevenueStep(page);

    await page.locator("#revenue_last_12m").fill("4000000000");
    // revenue_prior_12m deliberately left empty.
    await page
      .getByRole("button", { name: t("dashboard.sme.nextBtn") })
      .click();

    await expect(
      page.getByText(t("dashboard.sme.lite.revenueTitle")),
    ).toBeVisible();
  });

  test("rejects a figure that is not a number", async ({ page }) => {
    await advanceToRevenueStep(page);

    const field = page.locator("#revenue_last_12m");
    await field.fill("about four billion");
    await field.blur();

    await expect(
      page.getByText(t("dashboard.sme.lite.error.not_a_number")),
    ).toBeVisible();
    await expect(field).toHaveAttribute("aria-invalid", "true");
  });

  test("accepts the thousands separators a Vietnamese keyboard produces", async ({
    page,
  }) => {
    await advanceToRevenueStep(page);

    const field = page.locator("#revenue_last_12m");
    await field.fill("4.000.000.000");
    await field.blur();

    await expect(
      page.getByText(t("dashboard.sme.lite.error.not_a_number")),
    ).toHaveCount(0);
  });

  test("echoes the amount back grouped, so a missing zero is visible", async ({
    page,
  }) => {
    // The cheapest defence against a typo in a number this long: the applicant
    // reads back what the form understood.
    await advanceToRevenueStep(page);

    await page.locator("#revenue_last_12m").fill("4000000000");

    await expect(page.getByText("4.000.000.000 ₫")).toBeVisible();
  });

  test("advances once both required revenue figures are given", async ({
    page,
  }) => {
    await advanceToRevenueStep(page);

    await page.locator("#revenue_last_12m").fill("4000000000");
    await page.locator("#revenue_prior_12m").fill("3200000000");
    await page
      .getByRole("button", { name: t("dashboard.sme.nextBtn") })
      .click();

    await expect(
      page.getByText(t("dashboard.sme.lite.costsTitle")),
    ).toBeVisible();
  });
});

test.describe("the costs step", () => {
  async function advanceToCostsStep(page: import("@playwright/test").Page) {
    await advanceToRevenueStep(page);
    await page.locator("#revenue_last_12m").fill("4000000000");
    await page.locator("#revenue_prior_12m").fill("3200000000");
    await page
      .getByRole("button", { name: t("dashboard.sme.nextBtn") })
      .click();
    await expect(
      page.getByText(t("dashboard.sme.lite.costsTitle")),
    ).toBeVisible();
  }

  test("collects the three cost figures no document states", async ({
    page,
  }) => {
    // fixed_cost_y1 and variable_cost_excl_cogs_y1 appear in no statutory
    // filing, so a person has to type them however the flow is designed.
    await advanceToCostsStep(page);

    await expect(page.locator("#cogs_y1")).toBeVisible();
    await expect(page.locator("#fixed_cost_y1")).toBeVisible();
    await expect(page.locator("#variable_cost_excl_cogs_y1")).toBeVisible();
  });

  // The field CLAMPS rather than rejects: clampPercentInput pins anything over
  // 100 to "100", so the out-of-range message can never fire here. That landed
  // in 6e18bd6, after this test was written, which left the old assertion
  // testing a state the UI no longer reaches. Assert the clamp instead.
  test("clamps a percentage above 100", async ({ page }) => {
    await advanceToCostsStep(page);

    const field = page.locator("#conc_top1_pct");
    await field.fill("140");
    await field.blur();

    await expect(field).toHaveValue("100");
  });

  test("lets the optional percentages stay blank", async ({ page }) => {
    await advanceToCostsStep(page);

    await page.locator("#cogs_y1").fill("2400000000");
    await page.locator("#fixed_cost_y1").fill("600000000");
    await page.locator("#variable_cost_excl_cogs_y1").fill("300000000");
    await page
      .getByRole("button", { name: t("dashboard.sme.nextBtn") })
      .click();

    // Step 4 is the e-invoice upload. Asserting its heading rather than a file
    // input: the input is deliberately `hidden` and driven by its label.
    await expect(
      page.getByText(t("dashboard.sme.eInvoiceData")).first(),
    ).toBeVisible();
  });
});

// Deliberately not tested here: the Send action, which is what actually PUTs
// the figures. Send uploads every staged document first and halts if any fails,
// so reaching the figures request would mean teaching the stub to impersonate
// presigned R2 — the thing the STUB_PROJECT fixture comment rules out. The two
// things that path would prove are already covered where they belong:
// lite-grading-fields.test.ts pins "blank parses to null, never 0", and
// tests/loans/test_lite_grading_figures.py drives the real endpoint.
