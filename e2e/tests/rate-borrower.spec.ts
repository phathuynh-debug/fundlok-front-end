import { test, expect, type Page } from "@playwright/test";

import { t } from "../support/i18n";

/**
 * The business (borrower) tab of /rate: the estimate is stored as a rate
 * inquiry, so the form asks how to reach the visitor — email, phone and
 * consent (Decree 13/2023) — before it will calculate.
 */

const panel = (page: Page) => page.locator("#rate-panel-sme");

async function fillFigures(page: Page) {
  const form = panel(page);
  await form.locator("select").selectOption("Retail Trade");
  for (const [placeholder, value] of [
    ["36", "36"],
    ["25", "25"],
    ["4000000000", "4000000000"],
    ["3200000000", "3200000000"],
    ["2400000000", "2400000000"],
    ["600000000", "600000000"],
    ["800000000", "800000000"],
  ]) {
    await form.getByPlaceholder(placeholder, { exact: true }).fill(value);
  }
}

async function fillContact(page: Page) {
  const form = panel(page);
  await form.getByLabel(t("ratePage.fullName")).fill("Nguyễn Văn Chủ");
  await form.getByLabel(t("ratePage.companyName")).fill("Công ty TNHH Mẫu");
  await form.getByLabel(t("ratePage.email")).fill("owner@company.vn");
  await form.getByLabel(t("ratePage.phone")).fill("0901 234 567");
}

const submit = (page: Page) =>
  panel(page).getByRole("button", { name: t("ratePage.submit") });

test("asks for email and phone, and says the inquiry is saved", async ({
  page,
}) => {
  await page.goto("/rate");

  for (const label of ["fullName", "companyName", "email", "phone"]) {
    await expect(panel(page).getByLabel(t(`ratePage.${label}`))).toBeVisible();
  }
  await expect(panel(page).getByLabel(t("ratePage.phone"))).toBeVisible();
  // No longer claims that nothing is saved.
  await expect(panel(page).getByText(t("ratePage.formHint"))).toBeVisible();
});

test("will not calculate without contact details and consent", async ({
  page,
}) => {
  await page.goto("/rate");
  await fillFigures(page);
  await expect(submit(page)).toBeDisabled();

  await fillContact(page);
  // Still missing: consent.
  await expect(submit(page)).toBeDisabled();

  await panel(page).getByText(t("ratePage.consent")).click();
  await expect(submit(page)).toBeEnabled();
});

test("the name and company are required too", async ({ page }) => {
  await page.goto("/rate");
  await fillFigures(page);
  const form = panel(page);
  await form.getByLabel(t("ratePage.email")).fill("owner@company.vn");
  await form.getByLabel(t("ratePage.phone")).fill("0901 234 567");
  await form.getByText(t("ratePage.consent")).click();
  // Email, phone and consent alone are not enough.
  await expect(submit(page)).toBeDisabled();

  await form.getByLabel(t("ratePage.fullName")).fill("Nguyễn Văn Chủ");
  await expect(submit(page)).toBeDisabled();
  await form.getByLabel(t("ratePage.companyName")).fill("Công ty TNHH Mẫu");
  await expect(submit(page)).toBeEnabled();
});

test("rejects a phone number with too few digits", async ({ page }) => {
  await page.goto("/rate");
  const phone = panel(page).getByLabel(t("ratePage.phone"));
  await phone.fill("1234");
  await phone.blur();
  await expect(panel(page).getByText(t("ratePage.error.phone"))).toBeVisible();
});

test("sends the contact with the figures and shows the estimate", async ({
  page,
}) => {
  await page.goto("/rate");
  await fillFigures(page);
  await fillContact(page);
  await panel(page).getByText(t("ratePage.consent")).click();

  const request = page.waitForRequest(
    (r) => r.url().includes("/rates/calculate") && r.method() === "POST",
  );
  await submit(page).click();
  const body = (await request).postDataJSON();
  expect(body.full_name).toBe("Nguyễn Văn Chủ");
  expect(body.company_name).toBe("Công ty TNHH Mẫu");
  expect(body.email).toBe("owner@company.vn");
  expect(body.phone).toBe("0901 234 567");
  expect(body.consent_contact).toBe(true);

  await expect(panel(page).getByText(t("ratePage.resultTitle"))).toBeVisible();
});
