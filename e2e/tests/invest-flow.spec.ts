import { test, expect } from "@playwright/test";

import { formatCurrency } from "../../lib/format-currency";
import { STUB_PUBLIC_PROJECTS } from "../stub-api/fixtures";
import { signInAs } from "../support/auth";
import { normalizeSpaces, t } from "../support/i18n";

// Investing through a funding window (ADR-009): the investor picks an amount
// within the window's range on the project page, agrees to the investing
// terms, and is shown the business's own bank account to transfer to. Before
// their first investment they sign the Investor Service Agreement (Contract 4)
// digitally: download the filled-in PDF, sign it, upload it. Every commitment
// then reminds them of it and signs only its Investment Confirmation (the
// Annex). The stub's window is the first project's listing: 80M target, 20M confirmed,
// 10M minimum ticket, so 10M to 60M can be invested.

const project = STUB_PUBLIC_PROJECTS[0];
const amount = 20_000_000;

/** A PDF carrying a signature dictionary, as a digital-signing tool leaves it. */
const signedPdf = (name = "hop-dong-da-ky.pdf") => ({
  name,
  mimeType: "application/pdf",
  buffer: Buffer.from(
    "%PDF-1.7\n1 0 obj << /Type /Catalog >> endobj\n" +
      "9 0 obj << /Type /Sig /ByteRange [0 120 4216 380] /Contents <3082> >> endobj\n%%EOF\n",
  ),
});

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

test("a typed amount is grouped and shows its 2.5% target return", async ({
  page,
}) => {
  await page.goto(`/dashboard/projects/${project.id}`);
  const input = page.locator("#investmentAmount");
  await input.fill("25000000");

  await expect(input).toHaveValue("25.000.000");
  const target = page.getByTestId("target-return");
  await expect(target).toContainText(
    normalizeSpaces(formatCurrency(625_000, "vi")),
  );
  await expect(target).toContainText(t("dashboard.projectCard.notGuaranteed"));
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

test("invest, sign the service agreement and the terms, then see the business's bank details", async ({
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
  // First investment: the agreement to sign, previewed and downloadable,
  // before the terms.
  await expect(page.getByTestId("investor-agreement-preview")).toBeVisible();
  await expect(
    page.getByRole("link", { name: t("investConfirm.agreement.download") }),
  ).toHaveAttribute("download", /FundLok-hop-dong-dich-vu-nha-dau-tu/);
  await expect(page.getByTestId("investing-terms")).toHaveCount(0);
  const send = page.getByRole("button", {
    name: t("investConfirm.agreement.upload"),
  });
  await expect(send).toBeDisabled();
  await page.getByTestId("investor-agreement-input").setInputFiles(signedPdf());
  await send.click();

  // Signed: the terms, with the signed copy a click away and this
  // commitment's Annex.
  await expect(page.getByTestId("investing-terms")).toBeVisible();
  await expect(page.getByTestId("signed-agreement-notice")).toBeVisible();
  await expect(page.getByTestId("investment-confirmation-table")).toContainText(
    project.legal_name,
  );

  const agree = page.getByRole("button", {
    name: normalizeSpaces(
      t("investConfirm.terms.submit", {
        amount: formatCurrency(amount, "vi"),
      }),
    ),
  });
  // Nothing is reserved until the terms are agreed to.
  await expect(agree).toBeDisabled();
  await page.getByLabel(t("investConfirm.terms.agreeWithConfirmation")).check();
  await agree.click();

  // Before paying: the Annex confirmed with this ticket, filled in.
  const confirmation = page.getByTestId("signed-confirmation");
  await expect(confirmation).toBeVisible();
  await expect(confirmation).toContainText(project.legal_name);
  await expect(confirmation).toContainText("20.000.000 VND");
  await expect(
    confirmation.getByRole("link", {
      name: t("investConfirm.signedConfirmation.download"),
    }),
  ).toHaveAttribute("download", /FLAB12CD34/);

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

test("a returning investor is reminded of the signed agreement, not asked again", async ({
  context,
  page,
}) => {
  await context.addCookies([
    {
      name: "stub_agreement_signed",
      value: "1",
      domain: "127.0.0.1",
      path: "/",
    },
  ]);
  await page.goto(`/dashboard/invest?amount=${amount}&projectId=${project.id}`);

  await expect(page.getByTestId("investing-terms")).toBeVisible();
  await expect(page.getByTestId("investor-agreement-preview")).toHaveCount(0);
  const notice = page.getByTestId("signed-agreement-notice");
  await expect(notice).toContainText(t("investConfirm.signedAgreement.title"));
  await expect(page.getByTestId("investment-confirmation-table")).toBeVisible();

  // The signed copy is a click away.
  await notice
    .getByRole("button", { name: t("investConfirm.signedAgreement.view") })
    .click();
  await expect(
    page.getByRole("dialog").getByTestId("signed-agreement-preview"),
  ).toBeVisible();
});

test("the agreement sent back unsigned is refused, and the terms stay closed", async ({
  page,
}) => {
  await page.goto(`/dashboard/invest?amount=${amount}&projectId=${project.id}`);
  await expect(page.getByTestId("investor-agreement-preview")).toBeVisible();

  await page.getByTestId("investor-agreement-input").setInputFiles({
    name: "chua-ky.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(
      "%PDF-1.7\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n",
    ),
  });
  await page
    .getByRole("button", { name: t("investConfirm.agreement.upload") })
    .click();

  await expect(page.getByRole("alert").first()).toContainText(
    t("investConfirm.agreement.errors.INVESTOR_AGREEMENT_UNSIGNED"),
  );
  await expect(page.getByTestId("investing-terms")).toHaveCount(0);
});

test("an amount outside the range by URL gets no terms", async ({ page }) => {
  await page.goto(`/dashboard/invest?amount=1000&projectId=${project.id}`);

  await expect(
    page.getByText(t("investConfirm.amountOutOfRangeTitle")),
  ).toBeVisible();
  await expect(page.getByTestId("investing-terms")).toHaveCount(0);
});
