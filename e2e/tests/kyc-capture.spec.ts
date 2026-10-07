import { test, expect, type Page } from "@playwright/test";

import { signInAs } from "../support/auth";
import { t } from "../support/i18n";
import { takeIdentityPhotos } from "../support/kyc";

// The identity check's photos are taken live. The point of the check is to see
// who is registering, so the app offers no way to add a picture from the
// device: no file picker, no "choose from library", and no fallback to either
// when the camera cannot open. These pin that, on the desktop screen and on the
// phone page the QR code opens.
//
// What this does NOT prove, and the app does not claim: that a request cannot
// be sent to the API with some other image. Catching that takes liveness
// detection from the verification provider.

/** The tile for the photo still to take, found by what it asks the person to do. */
const photoTile = (page: Page) =>
  page.getByRole("button", {
    name: new RegExp(
      t("kyc.gv.clickToAdd").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    ),
  });

/** No picture can be picked from the device: nothing on the page takes a file. */
async function expectNoUpload(page: Page) {
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await expect(page.getByText(/library|thư viện/i)).toHaveCount(0);
}

test.describe("the identity verification on the desktop screen", () => {
  test.beforeEach(async ({ context }) => {
    await signInAs(context, "unapprovedInvestor");
  });

  test("displays the phone QR code and offers no file upload", async ({
    page,
  }) => {
    await page.goto("/kyc");

    await expect(page.getByText(t("kyc.gv.qrTitle"))).toBeVisible();
    await expect(page.getByTestId("kyc-qr-code")).toBeVisible();
    await expectNoUpload(page);
    // Desktop camera dialog / webcam is not present on desktop
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("can be scanned and completed via phone", async ({ page, context }) => {
    await signInAs(context, "unapprovedInvestorCamera");
    await page.goto("/kyc");

    const qrCode = page.getByTestId("kyc-qr-code");
    await expect(qrCode).toBeVisible();
    const phoneUrl = await qrCode.getAttribute("data-qr-value");
    expect(phoneUrl).toBeTruthy();

    const phonePage = await context.newPage();
    await phonePage.goto(phoneUrl!);

    await takeIdentityPhotos(phonePage);
    await expect(phonePage.getByText(t("kyc.gv.photoTaken"))).toBeVisible();

    await phonePage
      .getByRole("button", { name: t("kyc.gv.submitBtn"), exact: true })
      .click();
    await expect(phonePage.getByText(t("kyc.approvedTitle"))).toBeVisible();

    // Desktop page polls, detects approval, and advances to dashboard.
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe("the identity photos on a mobile device visiting /kyc directly", () => {
  test.use({ viewport: { width: 375, height: 667 }, isMobile: true });

  test.beforeEach(async ({ context }) => {
    await signInAs(context, "unapprovedInvestor");
  });

  test("offer no way to upload a picture", async ({ page }) => {
    await page.goto("/kyc");

    await expect(photoTile(page)).toBeVisible();
    await expectNoUpload(page);
    await expect(page.getByText(t("kyc.gv.liveOnlyNote"))).toBeVisible();
  });

  test("are taken with the camera, and can be retaken or removed", async ({
    page,
  }) => {
    await page.goto("/kyc");

    await photoTile(page).click();
    await page
      .getByRole("button", { name: t("kyc.gv.captureBtn"), exact: true })
      .click();

    await page.getByRole("tab", { name: t("kyc.gv.tabFront") }).click();
    await expect(page.getByText(t("kyc.gv.photoTaken"))).toBeVisible();

    await page.getByRole("button", { name: /^(Remove|Xoá)$/ }).click();
    await expect(photoTile(page)).toBeVisible();
    await expect(page.getByText(t("kyc.gv.photoTaken"))).toHaveCount(0);
  });

  test("can all be taken and submitted directly on mobile", async ({
    page,
    context,
  }) => {
    await signInAs(context, "unapprovedInvestorMobile");
    await page.goto("/kyc");

    await takeIdentityPhotos(page);
    await expect(page.getByText(t("kyc.gv.photoTaken"))).toBeVisible();

    await page
      .getByRole("button", { name: t("kyc.gv.submitBtn"), exact: true })
      .click();
    await expect(page.getByText(t("kyc.approvedTitle"))).toBeVisible();
  });
});

test.describe("the identity photos on the phone page", () => {
  test("offer no way to upload a picture either", async ({ page }) => {
    // Opened by the QR code: no login, just the short-lived token.
    await page.goto("/kyc/mobile?token=e2e-token");

    await expect(photoTile(page)).toBeVisible();
    await expectNoUpload(page);
    await expect(page.getByText(t("kyc.gv.liveOnlyNote"))).toBeVisible();
  });

  test("are taken with the camera", async ({ page }) => {
    await page.goto("/kyc/mobile?token=e2e-token");

    await takeIdentityPhotos(page);
    await expect(page.getByText(t("kyc.gv.photoTaken"))).toBeVisible();
    await expect(
      page.getByRole("button", { name: t("kyc.gv.submitBtn"), exact: true }),
    ).toBeEnabled();
  });
});
