import { test, expect, type Page } from "@playwright/test";

import { signInAs } from "../support/auth";
import { t } from "../support/i18n";
import { settle, toast } from "../support/ui";

/**
 * The revenue-and-costs step of the loan-application wizard, and the CIC step
 * after it.
 *
 * Revenue and costs used to be two steps, each with a file, and the first
 * ended by asking the applicant to TYPE the revenue of the year before the
 * invoices. That number is in the second file (the VAT declarations cover 24
 * months, the invoices 12), so the two are asked together now: one step, two
 * zips, and every figure read out of them. Nothing on the step is typed: the
 * fields show what the files say, and the only way to change a number is to
 * change the file it came from.
 *
 * Uploads are staged locally and deferred until Send; both previews are
 * answered by the stub API, so none of this needs R2. The stub's VAT series is
 * built so the year before its invoices adds up to exactly 48bn (see
 * stubVatSeries), and the file's body picks a variant: "NOVAT" is the
 * statement alone, "PARTIAL" stops a month short of that year, "NOPROFIT" is a
 * loss year and "LOSS" costs above the invoices' revenue.
 */

/** The prior year the stub's VAT declarations add up to: 12 months of 4bn. */
const PRIOR_YEAR = "48000000000";

/** Every figure on the step, in the order the fields appear. */
const FIGURES = [
  "revenue_last_12m",
  "revenue_prior_12m",
  "revenue_best_month",
  "revenue_worst_month",
  "cogs_y1",
  "fixed_cost_y1",
  "variable_cost_excl_cogs_y1",
  "owner_withdrawal_pct",
  "conc_top1_pct",
  "conc_top3_pct",
] as const;

/** A small in-memory PDF, enough to pass client-side file validation. */
const stubFile = (name: string) => ({
  name,
  mimeType: "application/pdf",
  buffer: Buffer.from("%PDF-1.4\n% e2e stub\n"),
});

async function openWizard(page: Page) {
  await page.goto("/dashboard");
  await settle(page);
  await expect(
    page.getByText(t("dashboard.sme.submitLoanApplication")),
  ).toBeVisible();
}

/**
 * The step's own heading. By role, not by text: the step indicator names this
 * step with the same words, so a text match finds two elements.
 */
const financialsHeading = (page: Page) =>
  page.getByRole("heading", { name: t("dashboard.sme.lite.financialsTitle") });

/** The wizard's "Step n of 4" line. */
const stepIndicator = (page: Page, current: number) =>
  page.getByText(
    t("dashboard.sme.stepIndicator")
      .replace("{current}", String(current))
      .replace("{total}", "4"),
  );

/** Stage both step-1 documents and advance to the revenue-and-costs step. */
async function advanceToFinancialsStep(page: Page) {
  const inputs = page.locator('input[type="file"]');
  await inputs.nth(0).setInputFiles(stubFile("charter.pdf"));
  await inputs.nth(1).setInputFiles(stubFile("registration.pdf"));

  await page.getByRole("button", { name: t("dashboard.sme.nextBtn") }).click();
  await expect(financialsHeading(page)).toBeVisible();
}

/** Attach the e-invoice zip; the stub preview fills the invoice figures. */
async function attachInvoices(page: Page) {
  await page.locator("input#eInvoiceData").setInputFiles({
    name: "Einvoice Data.zip",
    mimeType: "application/zip",
    buffer: Buffer.from("PK stub"),
  });
  await expect(page.locator("#revenue_last_12m")).not.toHaveValue("");
}

/**
 * Attach the tax filings; the stub preview fills the statutory figures.
 * `variant` is put in the body, which is how the stub picks its answer.
 */
async function attachFilings(page: Page, variant = "") {
  await page.locator("input#taxFilings").setInputFiles({
    name: "24 months running VAT.zip",
    mimeType: "application/zip",
    buffer: Buffer.from(`PK stub ${variant}`),
  });
  await expect(page.locator("#cogs_y1")).not.toHaveValue("");
}

/** Both files, and wait until the year before the invoices is worked out. */
async function attachBoth(page: Page) {
  await attachInvoices(page);
  await attachFilings(page);
  await expect(page.locator("#revenue_prior_12m")).toHaveValue(PRIOR_YEAR);
}

