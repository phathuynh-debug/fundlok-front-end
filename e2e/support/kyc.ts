import { expect, type Page } from "@playwright/test";

import { t } from "./i18n";

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Take the three identity photos (ID front, ID back, selfie) with the camera.
 *
 * The app has no upload: each photo is taken in the in-app camera, so this opens
 * it from the active tile and presses the shutter, three times. The tabs move on
 * to the next empty photo by themselves, so the tile it looks for is always the
 * next one still to take. Works on the desktop screen and on the phone page.
 */
export async function takeIdentityPhotos(page: Page) {
  for (let taken = 0; taken < 3; taken++) {
    await page
      .getByRole("button", { name: new RegExp(escape(t("kyc.gv.clickToAdd"))) })
      .click();
    // Exact: a tile's own name ends in "tap to take a photo", which contains
    // the shutter's label as a substring in Vietnamese.
    const shutter = page.getByRole("button", {
      name: t("kyc.gv.captureBtn"),
      exact: true,
    });
    await shutter.click();
    await expect(shutter).toBeHidden();
  }
}
