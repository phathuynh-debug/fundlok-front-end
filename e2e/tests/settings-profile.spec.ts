import { test, expect, type Page } from "@playwright/test";

import { STUB_USERS } from "../stub-api/fixtures";
import { signInAs, withoutBankAccounts } from "../support/auth";
import { t } from "../support/i18n";
import { toast } from "../support/ui";

// /dashboard/settings/profile — the only settings route that exists. The
// sidebar also links to /account, /appearance and /billing, which do not; the
// last test here pins that gap so it is visible rather than discovered by a
// user hitting a 404.

const fullNameField = (page: Page) =>
  page.getByLabel(t("dashboard.settings.profile.fullName"), { exact: true });
const emailField = (page: Page) =>
  page.getByLabel(t("dashboard.settings.profile.emailAddress"), {
    exact: true,
  });

test.beforeEach(async ({ context, page }) => {
  await signInAs(context, "investor");
  await page.goto("/dashboard/settings/profile");
});

test("shows the signed-in user's details", async ({ page }) => {
  await expect(
    page.getByRole("heading", {
      name: t("dashboard.settings.profile.title"),
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(t("dashboard.settings.profile.accountDetails")),
  ).toBeVisible();

  await expect(fullNameField(page)).toHaveValue(STUB_USERS.investor.full_name);
  await expect(emailField(page)).toHaveValue(STUB_USERS.investor.email);
});

test("fields are read-only until the user chooses to edit", async ({
  page,
}) => {
  // The fields are `readOnly` rather than `disabled` outside edit mode, so
  // toBeEditable is the matcher that actually distinguishes the two states —
  // toBeDisabled passes for neither.
  await expect(fullNameField(page)).not.toBeEditable();

  await page
    .getByRole("button", { name: t("dashboard.settings.profile.editProfile") })
    .click();

  await expect(fullNameField(page)).toBeEditable();
});

test("the email address stays locked even in edit mode", async ({ page }) => {
  // Changing an email is an identity change and needs re-verification, so it
  // must not be editable from this form.
  await page
    .getByRole("button", { name: t("dashboard.settings.profile.editProfile") })
    .click();

  await expect(emailField(page)).not.toBeEditable();
});

test("the save button is disabled until changes are made", async ({ page }) => {
  await page
    .getByRole("button", { name: t("dashboard.settings.profile.editProfile") })
    .click();

  const saveBtn = page.getByRole("button", {
    name: t("dashboard.settings.profile.save"),
  });
  await expect(saveBtn).toBeDisabled();

  await fullNameField(page).fill("Renamed In E2E");
  await expect(saveBtn).toBeEnabled();
});

test("saving a new name confirms the change", async ({ page }) => {
  await page
    .getByRole("button", { name: t("dashboard.settings.profile.editProfile") })
    .click();

  await fullNameField(page).fill("Renamed In E2E");
  await page
    .getByRole("button", { name: t("dashboard.settings.profile.save") })
    .click();

  await expect(
    toast(page, t("dashboard.settings.profile.updatedTitle")),
  ).toBeVisible();
});

test("cancelling an edit discards it", async ({ page }) => {
  await page
    .getByRole("button", { name: t("dashboard.settings.profile.editProfile") })
    .click();
  await fullNameField(page).fill("Should Not Persist");
  await page
    .getByRole("button", { name: t("dashboard.settings.profile.cancel") })
    .click();

  await expect(fullNameField(page)).toHaveValue(STUB_USERS.investor.full_name);
});

test("an empty name is rejected", async ({ page }) => {
  await page
    .getByRole("button", { name: t("dashboard.settings.profile.editProfile") })
    .click();
  await fullNameField(page).fill("");
  await page
    .getByRole("button", { name: t("dashboard.settings.profile.save") })
    .click();

  await expect(
    page.getByText(t("dashboard.settings.profile.fullNameRequired")).first(),
  ).toBeVisible();
});

// ── Bank account (HANDOFF-04 Epic 0) ────────────────────────────────────────
// The fixture is a real static VietQR to Techcombank 19036789012, decoded in
// the browser by jsQR; the stub reads the account out of the decoded text.

const BANK = "dashboard.settings.profile.bankAccount";

test("an investor adds a bank account from their bank app's QR", async ({
  page,
  context,
}) => {
  await withoutBankAccounts(context);
  await page.reload();
  await expect(page.getByText(t(`${BANK}.empty`))).toBeVisible();
  await page.getByRole("button", { name: t(`${BANK}.add`) }).click();

  const dialog = page.getByRole("dialog");
  await dialog
    .getByTestId("bank-qr-input")
    .setInputFiles("e2e/fixtures/vietqr-techcombank.png");

  await expect(dialog.getByText(t(`${BANK}.form.scanFilled`))).toBeVisible();
  await expect(dialog.getByRole("combobox")).toHaveText(/Techcombank/);
  await expect(
    dialog.getByLabel(t(`${BANK}.form.accountNumber`), { exact: true }),
  ).toHaveValue("19036789012");

  await dialog
    .getByLabel(t(`${BANK}.form.accountName`), { exact: true })
    .fill("INVESTOR TEST");
  await dialog.getByRole("button", { name: t(`${BANK}.form.save`) }).click();

  await expect(toast(page, t(`${BANK}.form.savedTitle`))).toBeVisible();
  // Waiting for an admin to approve it.
  await expect(
    page.getByText(t(`${BANK}.status.PENDING`), { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("19036789012")).toBeVisible();
});

test("an image without a QR is explained, not uploaded", async ({ page }) => {
  await page.getByRole("button", { name: t(`${BANK}.add`) }).click();
  const dialog = page.getByRole("dialog");
  // A 1×1 PNG: decodes as an image, contains no QR.
  await dialog.getByTestId("bank-qr-input").setInputFiles({
    name: "blank.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=",
      "base64",
    ),
  });

  await expect(dialog.getByRole("alert")).toHaveText(
    t(`${BANK}.form.scanNoQr`),
  );
});