/** The Remove button on one file's tile. */
const removeButton = (page: Page, input: "eInvoiceData" | "taxFilings") =>
  page
    .locator(`div:has(> input#${input})`)
    .getByRole("button", { name: /^(Remove|Xoá)$/ });

const next = (page: Page) =>
  page.getByRole("button", { name: t("dashboard.sme.nextBtn") }).click();

/**
 * The click did not move the wizard on. The heading alone would also pass while
 * the old step animates out, so this also checks the indicator, which changes
 * in the same render as the click.
 */
async function stillOnFinancials(page: Page) {
  await expect(financialsHeading(page)).toBeVisible();
  await expect(stepIndicator(page, 2)).toBeVisible();
}

test.beforeEach(async ({ context, page }) => {
  await signInAs(context, "smeDraftApplication");
  await openWizard(page);
});

test.describe("the revenue and costs step", () => {
  test("is step 2 of 4, and asks for two files", async ({ page }) => {
    await advanceToFinancialsStep(page);

    await expect(stepIndicator(page, 2)).toBeVisible();
    // The e-invoices and the tax filings: not the 48 VAT files this used to
    // demand, and not a file per step any more.
    await expect(page.locator('input[type="file"]')).toHaveCount(2);
    await expect(page.locator("input#eInvoiceData")).toBeAttached();
    await expect(page.locator("input#taxFilings")).toBeAttached();
    // Revenue and cost figures sit on the one step.
    for (const id of FIGURES) {
      await expect(page.locator(`#${id}`)).toBeVisible();
    }
  });

  test("explains how to get both files, and no longer says 48", async ({
    page,
  }) => {
    // The side panel is keyed off the step number, so it once kept serving the
    // old document instructions next to a form that accepted no files. Now it
    // has to cover two files.
    await advanceToFinancialsStep(page);

    await expect(
      page.getByText(t("dashboard.sme.step2HowInvoices")),
    ).toBeVisible();
    await expect(
      page.getByText(t("dashboard.sme.step2HowFilings")),
    ).toBeVisible();
    await expect(
      page.getByText(t("dashboard.sme.howToObtainIt"), { exact: true }),
    ).toBeVisible();
    // A standalone 48, the old file count, not any figure that happens to
    // contain the digits (a VND total, a day counter).
    await expect(page.getByText(/\b48\b/)).toHaveCount(0);
    await expect(
      page.getByText(t("dashboard.sme.lite.financialsSubtitle")),
    ).toBeVisible();
  });

  test("marks the optional figures as optional", async ({ page }) => {
    // Best and worst month, owner withdrawal and the two customer shares may
    // be blank; the other five are needed to continue.
    await advanceToFinancialsStep(page);

    await expect(
      page.getByText(t("dashboard.sme.lite.optional"), { exact: true }),
    ).toHaveCount(5);
  });

  test.describe("nothing is typed", () => {
    test("every figure is read-only, before and after the files", async ({
      page,
    }) => {
      await advanceToFinancialsStep(page);

      for (const id of FIGURES) {
        await expect(page.locator(`#${id}`)).toHaveAttribute("readonly", "");
        await expect(page.locator(`#${id}`)).toHaveValue("");
      }

      await attachBoth(page);

      for (const id of FIGURES) {
        await expect(page.locator(`#${id}`)).toHaveAttribute("readonly", "");
      }
    });

    test("typing into a figure changes nothing", async ({ page }) => {
      await advanceToFinancialsStep(page);
      await attachBoth(page);

      // Fixed cost was the one that used to be editable.
      const field = page.locator("#fixed_cost_y1");
      const before = await field.inputValue();
      await field.click();
      await page.keyboard.type("999");
      await page.keyboard.press("Control+A");
      await page.keyboard.press("Backspace");

      await expect(field).toHaveValue(before);
    });

    test("no field invites typing", async ({ page }) => {
      await advanceToFinancialsStep(page);

      await expect(
        page.getByText(t("dashboard.sme.lite.financialsSubtitle")),
      ).toBeVisible();
      // The old "Enter 0-100" style instructions are gone from the hints.
      await expect(page.getByText(/Enter 0-100|Nhập 0-100/)).toHaveCount(0);
    });
  });

  test.describe("what the e-invoices supply", () => {
    test("fills the revenue and the customer shares", async ({ page }) => {
      await advanceToFinancialsStep(page);
      await attachInvoices(page);

      await expect(page.locator("#conc_top1_pct")).toHaveValue("9.99");
      await expect(page.locator("#conc_top3_pct")).toHaveValue("22.29");
      // The invoices alone cannot say what the year before was.
      await expect(page.locator("#revenue_prior_12m")).toHaveValue("");
      await expect(
        page.getByText(t("dashboard.sme.figureFromInvoices")).first(),
      ).toBeVisible();
    });

    test("removing the zip clears what it filled", async ({ page }) => {
      await advanceToFinancialsStep(page);
      await attachInvoices(page);
      await removeButton(page, "eInvoiceData").click();

      await expect(page.locator("#revenue_last_12m")).toHaveValue("");
      await expect(page.locator("#conc_top1_pct")).toHaveValue("");
      // Still not editable: there is nothing to type it into.
      await expect(page.locator("#revenue_last_12m")).toHaveAttribute(
        "readonly",
        "",
      );
    });

    test("a zip the server cannot read is refused with the reason", async ({
      page,
    }) => {
      await advanceToFinancialsStep(page);
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
      await advanceToFinancialsStep(page);
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
  });

  test.describe("what the tax filings supply", () => {
    test("fills cost of goods sold and the owners' share of profit", async ({
      page,
    }) => {
      await advanceToFinancialsStep(page);
      await attachFilings(page);

      await expect(page.locator("#cogs_y1")).toHaveValue("40000000000");
      // Nothing was paid out to the owners: 0 is an answer, not a blank.
      await expect(page.locator("#owner_withdrawal_pct")).toHaveValue("0");
      await expect(
        page.getByText(t("dashboard.sme.figureFromFilings")).first(),
      ).toBeVisible();
    });

    test("reads fixed cost as management expense plus financial expense, and shows both", async ({
      page,
    }) => {
      // 3.16bn of management expense (line 24) + 2.49bn of financial expense
      // (line 22, interest included). Leaving the financial expense out was the
      // old rule.
      await advanceToFinancialsStep(page);
      await attachFilings(page);

      await expect(page.locator("#fixed_cost_y1")).toHaveValue("5653003355");
      await expect(page.locator("#fixed_cost_y1")).toHaveAttribute(
        "readonly",
        "",
      );
      await expect(
        page.getByText(
          t("dashboard.sme.figureFromFixed")
            .replace("{admin}", "3.160.138.988 ₫")
            .replace("{financial}", "2.492.864.367 ₫"),
        ),
      ).toBeVisible();
    });

    test("reads other variable cost as the selling expense, and says why a 0 is a 0", async ({
      page,
    }) => {
      // The reference statements book nothing as selling expense, so the
      // variable cost is 0. That is what they say, and the field must not read
      // like missing data.
      await advanceToFinancialsStep(page);
      await attachFilings(page);

      await expect(page.locator("#variable_cost_excl_cogs_y1")).toHaveValue(
        "0",
      );
      await expect(
        page.getByText(t("dashboard.sme.figureSellingNone")),
      ).toBeVisible();
      await expect(
        page.getByText(t("dashboard.sme.lite.notInFiles")),
      ).toHaveCount(0);
    });

    test("explains the rule behind fixed and variable cost", async ({
      page,
    }) => {
      // No filing labels a cost fixed or variable, so the step says what it
      // does instead of presenting a policy as if it were a statement line.
      await advanceToFinancialsStep(page);
      await expect(
        page.getByText(t("dashboard.sme.lite.costsBasis")),
      ).toHaveCount(0);

      await attachFilings(page);

      await expect(
        page.getByText(t("dashboard.sme.lite.costsBasis")),
      ).toBeVisible();
    });

    test("a loss year leaves the owners' share blank, and says why", async ({
      page,
    }) => {
      await advanceToFinancialsStep(page);
      await attachFilings(page, "NOPROFIT");

      await expect(page.locator("#owner_withdrawal_pct")).toHaveValue("");
      await expect(
        page.getByText(t("dashboard.sme.taxFilingsNoProfit")),
      ).toBeVisible();
      await expect(
        page.getByText(t("dashboard.sme.lite.notInFiles")),
      ).toBeVisible();
      // It is optional, so a blank one is not an error.
      await expect(
        page.getByText(t("dashboard.sme.lite.error.required")),
      ).toHaveCount(0);
    });

    test("removing the filings clears what they filled", async ({ page }) => {
      await advanceToFinancialsStep(page);
      await attachFilings(page);
      await removeButton(page, "taxFilings").click();

      for (const id of [
        "cogs_y1",
        "fixed_cost_y1",
        "variable_cost_excl_cogs_y1",
        "owner_withdrawal_pct",
      ]) {
        await expect(page.locator(`#${id}`)).toHaveValue("");
      }
      await expect(
        page.getByText(t("dashboard.sme.lite.costsBasis")),
      ).toHaveCount(0);
    });

    test("filings the server cannot read are refused with the reason", async ({
      page,
    }) => {
      await advanceToFinancialsStep(page);
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

  test.describe("the year before the invoices", () => {
    test("is worked out from the VAT declarations once both files are in", async ({
      page,
    }) => {
      await advanceToFinancialsStep(page);
      await attachBoth(page);

      // 09/2024-08/2025 at 4bn a month. The stub's 08/2024 is 3.9bn, so a sum
      // that reached one month too far back would not land on 48bn.
      await expect(
        page.getByText(
          t("dashboard.sme.figureFromVat")
            .replace("{from}", "09/2024")
            .replace("{to}", "08/2025"),
        ),
      ).toBeVisible();
    });

    test("waits for the invoices, and says so, when only the filings are in", async ({
      page,
    }) => {
      await advanceToFinancialsStep(page);
      await attachFilings(page);

      await expect(page.locator("#revenue_prior_12m")).toHaveValue("");
      await expect(
        page.getByText(t("dashboard.sme.priorYear.needsInvoices")),
      ).toBeVisible();
      // Not an error yet: the invoices simply are not in.
      await expect(
        page.getByText(t("dashboard.sme.lite.error.required")),
      ).toHaveCount(0);

      // The second file lands and it fills in without another action.
      await attachInvoices(page);
      await expect(page.locator("#revenue_prior_12m")).toHaveValue(PRIOR_YEAR);
    });

    test("is left blank, and the step blocked, when the filings carry no VAT declarations", async ({
      page,
    }) => {
      await advanceToFinancialsStep(page);
      await attachInvoices(page);
      await attachFilings(page, "NOVAT");

      await expect(page.locator("#revenue_prior_12m")).toHaveValue("");
      await expect(
        page.getByText(t("dashboard.sme.priorYear.needsVat")),
      ).toBeVisible();
      // A required figure the files could not state: said on the field.
      await expect(
        page.getByText(t("dashboard.sme.lite.error.required")),
      ).toBeVisible();

      // And it cannot be typed instead, so the way forward is a better file.
      await expect(page.locator("#revenue_prior_12m")).toHaveAttribute(
        "readonly",
        "",
      );
      await next(page);
      await stillOnFinancials(page);
    });

    test("names the months that are missing when the declarations stop short", async ({
      page,
    }) => {
      await advanceToFinancialsStep(page);
      await attachInvoices(page);
      await attachFilings(page, "PARTIAL");

      await expect(page.locator("#revenue_prior_12m")).toHaveValue("");
      await expect(
        page.getByText(
          t("dashboard.sme.priorYear.notCovered")
            .replace("{from}", "09/2024")
            .replace("{to}", "08/2025")
            .replace("{missing}", "08/2025"),
        ),
      ).toBeVisible();
      await next(page);
      await stillOnFinancials(page);
    });

    test("goes when either file is removed", async ({ page }) => {
      await advanceToFinancialsStep(page);
      await attachBoth(page);

      await removeButton(page, "taxFilings").click();
      await expect(page.locator("#revenue_prior_12m")).toHaveValue("");

      // Put the filings back, then take the invoices away instead.
      await attachFilings(page);
      await expect(page.locator("#revenue_prior_12m")).toHaveValue(PRIOR_YEAR);
      await removeButton(page, "eInvoiceData").click();
      await expect(page.locator("#revenue_prior_12m")).toHaveValue("");
    });
  });

  test.describe("the values", () => {
    test("echoes each amount grouped, so eleven digits are readable", async ({
      page,
    }) => {
      // A read-only field is still read: the grouped amount is the cheapest
      // way to tell 48 billion from 4.8 billion at a glance.
      await advanceToFinancialsStep(page);
      await attachBoth(page);

      await expect(page.getByText("48.000.000.000 ₫")).toBeVisible();
    });
  });

  test.describe("advancing", () => {
    test("needs both files", async ({ page }) => {
      await advanceToFinancialsStep(page);
      await next(page);

      await stillOnFinancials(page);
    });

    test("needs the tax filings, not just the invoices", async ({ page }) => {
      await advanceToFinancialsStep(page);
      await attachInvoices(page);
      await next(page);

      await stillOnFinancials(page);
    });

    test("needs the invoices, not just the tax filings", async ({ page }) => {
      await advanceToFinancialsStep(page);
      await attachFilings(page);
      await next(page);

      await stillOnFinancials(page);
    });

    test("says what to do when a figure could not be read", async ({
      page,
    }) => {
      await advanceToFinancialsStep(page);
      await attachInvoices(page);
      await attachFilings(page, "NOVAT");
      await next(page);

      await expect(
        toast(page, t("dashboard.sme.lite.missingFiguresTitle")),
      ).toBeVisible();
      await stillOnFinancials(page);
    });

    test("will not advance when the costs leave no profit", async ({
      page,
    }) => {
      // 70bn of goods sold against a 66.6bn year: the engine cannot grade it,
      // and nothing here can be edited, so the error is about the files.
      await advanceToFinancialsStep(page);
      await attachInvoices(page);
      await attachFilings(page, "LOSS");
      await next(page);

      await expect(
        page.getByText(t("dashboard.sme.lite.error.costs_exceed_revenue")),
      ).toBeVisible();
      await stillOnFinancials(page);
    });

    test("goes on to the CIC report with both files read and nothing typed", async ({
      page,
    }) => {
      await advanceToFinancialsStep(page);
      await attachBoth(page);
      await next(page);

      // Step 3 is the CIC report. Asserting its heading rather than a file
      // input: the input is deliberately `hidden` and driven by its label.
      await expect(
        page.getByText(t("dashboard.sme.cicCreditReport")).first(),
      ).toBeVisible();
      await expect(stepIndicator(page, 3)).toBeVisible();
    });
  });
});

test.describe("the CIC step", () => {
  async function advanceToCicStep(page: Page) {
    await advanceToFinancialsStep(page);
    await attachBoth(page);
    await next(page);
    await expect(page.locator("input#cicReport")).toBeAttached();
  }

  const pickReport = (page: Page, body = "%PDF-1.4 stub") =>
    page.locator("input#cicReport").setInputFiles({
      name: "cic.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(body),
    });

  test("explains what the report is and how to get it", async ({ page }) => {
    await advanceToCicStep(page);

    await expect(page.getByText(t("dashboard.sme.step3Why"))).toBeVisible();
    await expect(page.getByText(t("dashboard.sme.step3How"))).toBeVisible();
    await expect(
      page.getByText(t("dashboard.sme.howToObtainCic")),
    ).toBeVisible();
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
    await expect(stepIndicator(page, 4)).toBeVisible();
  });

  test("the review reads back the figures the files gave, and goes back to change the files", async ({
    page,
  }) => {
    await advanceToCicStep(page);
    await pickReport(page);
    await expect(page.getByText("629", { exact: true })).toBeVisible();
    await next(page);

    // Read back before sending, as what the files said, not what was entered.
    await expect(
      page.getByText(t("dashboard.sme.lite.reviewFiguresTitle")),
    ).toBeVisible();
    await expect(page.getByText("48.000.000.000 ₫")).toBeVisible();

    await page
      .getByRole("button", { name: t("dashboard.sme.lite.editFigures") })
      .click();
    await expect(financialsHeading(page)).toBeVisible();
    await expect(stepIndicator(page, 2)).toBeVisible();
    // The files are still attached, so the figures are still there.
    await expect(page.locator("#revenue_prior_12m")).toHaveValue(PRIOR_YEAR);
  });
});

// Deliberately not tested here: the Send action, which is what actually PUTs
// the figures. Send uploads every staged document first and halts if any fails,
// so reaching the figures request would mean teaching the stub to impersonate
// presigned R2 — the thing the STUB_PROJECT fixture comment rules out. The two
// things that path would prove are already covered where they belong:
// lite-grading-fields.test.ts pins "blank parses to null, never 0", and
// tests/loans/test_lite_grading_figures.py drives the real endpoint.
