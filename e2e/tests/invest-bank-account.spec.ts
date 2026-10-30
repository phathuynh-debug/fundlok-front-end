import { test, expect } from "@playwright/test";

import { STUB_PUBLIC_PROJECTS } from "../stub-api/fixtures";
import {
  signInAs,
  withPendingBankAccount,
  withoutBankAccounts,
} from "../support/auth";
import { t } from "../support/i18n";

// An investor can only invest once they have saved a bank account: repayments
// are paid back into it, and the order endpoint refuses an investor without
// one (BANK_ACCOUNT_REQUIRED). The stub gives investors an account by default;
// these specs take it away.

const project = STUB_PUBLIC_PROJECTS[0];
const PROMPT = "investment.tab.bankAccountPrompt";

test.beforeEach(async ({ context }) => {
  await signInAs(context, "investor");
  await withoutBankAccounts(context);
});

test("the project page asks for a bank account and holds back Invest", async ({
  page,
}) => {
  await page.goto(`/dashboard/projects/${project.id}`);

  const prompt = page.getByTestId("bank-account-prompt");
  await expect(prompt).toBeVisible();
  await expect(prompt).toContainText(t(`${PROMPT}.title`));
  await expect(
    page.getByRole("button", { name: t("investment.tab.investNow") }),
  ).toBeDisabled();

  await prompt.getByRole("link", { name: t(`${PROMPT}.cta`) }).click();
  await expect(page).toHaveURL(/\/dashboard\/settings\/profile#bank-account$/);
});

test("the invest page asks for a bank account instead of the terms", async ({
  page,
}) => {
  // Reached by URL, it checks for itself rather than trusting the button.
  await page.goto(`/dashboard/invest?amount=10000000&projectId=${project.id}`);

  await expect(page.getByTestId("bank-account-prompt")).toBeVisible();
  await expect(page.getByTestId("investing-terms")).toHaveCount(0);
});

test("an investor with a saved account sees no prompt", async ({
  page,
  context,
}) => {
  await context.clearCookies({ name: "stub_bank_accounts" });
  await page.goto(`/dashboard/projects/${project.id}`);

  await expect(
    page.getByRole("button", { name: t("investment.tab.investNow") }),
  ).toBeEnabled();
  await expect(page.getByTestId("bank-account-prompt")).toHaveCount(0);
});

test("an account waiting for approval holds back Invest and says so", async ({
  page,
  context,
}) => {
  await withPendingBankAccount(context);
  await page.goto(`/dashboard/projects/${project.id}`);

  const prompt = page.getByTestId("bank-account-prompt");
  await expect(prompt).toHaveAttribute("data-state", "pending");
  await expect(prompt).toContainText(t(`${PROMPT}.pendingTitle`));
  await expect(
    page.getByRole("button", { name: t("investment.tab.investNow") }),
  ).toBeDisabled();
});
