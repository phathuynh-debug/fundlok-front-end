import { test, expect } from "@playwright/test";

import { signInAs } from "../support/auth";
import { t } from "../support/i18n";
import { settle } from "../support/ui";

/**
 * The Lite grading steps of the loan-application wizard.
 *
 * Steps 2 and 3 used to demand documents — the VAT step alone asked for a zip
 * of 48 files — to supply figures the parser never actually read. Now each
 * takes ONE file that the backend reads at once. Step 2's e-invoice zip fills
 * the last-12-months revenue, the best and worst month and the customer
 * shares; step 3's tax filings fill cost of goods sold and owner withdrawal.
 * Filled figures are locked while their file is attached; the prior year and
 * fixed/variable cost are typed. This is the browser-level proof that both steps render, and that
 * they refuse to advance on missing or impossible numbers.
 *
 * Uploads are staged locally and deferred until Send; both previews are
 * answered by the stub API, so none of this needs R2.
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

/** Attach the e-invoice zip; the stub preview fills the invoice figures. */
async function attachInvoices(page: import("@playwright/test").Page) {
  await page.locator("input#eInvoiceData").setInputFiles({
    name: "Einvoice Data.zip",
    mimeType: "application/zip",
    buffer: Buffer.from("PK stub"),
  });
  await expect(page.locator("#revenue_last_12m")).not.toHaveValue("");
}

test.beforeEach(async ({ context, page }) => {
  await signInAs(context, "smeDraftApplication");
  await openWizard(page);
});

