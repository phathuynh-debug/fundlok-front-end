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

test.describe("the identity photos on the desktop screen", () => {
  test.beforeEach(async ({ context }) => {
    await signInAs(context, "unapprovedInvestor");
  });

  test("offer no way to upload a picture", async ({ page }) => {
    await page.goto("/kyc");

    await expect(photoTile(page)).toBeVisible();
    await expectNoUpload(page);
    // And it says so, rather than leaving a person to look for the button.
    await expect(page.getByText(t("kyc.gv.liveOnlyNote"))).toBeVisible();
  });

  test("are taken with the camera, and nothing else is on offer inside it", async ({
    page,
  }) => {
    await page.goto("/kyc");

    await photoTile(page).click();
    const camera = page.getByRole("dialog", { name: t("kyc.gv.frontLabel") });
    await expect(camera).toBeVisible();
    await expect(
      camera.getByRole("button", { name: t("kyc.gv.captureBtn"), exact: true }),
    ).toBeVisible();
    // The old escape hatch inside the camera is gone, and so is any file input.
    await expect(
      camera.getByRole("button", { name: /library|thư viện/i }),
    ).toHaveCount(0);
    await expectNoUpload(page);
  });

  test("take over the whole screen while the camera is open", async ({
    page,
  }) => {
    await page.goto("/kyc");

    await photoTile(page).click();
    const camera = page.getByRole("dialog", { name: t("kyc.gv.frontLabel") });
    await expect(camera).toBeVisible();

    // Nothing of the page shows around it. A margin inherited from the field
    // once shrank it by 8px and left a strip of the page under the shutter.
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    expect(await camera.boundingBox()).toEqual({
      x: 0,
      y: 0,
      width: viewport!.width,
      height: viewport!.height,
    });
  });

  test("can all be taken and submitted", async ({ page, context }) => {
    // Its own account: submitting verifies it, and the stub remembers that.
    await signInAs(context, "unapprovedInvestorCamera");
    await page.goto("/kyc");

    await takeIdentityPhotos(page);
    // Each one shows as taken, and the tabs say they are all done.
    await expect(page.getByText(t("kyc.gv.photoTaken"))).toBeVisible();

    await page
      .getByRole("button", { name: t("kyc.gv.submitBtn"), exact: true })
      .click();
    await expect(page.getByText(t("kyc.approvedTitle"))).toBeVisible();
  });

  test("can be retaken or removed", async ({ page }) => {
    await page.goto("/kyc");

    await photoTile(page).click();
    await page
      .getByRole("button", { name: t("kyc.gv.captureBtn"), exact: true })
      .click();
    // The tabs moved on to the next photo; go back to the one just taken.
    await page.getByRole("tab", { name: t("kyc.gv.tabFront") }).click();
    await expect(page.getByText(t("kyc.gv.photoTaken"))).toBeVisible();

    await page.getByRole("button", { name: /^(Remove|Xoá)$/ }).click();
    await expect(photoTile(page)).toBeVisible();
    await expect(page.getByText(t("kyc.gv.photoTaken"))).toHaveCount(0);
  });

  test("say why when camera access is blocked, and offer no upload instead", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = () =>
        Promise.reject(new DOMException("blocked", "NotAllowedError"));
    });
    await page.goto("/kyc");

    await photoTile(page).click();

    await expect(
      page.getByRole("alert").filter({ hasText: t("kyc.gv.cameraDenied") }),
    ).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expectNoUpload(page);
    // The phone is the way on, and it is still offered.
    await expect(
      page.getByRole("button", { name: t("kyc.gv.phoneBtn") }),
    ).toBeVisible();
  });

  test("say so when the page cannot use a camera at all", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "mediaDevices", {
        value: undefined,
        configurable: true,
      });
    });
    await page.goto("/kyc");

    await photoTile(page).click();

    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: t("kyc.gv.cameraUnsupported") }),
    ).toBeVisible();
    await expectNoUpload(page);
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
