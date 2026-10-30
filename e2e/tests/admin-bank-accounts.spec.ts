import { test, expect } from "@playwright/test";

import { STUB_USERS } from "../stub-api/fixtures";
import { signInAs } from "../support/auth";
import { t } from "../support/i18n";

// /admin/bank-accounts: the bank accounts SMEs and investors saved, waiting for
// an admin. Only an approved account lists a project or lets an investor
// invest; the backend records each decision in the audit log.

const K = "admin.bankAccounts";

test.beforeEach(async ({ context, page }) => {
  await signInAs(context, "admin");
  await page.goto("/admin/bank-accounts");
});

test("lists the accounts waiting for review, with their owners", async ({
  page,
}) => {
  await expect(
    page.getByRole("heading", { name: t(`${K}.title`), exact: true }),
  ).toBeVisible();
  const items = page.getByTestId("bank-account-review-item");
  await expect(items).toHaveCount(2);
  await expect(items.first()).toContainText(STUB_USERS.investor.email);
  await expect(items.first()).toContainText("0011001234567");
});

test("approving an account takes it out of the queue", async ({ page }) => {
  const item = page
    .getByTestId("bank-account-review-item")
    .filter({ hasText: STUB_USERS.investor.email });
  await item.getByRole("button", { name: t(`${K}.approve`) }).click();

  await expect(item).toHaveCount(0);
  await expect(page.getByTestId("bank-account-review-item")).toHaveCount(1);
});

test("rejecting needs a reason", async ({ page }) => {
  const item = page
    .getByTestId("bank-account-review-item")
    .filter({ hasText: STUB_USERS.sme.email });
  await item.getByRole("button", { name: t(`${K}.reject`) }).click();
  await expect(item.getByText(t(`${K}.reasonRequired`))).toBeVisible();

  await item.getByRole("textbox").fill("Name does not match the KYC record");
  await item.getByRole("button", { name: t(`${K}.reject`) }).click();
  await expect(item).toHaveCount(0);
});