test.describe("the revenue step", () => {
  test("takes one e-invoice zip and the revenue figures", async ({ page }) => {
    await advanceToRevenueStep(page);

    // One file, not the 48 VAT files this step used to demand.
    await expect(page.locator('input[type="file"]')).toHaveCount(1);
    await expect(page.locator("input#eInvoiceData")).toBeAttached();
    await expect(page.locator("#revenue_last_12m")).toBeVisible();
  });

  test("fills and locks the figures the invoices supply", async ({ page }) => {
    await advanceToRevenueStep(page);
    await attachInvoices(page);

    for (const id of [
      "revenue_last_12m",
      "revenue_best_month",
      "revenue_worst_month",
    ]) {
      await expect(page.locator(`#${id}`)).toHaveAttribute("readonly", "");
    }
    // The prior year is not in a 12-month export, so it stays typed.
    await expect(page.locator("#revenue_prior_12m")).not.toHaveAttribute(
      "readonly",
    );
    await expect(
      page.getByText(t("dashboard.sme.figureFromInvoices")).first(),
    ).toBeVisible();
  });

  test("removing the zip clears and unlocks what it filled", async ({
    page,
  }) => {
    await advanceToRevenueStep(page);
    await attachInvoices(page);
    await page.getByRole("button", { name: /^(Remove|Xoá)$/ }).click();

    await expect(page.locator("#revenue_last_12m")).toHaveValue("");
    await expect(page.locator("#revenue_last_12m")).not.toHaveAttribute(
      "readonly",
    );
  });

  test("a zip the server cannot read is refused with the reason", async ({
    page,
  }) => {
    await advanceToRevenueStep(page);
    await page.locator("input#eInvoiceData").setInputFiles({
      name: "Einvoice Data.zip",
      mimeType: "application/zip",
      buffer: Buffer.from("PK BROKEN"),
    });
    await expect(
      page.getByText(t("dashboard.sme.eInvoiceError.NOT_A_ZIP")),
    ).toBeVisible();
    await expect(page.locator("#revenue_last_12m")).toHaveValue("");
  });

  test("a loose export is refused with how to zip the folder", async ({
    page,
  }) => {
    await advanceToRevenueStep(page);
    await page.locator("input#eInvoiceData").setInputFiles({
      name: "HDT1.xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: Buffer.from("PK xlsx stub"),
    });
    await expect(
      page.getByText(t("dashboard.sme.eInvoiceZipFolder")),
    ).toBeVisible();
  });

  test("explains what the step needs", async ({ page }) => {
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
    // A standalone 48, the old file count, not any figure that happens to
    // contain the digits (a VND total, a day counter).
    await expect(page.getByText(/\b48\b/)).toHaveCount(0);
    // The step takes a file again (the e-invoice zip), so the panel says how
    // to obtain it.
    await expect(
      page.getByText(t("dashboard.sme.howToObtainIt"), { exact: true }),
    ).toBeVisible();
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

  test("will not advance without the e-invoice zip", async ({ page }) => {
    await advanceToRevenueStep(page);
    await page.locator("#revenue_last_12m").fill("4000000000");
    await page.locator("#revenue_prior_12m").fill("3200000000");
    await page
      .getByRole("button", { name: t("dashboard.sme.nextBtn") })
      .click();
    await expect(
      page.getByText(t("dashboard.sme.lite.revenueTitle")),
    ).toBeVisible();
  });

  test("advances once the zip is read and the prior year is typed", async ({
    page,
  }) => {
    await advanceToRevenueStep(page);

    await attachInvoices(page);
    await page.locator("#revenue_prior_12m").fill("3200000000");
    await page
      .getByRole("button", { name: t("dashboard.sme.nextBtn") })
      .click();

    await expect(
      page.getByText(t("dashboard.sme.lite.costsTitle")),
    ).toBeVisible();
  });
});

async function advanceToCostsStep(page: import("@playwright/test").Page) {
  await advanceToRevenueStep(page);
  await attachInvoices(page);
  await page.locator("#revenue_prior_12m").fill("3200000000");
  await page.getByRole("button", { name: t("dashboard.sme.nextBtn") }).click();
  await expect(
    page.getByText(t("dashboard.sme.lite.costsTitle")),
  ).toBeVisible();
}

/** Attach the tax filings; the stub preview fills the statutory figures. */
async function attachFilings(page: import("@playwright/test").Page) {
  await page.locator("input#taxFilings").setInputFiles({
    name: "24 months running VAT.zip",
    mimeType: "application/zip",
    buffer: Buffer.from("PK stub"),
  });
  await expect(page.locator("#cogs_y1")).not.toHaveValue("");
}

const next = (page: import("@playwright/test").Page) =>
  page.getByRole("button", { name: t("dashboard.sme.nextBtn") }).click();

test.describe("the costs step", () => {
  test("takes one tax-filings file beside the cost figures", async ({
    page,
  }) => {
    await advanceToCostsStep(page);

    await expect(page.locator("input#taxFilings")).toBeAttached();
    await expect(page.locator("#cogs_y1")).toBeVisible();
    await expect(page.locator("#fixed_cost_y1")).toBeVisible();
    await expect(page.locator("#variable_cost_excl_cogs_y1")).toBeVisible();
  });

  test("fills and locks what the statements state outright", async ({
    page,
  }) => {
    await advanceToCostsStep(page);
    await attachFilings(page);

    await expect(page.locator("#cogs_y1")).toHaveValue("40000000000");
    await expect(page.locator("#cogs_y1")).toHaveAttribute("readonly", "");
    // Nothing was paid out to the owners: 0 is an answer, and it is locked.
    await expect(page.locator("#owner_withdrawal_pct")).toHaveValue("0");
    await expect(page.locator("#owner_withdrawal_pct")).toHaveAttribute(
      "readonly",
    );
    await expect(
      page.getByText(t("dashboard.sme.figureFromFilings")).first(),
    ).toBeVisible();
  });

  test("suggests fixed and variable cost from the statements, editable", async ({
    page,
  }) => {
    await advanceToCostsStep(page);
    await attachFilings(page);

    // Administration and selling expense as the starting point. No filing
    // splits costs by behaviour, so both stay editable.
    await expect(page.locator("#fixed_cost_y1")).toHaveValue("3160138988");
    await expect(page.locator("#variable_cost_excl_cogs_y1")).toHaveValue("0");
    await expect(page.locator("#fixed_cost_y1")).not.toHaveAttribute(
      "readonly",
    );
    await page.locator("#fixed_cost_y1").fill("2500000000");
    await expect(page.locator("#fixed_cost_y1")).toHaveValue("2500000000");
  });

  test("will not advance when the costs leave no profit", async ({ page }) => {
    await advanceToCostsStep(page);
    await attachFilings(page);
    // 40bn of goods sold + 30bn fixed against a 66.6bn year.
    await page.locator("#fixed_cost_y1").fill("30000000000");
    await next(page);

    await expect(
      page.getByText(t("dashboard.sme.lite.error.costs_exceed_revenue")),
    ).toBeVisible();
    await expect(
      page.getByText(t("dashboard.sme.lite.costsTitle")),
    ).toBeVisible();
  });

  test("the customer shares come from the step-2 invoices", async ({
    page,
  }) => {
    await advanceToCostsStep(page);

    await expect(page.locator("#conc_top1_pct")).toHaveValue("9.99");
    await expect(page.locator("#conc_top3_pct")).toHaveValue("22.29");
    await expect(page.locator("#conc_top1_pct")).toHaveAttribute("readonly");
  });

  // The field CLAMPS rather than rejects: clampPercentInput pins anything over
  // 100 to "100", so the out-of-range message can never fire here. Checked on
  // owner withdrawal before the filings are attached — once they are, it is
  // read-only.
  test("clamps a percentage above 100", async ({ page }) => {
    await advanceToCostsStep(page);

    const field = page.locator("#owner_withdrawal_pct");
    await field.fill("140");
    await field.blur();

    await expect(field).toHaveValue("100");
  });

  test("will not advance without the tax filings", async ({ page }) => {
    await advanceToCostsStep(page);
    await page.locator("#cogs_y1").fill("2400000000");
    await page.locator("#fixed_cost_y1").fill("600000000");
    await page.locator("#variable_cost_excl_cogs_y1").fill("300000000");
    await next(page);

    await expect(
      page.getByText(t("dashboard.sme.lite.costsTitle")),
    ).toBeVisible();
  });

  test("advances with the filings read and a variable cost of 0", async ({
    page,
  }) => {
    await advanceToCostsStep(page);
    await attachFilings(page);
    await page.locator("#fixed_cost_y1").fill("3000000000");
    // Many small firms book no selling expense at all.
    await page.locator("#variable_cost_excl_cogs_y1").fill("0");
    await next(page);

    // Step 4 is the CIC report. Asserting its heading rather than a file
    // input: the input is deliberately `hidden` and driven by its label.
    await expect(
      page.getByText(t("dashboard.sme.cicCreditReport")).first(),
    ).toBeVisible();
  });

  test("removing the filings clears and unlocks what they filled", async ({
    page,
  }) => {
    await advanceToCostsStep(page);
    await attachFilings(page);

    await page.getByRole("button", { name: /^(Remove|Xoá)$/ }).click();

    await expect(page.locator("#cogs_y1")).toHaveValue("");
    await expect(page.locator("#cogs_y1")).not.toHaveAttribute("readonly", "");
  });

  test("filings the server cannot read are refused with the reason", async ({
    page,
  }) => {
    await advanceToCostsStep(page);
    await page.locator("input#taxFilings").setInputFiles({
      name: "filings.zip",
      mimeType: "application/zip",
      buffer: Buffer.from("PK BROKEN"),
    });

    await expect(
      page.getByText(t("dashboard.sme.taxFilingsError.NO_STATEMENTS")),
    ).toBeVisible();
    await expect(page.locator("#cogs_y1")).toHaveValue("");
  });
});

test.describe("the CIC step", () => {
  async function advanceToCicStep(page: import("@playwright/test").Page) {
    await advanceToCostsStep(page);
    await attachFilings(page);
    await page.locator("#fixed_cost_y1").fill("3000000000");
    await page.locator("#variable_cost_excl_cogs_y1").fill("0");
    await next(page);
    await expect(page.locator("input#cicReport")).toBeAttached();
  }

  const pickReport = (
    page: import("@playwright/test").Page,
    body = "%PDF-1.4 stub",
  ) =>
    page.locator("input#cicReport").setInputFiles({
      name: "cic.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(body),
    });

  test("shows the score and debt the report states", async ({ page }) => {
    await advanceToCicStep(page);
    await pickReport(page);

    await expect(
      page.getByText(t("dashboard.sme.cicReadSummary")),
    ).toBeVisible();
    await expect(page.getByText("629", { exact: true })).toBeVisible();
    await expect(
      page.getByText(t("dashboard.sme.cicRankLabel.very_good"), {
        exact: false,
      }),
    ).toBeVisible();
    // A personal report is accepted, and the SME is told whose it is.
    await expect(
      page.getByText(t("dashboard.sme.cicNote.INDIVIDUAL_REPORT")),
    ).toBeVisible();
  });

  test("a PDF that is not a CIC report is refused with the reason", async ({
    page,
  }) => {
    await advanceToCicStep(page);
    await pickReport(page, "%PDF-1.4 BROKEN");

    await expect(
      page.getByText(t("dashboard.sme.cicError.NOT_CIC")),
    ).toBeVisible();
    await next(page);
    await expect(page.locator("input#cicReport")).toBeAttached();
  });

  test("advances to review once the report is read", async ({ page }) => {
    await advanceToCicStep(page);
    await pickReport(page);
    await expect(page.getByText("629", { exact: true })).toBeVisible();
    await next(page);

    await expect(page.locator("input#cicReport")).not.toBeAttached();
  });
});

// Deliberately not tested here: the Send action, which is what actually PUTs
// the figures. Send uploads every staged document first and halts if any fails,
// so reaching the figures request would mean teaching the stub to impersonate
// presigned R2 — the thing the STUB_PROJECT fixture comment rules out. The two
// things that path would prove are already covered where they belong:
// lite-grading-fields.test.ts pins "blank parses to null, never 0", and
// tests/loans/test_lite_grading_figures.py drives the real endpoint.
