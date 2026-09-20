import { test, expect } from "@playwright/test";

import { LOAN_DURATIONS_MONTHS } from "../../lib/constants/loan-constraints";
import { INDUSTRY_OPTIONS } from "../../lib/constants/industries";
import { formatCurrency } from "../../lib/format-currency";
import { signInAs } from "../support/auth";
import { normalizeSpaces, t } from "../support/i18n";

// The two value actions the platform gates on verification: an investor placing
// money, and an SME asking for it. Both are reached only by an APPROVED user —
// the unapproved diversion to /kyc is covered in auth-gating.spec.ts.

test.describe("/dashboard/invest", () => {
  const amount = 500_000_000;

  test.beforeEach(async ({ context }) => {
    await signInAs(context, "investor");
  });

  test("shows the amount to be confirmed, in VND", async ({ page }) => {
    await page.goto(`/dashboard/invest?amount=${amount}`);

    await expect(
      page.getByRole("heading", { name: t("investConfirm.title") }),
    ).toBeVisible();
    await expect(
      page.getByText(t("investConfirm.amountLabel"), { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(normalizeSpaces(formatCurrency(amount, "en")), {
        exact: false,
      }),
    ).toBeVisible();
  });

  test("confirming reports success", async ({ page }) => {
    await page.goto(`/dashboard/invest?amount=${amount}`);

    await page
      .getByRole("button", { name: t("investConfirm.confirmBtn") })
      .click();

    await expect(page.getByText(t("investConfirm.doneHint"))).toBeVisible();
  });

  test("offers a way back to the marketplace", async ({ page }) => {
    await page.goto(`/dashboard/invest?amount=${amount}`);

    await page.getByRole("link", { name: t("investConfirm.back") }).click();
    await expect(page).toHaveURL(/\/dashboard\/projects$/);
  });
});

const next = (page: import("@playwright/test").Page) =>
  page.getByRole("button", { name: t("projectApplication.card.next") }).click();

async function fillStepOne(page: import("@playwright/test").Page) {
  await page
    .getByLabel(t("projectApplication.fields.legalName"))
    .fill("E2E Applicant Co");
  await page
    .getByLabel(t("projectApplication.fields.taxId"))
    .fill("0312345678");
  await page.getByRole("combobox").first().click();
  // The option's visible label is TRANSLATED — `value` is the engine string
  // sent to the backend and never appears on screen, so matching on it hangs.
  await page
    .getByRole("option", {
      name: t(`projectApplication.industries.${INDUSTRY_OPTIONS[0].labelKey}`),
      exact: true,
    })
    .click();
  await page
    .getByLabel(t("projectApplication.fields.employeeCount"))
    .fill("25");
}

// The two step-1 fields a business registration certificate does NOT carry, so
// KYB prefill can never satisfy them. Filling just these proves the prefilled
// pair is what lets the step validate.
async function fillStepOneGapsOnly(page: import("@playwright/test").Page) {
  await page.getByRole("combobox").first().click();
  await page
    .getByRole("option", {
      name: t(`projectApplication.industries.${INDUSTRY_OPTIONS[0].labelKey}`),
      exact: true,
    })
    .click();
  await page
    .getByLabel(t("projectApplication.fields.employeeCount"))
    .fill("25");
}

async function fillAddress(page: import("@playwright/test").Page) {
  // Step 2 validates street, city, state, postal_code AND country before it
  // will advance, so every one of them has to be filled — leaving state or
  // postal code out silently keeps the wizard on this step.
  await page
    .getByLabel(t("projectApplication.fields.street"))
    .fill("12 Nguyen Hue");

  // City is a Select (a combobox), not a text input — Vietnamese cities are a
  // fixed list — so it is chosen rather than typed.
  await page.getByLabel(t("projectApplication.fields.city")).click();
  await page.getByRole("option").first().click();

  await page
    .getByLabel(t("projectApplication.fields.stateRegion"))
    .fill("Hoan Kiem");
  await page
    .getByLabel(t("projectApplication.fields.postalCode"))
    .fill("100000");
  // Country is a disabled Select already pinned to Vietnam.
}

async function fillIncorporation(page: import("@playwright/test").Page) {
  const date = page.getByLabel(
    t("projectApplication.fields.incorporationDate"),
  );
  if ((await date.count()) > 0) await date.fill("2021-04-12");
}

test.describe("/project-application", () => {
  test.beforeEach(async ({ context, page }) => {
    // An approved SME that does not already have a project — the only user for
    // whom this form is reachable.
    await signInAs(context, "smeNoProject");
    await page.goto("/project-application");
  });

  // --- KYB prefill ---------------------------------------------------------
  // The SME has already handed us their business registration certificate and
  // we OCR'd it. Asking them to retype what it said is the only way the
  // application can disagree with what was verified.

  test("prefills legal name and tax ID from the verified certificate", async ({
    page,
  }) => {
    await expect(
      page.getByLabel(t("projectApplication.fields.legalName")),
    ).toHaveValue("CÔNG TY CỔ PHẦN FUNDLOK");
    await expect(
      page.getByLabel(t("projectApplication.fields.taxId")),
    ).toHaveValue("1501167629");
    await expect(
      page.getByText(t("projectApplication.hints.prefilledFromKyb")),
    ).toBeVisible();
  });

  test("splits the certificate address into street and province", async ({
    page,
  }) => {
    // Legal name and tax ID are already valid from the prefill; only the two
    // fields the certificate cannot supply still need filling to advance.
    await fillStepOneGapsOnly(page);
    await next(page);

    // The province is the only part of the one-line address that can be
    // recovered reliably, so the rest stays on the street line.
    await expect(
      page.getByLabel(t("projectApplication.fields.street")),
    ).toHaveValue("Thửa đất số 7, Khóm Thuận Tiến B, Phường Bình Minh");
    await expect(
      page.getByLabel(t("projectApplication.fields.city")),
    ).toContainText("Vĩnh Long");
    await expect(
      page.getByText(t("projectApplication.hints.prefilledAddressFromKyb")),
    ).toBeVisible();
  });

  test("leaves the fields the certificate cannot supply empty", async ({
    page,
  }) => {
    // A certificate carries no postal code and no headcount, so these must
    // stay blank rather than being guessed into.
    await expect(
      page.getByLabel(t("projectApplication.fields.employeeCount")),
    ).toHaveValue("");

    await fillStepOneGapsOnly(page);
    await next(page);
    await expect(
      page.getByLabel(t("projectApplication.fields.postalCode")),
    ).toHaveValue("");
    await expect(
      page.getByLabel(t("projectApplication.fields.stateRegion")),
    ).toHaveValue("");
  });

  test("keeps an SME edit to a prefilled field and drops the notice", async ({
    page,
  }) => {
    const legalName = page.getByLabel(t("projectApplication.fields.legalName"));
    await legalName.fill("A Different Trading Name");
    const taxId = page.getByLabel(t("projectApplication.fields.taxId"));
    await taxId.fill("9999999999");

    // Both edited away from the certificate, so the notice no longer describes
    // what is on screen and retires itself.
    await expect(legalName).toHaveValue("A Different Trading Name");
    await expect(
      page.getByText(t("projectApplication.hints.prefilledFromKyb")),
    ).toHaveCount(0);
  });

  test("renders the application form", async ({ page }) => {
    await expect(
      page.getByText(t("projectApplication.card.title")),
    ).toBeVisible();
  });

  test("offers only industries the grading engine can score", async ({
    page,
  }) => {
    // An industry outside `supported_industries` is a hard failure in the
    // engine; gambling, alcohol, tobacco, weapons and defence are a hard
    // reject, so they must not be offered at all.
    await page.getByRole("combobox").first().click();

    const options = page.getByRole("option");
    await expect(options).toHaveCount(INDUSTRY_OPTIONS.length);

    for (const forbidden of ["Gambling", "Alcohol", "Tobacco", "Weapons"]) {
      await expect(
        page.getByRole("option", { name: forbidden }),
        `${forbidden} is a hard reject in the engine and must not be offered`,
      ).toHaveCount(0);
    }
  });

  test("offers exactly the loan durations the grading engine accepts", async ({
    page,
  }) => {
    // `allowed_durations_months` is 3/6/9/12 and the engine raises on anything
    // else, so a stray option here is an application that cannot be scored.
    // The field is on the last step, so the wizard has to be walked.
    await fillStepOne(page);
    await next(page);
    await fillAddress(page);
    await next(page);
    await fillIncorporation(page);
    await next(page);

    const group = page.getByRole("radiogroup", {
      name: t("projectApplication.fields.durationMonths"),
    });
    await expect(group).toBeVisible();
    await expect(group.getByRole("radio")).toHaveCount(
      LOAN_DURATIONS_MONTHS.length,
    );

    for (const months of LOAN_DURATIONS_MONTHS) {
      await expect(
        group.getByRole("radio", {
          name: t("projectApplication.durationOptions.months", {
            count: months,
          }),
        }),
      ).toBeVisible();
    }
  });

  test("rejects a loan below the engine's minimum", async ({ page }) => {
    // LOAN_MIN_VND is 200,000,000 and the engine's `loan_constraints` reject
    // anything under it, so the form must catch this before the API does.
    await fillStepOne(page);
    await next(page);
    await fillAddress(page);
    await next(page);
    await fillIncorporation(page);
    await next(page);

    await page
      .getByLabel(t("projectApplication.fields.requestedAmount"))
      .fill("1000000");

    // The loan step is validated by the wizard's Next (step 5 is the review),
    // so that is where the constraint is enforced.
    await next(page);

    await expect(
      page.getByText(t("projectApplication.validation.requestedAmountRange")),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/project-application$/);
  });

  test("requires a loan term to be chosen", async ({ page }) => {
    await fillStepOne(page);
    await next(page);
    await fillAddress(page);
    await next(page);
    await fillIncorporation(page);
    await next(page);

    await page
      .getByLabel(t("projectApplication.fields.requestedAmount"))
      .fill("500000000");
    await next(page);

    // No duration selected — the engine cannot score an application without
    // one, so the wizard must not advance.
    await expect(
      page.getByText(t("projectApplication.validation.durationMonths")),
    ).toBeVisible();
  });
});
