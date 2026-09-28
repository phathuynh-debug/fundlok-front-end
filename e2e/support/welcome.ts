import { expect, type Page } from "@playwright/test";

import { welcomeSlidesForRole } from "../../lib/constants/welcome-slides";
import { t } from "./i18n";

/**
 * Step through the first-run welcome cutscreen to its last slide and press
 * its call to action, the way a first-time user must: there is no skip.
 *
 * Specs that exercise what comes AFTER the cutscreen (the dashboard tour) use
 * this; specs for the cutscreen itself drive it directly.
 */
export async function finishWelcome(
  page: Page,
  role: "SME" | "INVESTOR",
): Promise<void> {
  const slides = welcomeSlidesForRole(role);

  await page
    .getByRole("button", { name: t("welcome.common.getStarted"), exact: true })
    .click();

  const next = page.getByRole("button", {
    name: t("welcome.common.next"),
    exact: true,
  });
  // The first press was "Get started"; the last is the call to action.
  for (let slide = 1; slide < slides.length - 1; slide += 1) {
    await next.click();
  }

  const cta = page.getByRole("button", {
    name: t("welcome.common.ready.cta"),
    exact: true,
  });
  await expect(cta).toBeVisible();
  await cta.click();
}
