import { test, expect } from "@playwright/test";

import { signInAs } from "../support/auth";
import { t } from "../support/i18n";

// The first-run walkthrough. Unlike every other spec these sign in WITHOUT
// suppressing the tour, because the tour is the thing under test.
//
// The load-bearing assertions are the two role ones: an SME and an investor do
// not use the same product, and showing one the other's guidance would breach
// least-privilege by role (fundlok-domain §9) as surely as showing them the
// other's data.

const firstRun =
  (user: "sme" | "smeNoProject" | "investor") =>
  async ({ context }: { context: import("@playwright/test").BrowserContext }) =>
    signInAs(context, user, { skipTour: false });

test.describe("an SME arriving for the first time", () => {
  test.beforeEach(firstRun("smeNoProject"));

  test("is walked through its own dashboard, starting at the overview", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    const tour = page.getByRole("dialog");
    await expect(tour).toBeVisible();
    await expect(tour).toContainText(
      t("dashboard.tour.steps.smeOverview.title"),
    );
    await expect(tour).toContainText(
      t("dashboard.tour.progress", { current: 1, total: 5 }),
    );
  });

  test("is pointed at applying, and told that applying is not approval", async ({
    page,
  }) => {
    // Handbook §5 forbids saying approval is certain. The step that invites an
    // SME to apply is exactly where that promise would creep in.
    await page.goto("/dashboard");

    const tour = page.getByRole("dialog");
    await tour.getByRole("button", { name: t("dashboard.tour.next") }).click();

    await expect(tour).toContainText(t("dashboard.tour.steps.smeApply.title"));
    await expect(tour).toContainText(t("dashboard.tour.steps.smeApply.body"));
  });

  test("never shows the investor walkthrough", async ({ page }) => {
    await page.goto("/dashboard");

    const tour = page.getByRole("dialog");
    await expect(tour).toBeVisible();
    await expect(tour).not.toContainText(
      t("dashboard.tour.steps.investorProjects.title"),
    );
  });
});

test.describe("an investor arriving for the first time", () => {
  test.beforeEach(firstRun("investor"));

  test("is told what a listing discloses, and who bears the loss", async ({
    page,
  }) => {
    // §3: score, verified revenue, fees and the backstop date. §1: the
    // investor bears the loss. Both belong in the first thing they read.
    await page.goto("/dashboard");

    const tour = page.getByRole("dialog");
    await expect(tour).toContainText(
      t("dashboard.tour.steps.investorOverview.body"),
    );

    await tour.getByRole("button", { name: t("dashboard.tour.next") }).click();
    await expect(tour).toContainText(
      t("dashboard.tour.steps.investorProjects.body"),
    );
  });

  test("never shows the SME walkthrough", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByRole("dialog")).not.toContainText(
      t("dashboard.tour.steps.smeApply.title"),
    );
  });
});

test.describe("an account that has already been onboarded", () => {
  // signInAs marks the stub account as onboarded by default, which is what the
  // real backend reports through users.onboarding_tour_completed_at. This is
  // the cross-device case: onboarded on a laptop, signing in on a phone.
  test.beforeEach(async ({ context }) => {
    await signInAs(context, "investor");
  });

  test("is not walked through the product a second time", async ({ page }) => {
    await page.goto("/dashboard");

    // Wait past the window in which the tour resolves its targets, so this is
    // "it never opened" rather than "we looked too early".
    await expect(
      page.getByRole("heading", { name: t("dashboard.investor.title") }),
    ).toBeVisible();
    await page.waitForTimeout(1500);

    await expect(page.getByRole("dialog")).toBeHidden();
  });
});

test.describe("dismissing it", () => {
  test.beforeEach(firstRun("investor"));

  test("records the dismissal against the account, not the browser", async ({
    page,
  }) => {
    // The point of moving this server-side: onboarding belongs to the person,
    // so skipping has to reach the account rather than only this device's
    // storage. Asserting on the request is what proves that actually happens.
    await page.goto("/dashboard");

    const tour = page.getByRole("dialog");
    await expect(tour).toBeVisible();

    const persisted = page.waitForRequest(
      (request) =>
        request.url().includes("/users/me/onboarding-tour/complete") &&
        request.method() === "POST",
    );
    await tour.getByRole("button", { name: t("dashboard.tour.skip") }).click();

    await persisted;
    await expect(tour).toBeHidden();
  });

  test("closes on Escape, like every other overlay", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("can be stepped all the way to the end", async ({ page }) => {
    await page.goto("/dashboard");

    const tour = page.getByRole("dialog");
    const next = tour.getByRole("button", { name: t("dashboard.tour.next") });

    // Five steps: four Next presses, then the final button says "Got it".
    for (let i = 0; i < 4; i += 1) {
      await next.click();
    }
    await expect(tour).toContainText(
      t("dashboard.tour.progress", { current: 5, total: 5 }),
    );
    await tour.getByRole("button", { name: t("dashboard.tour.done") }).click();
    await expect(tour).toBeHidden();
  });
});
