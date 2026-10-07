import { test, expect, type Page } from "@playwright/test";

import { STUB_PUBLIC_PROJECTS } from "../stub-api/fixtures";
import { signInAs } from "../support/auth";
import { t } from "../support/i18n";
import { takeIdentityPhotos } from "../support/kyc";

// Verification in its own tab. An unverified investor who presses Invest gets
// KYC in a NEW tab; once approved, that tab closes itself and the original tab
// goes on to /dashboard/invest with the amount and project they chose.
// (lib/verification-tab.ts, hooks/use-verification-gate.ts,
// app/kyc/use-finish-verification.ts.)

const project = STUB_PUBLIC_PROJECTS[0];

/**
 * Open the project page and wait until the Invest button knows this investor is
 * not verified.
 *
 * The gate (hooks/use-verification-gate.ts) decides from the KYC status query.
 * Until that has loaded it treats the investor as verified and just navigates,
 * with the proxy's redirect as the backstop. A click that lands before the
 * status does therefore opens no tab, and under load (these specs now run a
 * camera too) it sometimes did. Waiting for the response, then for the page to
 * have rendered it, removes the race instead of retrying around it.
 */
async function openProjectPage(page: Page) {
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/gverify/kyc/status") && response.ok(),
    ),
    page.goto(`/dashboard/project-details?id=${project.id}`),
  ]);
  // Two frames: enough for React to have committed the query result.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}

test("Invest opens KYC in a new tab, which closes and returns the user to the action", async ({
  page,
  context,
}) => {
  await signInAs(context, "unapprovedInvestorTab");
  await openProjectPage(page);

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

  // On desktop, KYC exclusively shows the QR code to verify via phone.
  const qrCode = verification.getByTestId("kyc-qr-code");
  await expect(qrCode).toBeVisible();
  const phoneUrl = await qrCode.getAttribute("data-qr-value");
  expect(phoneUrl).toBeTruthy();

  // Open the handoff URL (as if scanning the QR code on a mobile device).
  const phonePage = await context.newPage();
  await phonePage.goto(phoneUrl!);
  await takeIdentityPhotos(phonePage);
  await phonePage
    .getByRole("button", { name: t("kyc.gv.submitBtn"), exact: true })
    .click();
  await expect(phonePage.getByText(t("kyc.approvedTitle"))).toBeVisible();

  // The desktop tab polls, notices approval, shows confirmation, and closes itself.
  const closed = verification.waitForEvent("close");
  await expect(verification.getByText(t("kyc.approvedTitle"))).toBeVisible();
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
  await openProjectPage(page);
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
