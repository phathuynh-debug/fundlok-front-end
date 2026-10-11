import { test, expect } from "@playwright/test";

import {
  MOCK_TRANSACTIONS,
  summarize,
} from "../../app/dashboard/transactions/_components/mock-transactions";
// import {
//   MOCK_SME_TRANSACTIONS,
//   summarizeSme,
// } from "../../app/dashboard/transactions/_components/sme/mock-sme-transactions";
// — commented out with the mock data; the SME ledger shows its empty state,
// so the data-dependent SME assertions below are commented out with it.
import { formatCurrency } from "../../lib/format-currency";
import { signInAs } from "../support/auth";
import { normalizeSpaces, t } from "../support/i18n";

// /dashboard/transactions renders a completely different screen per role, so
// each gets its own block. Both read their own mock module, imported here so
// the expectations cannot drift from the fixture.

test.describe("investor ledger", () => {
  const summary = summarize(MOCK_TRANSACTIONS);

  test.beforeEach(async ({ context, page }) => {
    await signInAs(context, "investor");
    await page.goto("/dashboard/transactions");
  });

  test("shows the investor title and the money-in/out summary", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: t("dashboard.transactions.title") }),
    ).toBeVisible();

    await expect(
      page.getByText(t("dashboard.transactions.summary.moneyIn"), {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(normalizeSpaces(formatCurrency(summary.totalIn, "vi")), {
        exact: false,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(normalizeSpaces(formatCurrency(summary.totalOut, "vi")), {
        exact: false,
      }),
    ).toBeVisible();
  });

  test("lists every transaction and says how many are shown", async ({
    page,
  }) => {
    await expect(
      page.getByText(
        t("dashboard.transactions.showing", {
          shown: MOCK_TRANSACTIONS.length,
          total: MOCK_TRANSACTIONS.length,
        }),
      ),
    ).toBeVisible();

    // Header row plus one per transaction.
    await expect(page.getByRole("row")).toHaveCount(
      MOCK_TRANSACTIONS.length + 1,
    );
  });

  test("filtering by status narrows the table", async ({ page }) => {
    const pendingCount = MOCK_TRANSACTIONS.filter(
      (txn) => txn.status === "PENDING",
    ).length;

    await page
      .getByRole("button", {
        name: t("dashboard.transactions.status.pending"),
        exact: true,
      })
      .click();

    await expect(
      page.getByText(
        t("dashboard.transactions.showing", {
          shown: pendingCount,
          total: MOCK_TRANSACTIONS.length,
        }),
      ),
    ).toBeVisible();
    await expect(page.getByRole("row")).toHaveCount(pendingCount + 1);
  });

  test("searching by counterparty narrows the table", async ({ page }) => {
    const target = MOCK_TRANSACTIONS[0].counterparty;
    const expected = MOCK_TRANSACTIONS.filter(
      (txn) => txn.counterparty === target,
    ).length;

    await page
      .getByPlaceholder(t("dashboard.transactions.searchPlaceholder"))
      .fill(target);

    await expect(page.getByRole("row")).toHaveCount(expected + 1);
  });

  test("a search that matches nothing shows the empty state, not a blank table", async ({
    page,
  }) => {
    await page
      .getByPlaceholder(t("dashboard.transactions.searchPlaceholder"))
      .fill("zzz-no-such-project");

    await expect(
      page.getByText(t("dashboard.transactions.empty.title")),
    ).toBeVisible();
    await expect(page.getByRole("row")).toHaveCount(0);
  });

  test("marks the figures as sample data", async ({ page }) => {
    await expect(
      page.getByText(t("dashboard.transactions.mockNotice")),
    ).toBeVisible();
  });
});

test.describe("SME ledger", () => {
  // const summary = summarizeSme(MOCK_SME_TRANSACTIONS);

  test.beforeEach(async ({ context, page }) => {
    await signInAs(context, "sme");
    await page.goto("/dashboard/transactions");
  });

  test("shows the SME title, not the investor one", async ({ page }) => {
    // The two roles must not share a screen: a borrower has no "money in from
    // returns", they have a disbursement and repayments.
    await expect(
      page.getByRole("heading", { name: t("dashboard.transactions.smeTitle") }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: t("dashboard.transactions.title"),
        exact: true,
      }),
    ).toHaveCount(0);
  });

  // Data-dependent assertions, commented out with the mock data. Restore them
  // (with the summary line above) when a real ledger endpoint replaces the mock.

  // test("summarises disbursement, repayments and fees", async ({ page }) => {
  //   for (const label of [
  //     "dashboard.transactions.smeSummary.disbursed",
  //     "dashboard.transactions.smeSummary.repaid",
  //     "dashboard.transactions.smeSummary.fees",
  //   ]) {
  //     await expect(page.getByText(t(label), { exact: true })).toBeVisible();
  //   }
  //
  //   // The disbursement figure appears twice by design — once in the summary
  //   // card and once as the ledger row it came from. The card's copy is enough.
  //   await expect(
  //     page
  //       .getByText(normalizeSpaces(formatCurrency(summary.disbursed, "vi")), {
  //         exact: false,
  //       })
  //       .first(),
  //   ).toBeVisible();
  // });
  //
  // test("distinguishes an early repayment from a scheduled one", async ({
  //   page,
  // }) => {
  //   await expect(
  //     page.getByText(t("dashboard.transactions.types.earlyRepayment")).first(),
  //   ).toBeVisible();
  // });
  //
  // test("lists every SME transaction", async ({ page }) => {
  //   await expect(page.getByRole("row")).toHaveCount(
  //     MOCK_SME_TRANSACTIONS.length + 1,
  //   );
  // });
});
