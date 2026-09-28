import { test, expect, type Page } from "@playwright/test";

import { signInAs } from "../support/auth";
import { t } from "../support/i18n";

// The investor tab of /rate, and the admin screen its leads land on. Figures
// come from the stub API (the prototype's locked scenario), so these prove the
// page renders the SERVER's walk-down; the page itself does no pricing.

const investorTab = (page: Page) =>
  page.getByRole("tab", { name: new RegExp(t("ratePage.audience.investor")) });

async function passGate(page: Page) {
  await page.getByRole("checkbox").first().click();
  await page
    .getByRole("button", { name: t("ratePage.investor.gateContinue") })
    .click();
}

// Scoped to the investor panel: the page has other fields labelled "Email".
const panel = (page: Page) => page.locator("#rate-panel-investor");

async function fillDetails(page: Page) {
  await panel(page)
    .getByLabel(t("ratePage.investor.name"))
    .fill("Nguyễn Văn Thử");
  await panel(page)
    .getByLabel(t("ratePage.investor.email"))
    .fill("thu@example.com");
  // Required on both forms: the team follows up by phone.
  await panel(page)
    .getByLabel(t("ratePage.investor.phone"))
    .fill("0901 234 567");
  // Scoped: the business form carries the same consent sentence.
  await panel(page).getByText(t("ratePage.investor.consent")).click();
}

test("the SME form is the default and the investor tab is one click away", async ({
  page,
}) => {
  await page.goto("/rate");
  await expect(page.getByRole("tab", { selected: true })).toContainText(
    t("ratePage.audience.sme"),
  );

  await investorTab(page).click();
  await expect(page).toHaveURL(/[?&]for=investor/);
  await expect(
    page.getByRole("heading", { name: t("ratePage.investor.gateTitle") }),
  ).toBeVisible();
});

test("?for=investor opens the investor tab from the first render", async ({
  page,
}) => {
  await page.goto("/rate?for=investor");
  await expect(investorTab(page)).toHaveAttribute("aria-selected", "true");
});

test("the gate has to be acknowledged before the calculator shows", async ({
  page,
}) => {
  await page.goto("/rate?for=investor");
  const cont = page.getByRole("button", {
    name: t("ratePage.investor.gateContinue"),
  });
  await expect(cont).toBeDisabled();
  await passGate(page);
  await expect(
    page.getByRole("heading", { name: t("ratePage.investor.formTitle") }),
  ).toBeVisible();
});

test("the yield stays hidden until details are given, then updates live", async ({
  page,
}) => {
  await page.goto("/rate?for=investor");
  await passGate(page);

  // The tier hint is a LOAN rate and shows before calculating.
  await expect(
    page.getByText(t("ratePage.investor.tierHint.balanced", { rate: "14,0" })),
  ).toBeVisible();
  await expect(page.getByText("17,27%")).toHaveCount(0);

  // Missing details: nothing is sent, and each field says why.
  await page
    .getByRole("button", { name: t("ratePage.investor.calculate") })
    .click();
  await expect(page.getByText(t("ratePage.investor.error.name"))).toBeVisible();
  await expect(
    page.getByText(t("ratePage.investor.error.consent")),
  ).toBeVisible();

  await fillDetails(page);
  const created = page.waitForRequest(
    (req) =>
      req.url().endsWith("/api/v1/rates/investor/leads") &&
      req.method() === "POST",
  );
  await page
    .getByRole("button", { name: t("ratePage.investor.calculate") })
    .click();
  const body = (await created).postDataJSON();
  expect(body.acknowledged_illustrative).toBe(true);
  expect(body.consent_contact).toBe(true);
  expect(body).not.toHaveProperty("shown_net_apy");

  await expect(page.getByText("17,27%").first()).toBeVisible();
  await expect(page.getByText("−2,50%")).toBeVisible();
  await expect(page.getByText("10,50%").first()).toBeVisible();

  // Contact details lock once the lead exists.
  await expect(page.getByLabel(t("ratePage.investor.name"))).toBeDisabled();

  // Live: a new tier re-prices without asking for details again.
  await page
    .getByRole("radio", { name: t("ratePage.investor.tier.growth") })
    .click();
  await expect(page.getByText("17,60%").first()).toBeVisible();
});

test("signing up shows the reference to quote", async ({ page }) => {
  await page.goto("/rate?for=investor");
  await passGate(page);
  await fillDetails(page);
  await page
    .getByRole("button", { name: t("ratePage.investor.calculate") })
    .click();
  await page
    .getByRole("button", { name: t("ratePage.investor.signup") })
    .click();
  await expect(
    page.getByText(t("ratePage.investor.successTitle")),
  ).toBeVisible();
  await expect(page.getByText(/FL-STUB42/)).toBeVisible();
});

test("switching tabs keeps what was typed", async ({ page }) => {
  await page.goto("/rate?for=investor");
  await passGate(page);
  await page.getByLabel(t("ratePage.investor.name")).fill("Giữ Nguyên");
  await page
    .getByRole("tab", { name: new RegExp(t("ratePage.audience.sme")) })
    .click();
  await investorTab(page).click();
  await expect(page.getByLabel(t("ratePage.investor.name"))).toHaveValue(
    "Giữ Nguyên",
  );
});

test.describe("as an admin", () => {
  test.beforeEach(async ({ context }) => {
    await signInAs(context, "admin");
  });

  test("investor leads are listed with what they signed up on", async ({
    page,
  }) => {
    await page.goto("/admin/rates");
    await page
      .getByRole("tab", { name: t("admin.ratesPage.tabInvestor") })
      .click();
    await expect(page.getByText("Trần Thị Nhà Đầu Tư")).toBeVisible();
    await expect(page.getByText("FL-STUB42")).toBeVisible();

    await page.getByText("Trần Thị Nhà Đầu Tư").click();
    await expect(
      page.getByText(t("admin.investorLeads.atSignup")),
    ).toBeVisible();
    await expect(page.getByText("22.10%")).toBeVisible();
  });
});
