import { test, expect } from "@playwright/test";

import { formatCurrency } from "../../lib/format-currency";
import { STUB_PUBLIC_PROJECTS } from "../stub-api/fixtures";
import { signInAs } from "../support/auth";
import { normalizeSpaces, t } from "../support/i18n";

// Investing through a funding window (ADR-009): the investor picks an amount
// within the window's range on the project page, agrees to the investing
// terms, and is shown the business's own bank account to transfer to. The
// stub's window is the first project's listing: 80M target, 20M confirmed,
// 10M minimum ticket, so 10M to 60M can be invested.

const project = STUB_PUBLIC_PROJECTS[0];
const amount = 20_000_000;

test.beforeEach(async ({ context }) => {
  await signInAs(context, "investor");
});

test("the project page shows the round and the range one ticket can take", async ({
  page,
}) => {
  await page.goto(`/dashboard/projects/${project.id}`);

  await expect(page.getByTestId("funding-progress")).toBeVisible();
  await expect(
    page.getByText(
      normalizeSpaces(
        t("investment.tab.minimum", {
          amount: formatCurrency(10_000_000, "vi"),
        }),
      ),
      { exact: false },
    ),
  ).toBeVisible();
  await expect(
    page.getByText(
      normalizeSpaces(
        t("investment.tab.maximum", {
          amount: formatCurrency(60_000_000, "vi"),
        }),
      ),
      { exact: false },
    ),
  ).toBeVisible();
});

test("an amount below the minimum is refused on the project page", async ({
  page,
}) => {
  await page.goto(`/dashboard/projects/${project.id}`);
  await page.locator("#investmentAmount").fill("5000000");
  await page
    .getByRole("button", { name: t("investment.tab.investNow") })
    .click();

  await expect(
    page.getByText(t("investment.tab.invalidAmountTitle")).first(),
  ).toBeVisible();
  await expect(page).toHaveURL(
    new RegExp(`/dashboard/projects/${project.id}$`),
  );
});

test("invest, agree to the terms, then see the business's bank details", async ({
  page,
}) => {
  await page.goto(`/dashboard/projects/${project.id}`);
  await page.locator("#investmentAmount").fill(String(amount));
  await page
    .getByRole("button", { name: t("investment.tab.investNow") })
    .click();

  await expect(page).toHaveURL(
    new RegExp(`/dashboard/invest\\?amount=${amount}&projectId=${project.id}`),
  );
  await expect(page.getByTestId("investing-terms")).toBeVisible();

  const agree = page.getByRole("button", {
    name: normalizeSpaces(
      t("investConfirm.terms.submit", {
        amount: formatCurrency(amount, "vi"),
      }),
    ),
  });
  // Nothing is reserved until the terms are agreed to.
  await expect(agree).toBeDisabled();
  await page.getByLabel(t("investConfirm.terms.agree")).check();
  await agree.click();

  const transfer = page.getByTestId("transfer-details");
  await expect(transfer).toBeVisible();
  await expect(transfer).toContainText("19036789012");
  await expect(transfer).toContainText("CONG TY DELTA FOODS");
  await expect(transfer).toContainText("FLAB12CD34");
  await expect(transfer).toContainText(
    normalizeSpaces(formatCurrency(amount, "vi")),
  );
  await expect(page.getByTestId("transfer-qr")).toBeVisible();
  await expect(page.getByTestId("transfer-deadline")).toBeVisible();

  // Back on the project, the ticket leads to its transfer details again.
  await page
    .getByRole("link", { name: t("investConfirm.backToProject") })
    .click();
  const ticket = page.getByTestId("my-ticket");
  await expect(ticket).toBeVisible();
  await ticket
    .getByRole("link", { name: t("investment.tab.yourTicketCta") })
    .click();
  await expect(page.getByTestId("transfer-details")).toBeVisible();
});

test("an amount outside the range by URL gets no terms", async ({ page }) => {
  await page.goto(`/dashboard/invest?amount=1000&projectId=${project.id}`);

  await expect(
    page.getByText(t("investConfirm.amountOutOfRangeTitle")),
  ).toBeVisible();
  await expect(page.getByTestId("investing-terms")).toHaveCount(0);
});
