import { test, expect } from "@playwright/test";

import { signInAs } from "../support/auth";
import { t } from "../support/i18n";

// The "what is this form?" guide inside the SME document-submission wizard.
//
// Distinct from product-tour.spec.ts: that one covers orientation, which opens
// itself once per account. This one never opens on its own — it is a reference
// an applicant reaches for mid-form, so the assertions are about it staying
// out of the way until asked, and about the two things the handbook requires
// it to say when it does appear.

test.beforeEach(async ({ context }) => {
  await signInAs(context, "smeDraftApplication");
});

test("stays closed until the applicant asks for it", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(
    page.getByRole("button", { name: t("dashboard.documentGuide.open") }),
  ).toBeVisible();
  // Interrupting someone part-way through uploading would be worse than
  // staying quiet, so it must not open itself.
  await page.waitForTimeout(1500);
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("opens on the button and starts at the first stage", async ({ page }) => {
  await page.goto("/dashboard");
  await page
    .getByRole("button", { name: t("dashboard.documentGuide.open") })
    .click();

  const guide = page.getByRole("dialog");
  await expect(guide).toBeVisible();
  await expect(guide).toContainText(
    t("dashboard.documentGuide.steps.stages.title"),
  );
});

test("says the e-invoice original is required, not a PDF of it", async ({
  page,
}) => {
  // Handbook §2: revenue evidence is the signed electronic original only, and
  // the UI must say WHY a PDF or screenshot is refused. uploads.service.ts
  // enforces it (e_invoice_data accepts zip/xml); this is where an applicant
  // finds out before they try.
  await page.goto("/dashboard");
  await page
    .getByRole("button", { name: t("dashboard.documentGuide.open") })
    .click();

  const guide = page.getByRole("dialog");
  await guide.getByRole("button", { name: t("dashboard.tour.next") }).click();

  await expect(guide).toContainText(
    t("dashboard.documentGuide.steps.documents.body"),
  );
});

test("says sending is not approval, and names the backstop", async ({
  page,
}) => {
  // §5 forbids implying approval is certain; §2 requires the SME to know the
  // backstop date. The last stage of the guide carries both.
  await page.goto("/dashboard");
  await page
    .getByRole("button", { name: t("dashboard.documentGuide.open") })
    .click();

  const guide = page.getByRole("dialog");
  const next = guide.getByRole("button", { name: t("dashboard.tour.next") });
  for (let i = 0; i < 3; i += 1) await next.click();

  await expect(guide).toContainText(
    t("dashboard.documentGuide.steps.actions.body"),
  );
  await guide.getByRole("button", { name: t("dashboard.tour.done") }).click();
  await expect(guide).toBeHidden();
});

test("closes on Escape without disturbing the form", async ({ page }) => {
  await page.goto("/dashboard");
  await page
    .getByRole("button", { name: t("dashboard.documentGuide.open") })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  // The wizard is still there and still on stage one.
  await expect(
    page.getByRole("heading", {
      name: t("dashboard.sme.submitLoanApplication"),
    }),
  ).toBeVisible();
});
