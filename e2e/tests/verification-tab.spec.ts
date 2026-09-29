import { test, expect } from "@playwright/test";

import { STUB_PUBLIC_PROJECTS } from "../stub-api/fixtures";
import { signInAs } from "../support/auth";
import { t } from "../support/i18n";

// Verification in its own tab. An unverified investor who presses Invest gets
// KYC in a NEW tab; once approved, that tab closes itself and the original tab
// goes on to /dashboard/invest with the amount and project they chose.
// (lib/verification-tab.ts, hooks/use-verification-gate.ts,
// app/kyc/use-finish-verification.ts.)

const project = STUB_PUBLIC_PROJECTS[0];

// A 1x1 PNG: enough to pass the capture's type check.
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test("Invest opens KYC in a new tab, which closes and returns the user to the action", async ({
  page,
  context,
}) => {
  await signInAs(context, "unapprovedInvestorTab");
  await page.goto(`/dashboard/project-details?id=${project.id}`);

  await page.locator("#investmentAmount").fill("131");
  const [verification] = await Promise.all([
    page.waitForEvent("popup"),
    page.getByRole("button", { name: t("investment.tab.investNow") }).click(),
  ]);

  // The original tab stays where it was and says what's happening.
  await expect(page).toHaveURL(/\/dashboard\/project-details/);
  await expect(
    page.getByText(t("kyc.newTab.title"), { exact: true }),
  ).toBeVisible();

  // The new tab is the KYC screen, carrying the destination and its tab id.
  await expect(verification).toHaveURL(/\/kyc\?next=.*vtab=/);
  const next = new URL(verification.url()).searchParams.get("next");
  expect(next).toBe(`/dashboard/invest?amount=131&projectId=${project.id}`);

  for (const slot of ["front", "back", "portrait"]) {
    await verification.locator(`#gverify-${slot}`).setInputFiles({
      name: `${slot}.png`,
      mimeType: "image/png",
      buffer: TINY_PNG,
    });
  }
  const closed = verification.waitForEvent("close");
  await verification
    .getByRole("button", { name: t("kyc.gv.submitBtn"), exact: true })
    .click();
  await expect(verification.getByText(t("kyc.approvedTitle"))).toBeVisible();

  // It closes itself...
  await closed;
  // ...and the original tab moves on to the investment it was starting.
  await expect(page).toHaveURL(
    new RegExp(`/dashboard/invest\\?amount=131&projectId=${project.id}`),
  );
});

test("a verified investor's Invest goes straight to the investment, no new tab", async ({
  page,
  context,
}) => {
  await signInAs(context, "investor");
  await page.goto(`/dashboard/project-details?id=${project.id}`);

  let opened = false;
  page.on("popup", () => {
    opened = true;
  });
  await page.locator("#investmentAmount").fill("131");
  await page
    .getByRole("button", { name: t("investment.tab.investNow") })
    .click();

  await expect(page).toHaveURL(/\/dashboard\/invest\?amount=131/);
  expect(opened).toBe(false);
});

test("pressing Invest again reuses the open verification tab", async ({
  page,
  context,
}) => {
  await signInAs(context, "unapprovedInvestor");
  await page.goto(`/dashboard/project-details?id=${project.id}`);
  await page.locator("#investmentAmount").fill("131");

  const invest = page.getByRole("button", {
    name: t("investment.tab.investNow"),
  });
  const [first] = await Promise.all([
    page.waitForEvent("popup"),
    invest.click(),
  ]);
  await expect(first).toHaveURL(/\/kyc\?/);

  await invest.click();
  await page.waitForTimeout(500);

  // Still one verification tab (plus the original page).
  expect(context.pages()).toHaveLength(2);
});
