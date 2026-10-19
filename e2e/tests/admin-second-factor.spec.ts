import { test, expect, type Page } from "@playwright/test";

import { signInAs } from "../support/auth";
import { t } from "../support/i18n";
import { settle } from "../support/ui";

/**
 * An admin signed in with a password only (audit finding SEC-01).
 *
 * The backend refuses nearly every call from such a session with 403 and
 * `X-Error-Code: MFA_REQUIRED`; the stub mirrors that for `adminNoSecondFactor`.
 * What only a browser can prove is the frontend's answer: the admin lands on
 * their security page with a notice, the page does not reload itself, and
 * enrolling a factor asks them to sign in again.
 */

// Serial: the enrolment test switches 2FA on for this account in the stub, and
// the other tests need it off.
test.describe.configure({ mode: "serial" });

const USER = "adminNoSecondFactor" as const;
const CODE = "123456";

const resetTwoFactor = async (page: Page) => {
  const response = await page.request.post("/api/_test/2fa/reset", {
    data: { user: USER },
  });
  expect(response.ok(), "stub reset failed").toBe(true);
};

const notice = (page: Page) =>
  page
    .getByRole("alert")
    .filter({ hasText: t("security.secondFactorRequired.title") });

test.beforeEach(async ({ context, page }) => {
  await signInAs(context, USER);
  await resetTwoFactor(page);
});

test.afterAll(async ({ request }) => {
  await request.post("/api/_test/2fa/reset", { data: { user: USER } });
});

test("an admin page sends them to set up a second factor", async ({ page }) => {
  await page.goto("/admin/users");

  await expect(page).toHaveURL(/\/admin\/security$/);
  await expect(notice(page)).toContainText(
    t("security.secondFactorRequired.setupBody"),
  );
});

test("the security page does not reload itself", async ({ page }) => {
  await page.goto("/admin/security");
  await settle(page);
  await expect(notice(page)).toBeVisible();

  // A full navigation would wipe this. The page's own calls are refused too,
  // and sending it to itself would reload it forever.
  await page.evaluate(() => {
    (window as unknown as { __stillHere: boolean }).__stillHere = true;
  });
  await page.waitForTimeout(1000);
  expect(
    await page.evaluate(
      () => (window as unknown as { __stillHere?: boolean }).__stillHere,
    ),
  ).toBe(true);
});

test("enrolling an authenticator app asks them to sign in again", async ({
  page,
}) => {
  await page.goto("/admin/security");
  await settle(page);

  await page
    .getByRole("listitem")
    .filter({ hasText: t("dashboard.security.protections.items.totp") })
    .getByRole("button", {
      name: t("dashboard.security.protections.action.turnOn"),
    })
    .click();

  const dialog = page.getByRole("dialog", {
    name: t("security.twoFactor.title"),
  });
  await dialog
    .getByRole("button", { name: t("security.twoFactor.next") })
    .click();
  await dialog.getByLabel(t("security.twoFactor.codeLabel")).fill(CODE);
  await dialog
    .getByRole("button", { name: t("security.twoFactor.verifyAndEnable") })
    .click();
  await dialog
    .getByRole("button", { name: t("security.twoFactor.savedThem") })
    .click();

  // Enrolling does not upgrade the session: the notice now says to sign in
  // again with the new factor, and offers to.
  await expect(notice(page)).toContainText(
    t("security.secondFactorRequired.signInAgainBody"),
  );
  await notice(page)
    .getByRole("button", {
      name: t("security.secondFactorRequired.signInAgain"),
    })
    .click();
  await expect(page).toHaveURL(/\/login/);
});
