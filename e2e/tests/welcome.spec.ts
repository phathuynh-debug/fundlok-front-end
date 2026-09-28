import { test, expect, type Page } from "@playwright/test";

import { signInAs } from "../support/auth";
import { t } from "../support/i18n";
import { finishWelcome } from "../support/welcome";

// The first-run welcome cutscreen: a full-screen, slide-by-slide explanation
// of how FundLok works, shown before the dashboard tour. Its job is to make
// sure every new user understands fixed daily repayment — so the load-bearing
// checks are that it cannot be skipped on a first run, that the SME sequence
// says what the repayment rules actually are, and that each role gets only
// its own sequence.

const firstRun =
  (user: "smeNoProject" | "investor") =>
  async ({ context }: { context: import("@playwright/test").BrowserContext }) =>
    signInAs(context, user, { skipTour: false });

function cutscreen(page: Page) {
  // The only dialog with a "Get started"/arrow control bar; the tour's card
  // is a different dialog and never shows at the same time.
  return page.getByRole("dialog");
}

async function next(page: Page) {
  await page
    .getByRole("button", { name: t("welcome.common.next"), exact: true })
    .click();
}

test.describe("an SME arriving for the first time", () => {
  test.beforeEach(firstRun("smeNoProject"));

  test("is welcomed full screen, in Vietnamese by default", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    const welcome = cutscreen(page);
    await expect(welcome).toBeVisible();
    await expect(welcome).toContainText(t("welcome.common.hello.title"));
    await expect(
      welcome.getByRole("button", { name: "Tiếng Việt" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("can switch the whole walkthrough to English", async ({ page }) => {
    await page.goto("/dashboard");

    await cutscreen(page).getByRole("button", { name: "English" }).click();
    await expect(cutscreen(page)).toContainText(
      t("welcome.common.hello.title", undefined, "en"),
    );
  });

  test("cannot be skipped or closed on a first run", async ({ page }) => {
    await page.goto("/dashboard");
    const welcome = cutscreen(page);
    await expect(welcome).toBeVisible();

    await expect(
      welcome.getByRole("button", { name: t("welcome.common.close") }),
    ).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(welcome).toBeVisible();

    // Dots ahead of the furthest slide reached are not a way round it.
    await expect(
      welcome.getByRole("button", {
        name: t("welcome.common.goToSlide", { n: 4 }),
      }),
    ).toBeDisabled();
  });

  test("moves with the arrow keys", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(cutscreen(page)).toBeVisible();

    await page.keyboard.press("ArrowRight");
    await expect(cutscreen(page)).toContainText(t("welcome.sme.intro.title"));
    await page.keyboard.press("ArrowLeft");
    await expect(cutscreen(page)).toContainText(
      t("welcome.common.hello.title"),
    );
  });

  test("explains daily repayment with the worked example", async ({ page }) => {
    // 100,000,000 at 15%/yr over 3 months: 103,750,000 over 63 business days.
    await page.goto("/dashboard");
    await page
      .getByRole("button", { name: t("welcome.common.getStarted") })
      .click();
    await next(page); // assessment
    await next(page); // daily

    const welcome = cutscreen(page);
    await expect(welcome).toContainText(t("welcome.sme.daily.title"));
    await expect(welcome).toContainText("1.646.825");
    await expect(welcome).toContainText("103.750.000");
  });

  test("says the total rises on extension and a shortfall without one is a missed payment", async ({
    page,
  }) => {
    // fundlok-domain: when the term stretches, the total goes up — never say
    // it is unchanged. And the 27 Sep rule: paying less with no agreed
    // extension is a missed instalment.
    await page.goto("/dashboard");
    await page
      .getByRole("button", { name: t("welcome.common.getStarted") })
      .click();
    for (let slide = 0; slide < 4; slide += 1) await next(page);

    await expect(cutscreen(page)).toContainText(
      t("welcome.sme.extension.body"),
    );
    await next(page);
    await expect(cutscreen(page)).toContainText(t("welcome.sme.rules.items.2"));
  });

  test("hands over to the dashboard tour when finished", async ({ page }) => {
    await page.goto("/dashboard");
    await finishWelcome(page, "SME");

    await expect(page.getByRole("dialog")).toContainText(
      t("dashboard.tour.steps.smeOverview.title"),
    );
  });

  test("never shows the investor sequence", async ({ page }) => {
    await page.goto("/dashboard");
    await page
      .getByRole("button", { name: t("welcome.common.getStarted") })
      .click();

    await expect(cutscreen(page)).toContainText(t("welcome.sme.intro.title"));
    await expect(cutscreen(page)).not.toContainText(
      t("welcome.investor.disclosure.title"),
    );
  });
});

test.describe("an investor arriving for the first time", () => {
  test.beforeEach(firstRun("investor"));

  test("is shown what every listing discloses, including who bears the loss", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page
      .getByRole("button", { name: t("welcome.common.getStarted") })
      .click();

    const welcome = cutscreen(page);
    await expect(welcome).toContainText(t("welcome.investor.disclosure.title"));
    await expect(welcome).toContainText(t("welcome.visuals.discloseLoss"));
  });

  test("is told returns are targets, not guarantees", async ({ page }) => {
    await page.goto("/dashboard");
    await page
      .getByRole("button", { name: t("welcome.common.getStarted") })
      .click();
    for (let slide = 0; slide < 3; slide += 1) await next(page);

    await expect(cutscreen(page)).toContainText(
      t("welcome.investor.dailyBenefit.items.4"),
    );
  });

  test("never shows the SME sequence", async ({ page }) => {
    await page.goto("/dashboard");
    await finishWelcome(page, "INVESTOR");
    // Five presses reached the end without passing any SME slide; the tour
    // that follows is the investor one.
    await expect(page.getByRole("dialog")).toContainText(
      t("dashboard.tour.steps.investorOverview.title"),
    );
  });
});

test.describe("on a phone", () => {
  test.beforeEach(firstRun("investor"));

  test("records the first run once finished, though there is no tour to follow", async ({
    page,
  }) => {
    // Every investor tour step points at the sidebar, which a phone does not
    // show. Without recording completion here the cutscreen would return on
    // every visit.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");

    const persisted = page.waitForRequest(
      (request) =>
        request.url().includes("/users/me/onboarding-tour/complete") &&
        request.method() === "POST",
    );
    await finishWelcome(page, "INVESTOR");
    await persisted;
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});

test.describe("an account that has already been onboarded", () => {
  test.beforeEach(async ({ context }) => {
    await signInAs(context, "investor");
  });

  test("does not see the cutscreen again", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: t("dashboard.investor.title") }),
    ).toBeVisible();
    await page.waitForTimeout(1000);

    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("can replay it, and close a replay at any point", async ({ page }) => {
    await page.goto("/dashboard");
    await page
      .getByRole("button", { name: t("welcome.common.replay") })
      .click();

    const welcome = cutscreen(page);
    await expect(welcome).toContainText(t("welcome.common.hello.title"));
    await welcome
      .getByRole("button", { name: t("welcome.common.close") })
      .click();
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});
