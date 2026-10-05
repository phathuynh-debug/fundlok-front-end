import { test, expect } from "@playwright/test";

import { t } from "../support/i18n";
import { settle } from "../support/ui";

// The pages a visitor sees before signing in. These are deliberately OUTSIDE
// the proxy matcher (so maintenance never blocks them), which means nothing
// else in the suite touches them.

const PUBLIC_ROUTES = [
  { path: "/", name: "landing" },
  { path: "/faq", name: "FAQ", titleKey: "faqPage.title" },
  { path: "/why-us", name: "why us", titleKey: "specialPage.title" },
  { path: "/contact", name: "contact", titleKey: "contactPage.title" },
  { path: "/terms", name: "terms", titleKey: "termsPage.title" },
  { path: "/login", name: "login" },
  // Sign-up is a mode of the login page, not its own route — /register was
  // removed and 308s here.
  { path: "/login?mode=register", name: "register" },
  {
    path: "/forgot-password",
    name: "forgot password",
    titleKey: "auth.forgotPassword.title",
  },
];

for (const route of PUBLIC_ROUTES) {
  test(`${route.name} loads for a visitor with no session`, async ({
    page,
  }) => {
    const response = await page.goto(route.path);
    expect(response?.status(), `${route.path} should not error`).toBeLessThan(
      400,
    );
    // Escape every regex metacharacter, not just the leading slash: one route
    // carries a query string, and a bare `?` would silently turn the preceding
    // character optional instead of matching.
    await expect(page).toHaveURL(
      new RegExp(`${route.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
    );

    if (route.titleKey) {
      await expect(page.getByText(t(route.titleKey)).first()).toBeVisible();
    }
  });

  test(`${route.name} logs no console errors`, async ({ page }) => {
    // Catches hydration mismatches and missing-provider crashes, which render
    // a perfectly normal-looking page while breaking interactivity.
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto(route.path);
    await settle(page);

    expect(errors, `console errors on ${route.path}`).toEqual([]);
  });
}

test("the landing page links to sign in", async ({ page }) => {
  await page.goto("/");
  // The footer link is translated, so match the current locale's label too.
  const loginLink = page
    .getByRole("link", {
      name: new RegExp(`${t("footer.logIn")}|sign in|log in`, "i"),
    })
    .first();
  await expect(loginLink).toBeVisible();
});

test("registration asks for the fields the backend requires", async ({
  page,
}) => {
  await page.goto("/login?mode=register");

  for (const key of [
    "auth.register.fullNameLabel",
    "auth.register.emailLabel",
    "auth.register.passwordLabel",
    "auth.register.confirmPasswordLabel",
  ]) {
    await expect(page.getByText(t(key), { exact: true })).toBeVisible();
  }
});

test("registration rejects mismatched passwords client-side", async ({
  page,
}) => {
  await page.goto("/login?mode=register");

  await page.getByLabel(t("auth.register.fullNameLabel")).fill("E2E Person");
  await page.getByLabel(t("auth.register.emailLabel")).fill("new@e2e.test");
  await page
    .getByLabel(t("auth.register.passwordLabel"), { exact: true })
    .fill("a-good-password");
  await page
    .getByLabel(t("auth.register.confirmPasswordLabel"))
    .fill("a-different-password");

  await page.getByRole("button", { name: t("auth.register.submit") }).click();

  await expect(
    page.getByText(t("auth.register.passwordMismatch")).first(),
  ).toBeVisible();
});

test("/maintenance sends visitors home while maintenance is off", async ({
  page,
}) => {
  // The flag is global and cached for 5s server-side, so the suite does not
  // toggle it — a test that did would put every parallel worker into
  // maintenance mode. This covers the "don't strand anyone" branch instead.
  await page.goto("/maintenance");
  await expect(page).toHaveURL(/127\.0\.0\.1:\d+\/$/);
});

test("an unknown URL renders the not-found page, not a crash", async ({
  page,
}) => {
  await page.goto("/this-route-does-not-exist");
  await expect(page.getByText(t("notFound.pageTitle")).first()).toBeVisible();
});
