import { test, expect } from "@playwright/test";

import { useLocale } from "../support/auth";
import { t } from "../support/i18n";

// Public pages have one URL per language (lib/locale-routing.ts). These pin the
// behaviour search engines rely on: each URL always renders its own language,
// and names the other with hreflang.

test("an /en URL renders English with no cookie at all", async ({ page }) => {
  await page.goto("/en/faq");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page).toHaveTitle(
    t("seo.faqTitle", undefined, "en") + " | FundLok",
  );
});

test("the unprefixed URL renders Vietnamese with no cookie", async ({
  page,
}) => {
  await page.goto("/faq");
  await expect(page.locator("html")).toHaveAttribute("lang", "vi");
});

test("each language version names the other with hreflang", async ({
  page,
}) => {
  await page.goto("/en/rate");
  const href = (lang: string) =>
    page
      .locator(`link[rel="alternate"][hreflang="${lang}"]`)
      .getAttribute("href");
  expect(await href("vi")).toMatch(/\/rate$/);
  expect(await href("en")).toMatch(/\/en\/rate$/);
  expect(await href("x-default")).toMatch(/\/rate$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/en\/rate$/,
  );
});

test("links on an English page stay in English", async ({ page }) => {
  await page.goto("/en/faq");
  await expect(
    page
      .locator("header")
      .getByRole("link", { name: t("header.rate", undefined, "en") }),
  ).toHaveAttribute("href", "/en/rate");
});

test("the switcher moves to the other language's URL, keeping the query", async ({
  page,
}) => {
  await page.goto("/rate?for=investor");
  await page.getByRole("button", { name: t("localeSwitcher.english") }).click();
  await expect(page).toHaveURL(/\/en\/rate\?for=investor$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  // Server-rendered parts follow too, not only the client text.
  await expect(page).toHaveTitle(
    t("seo.rateTitle", undefined, "en") + " | FundLok",
  );
});

test("an explicit earlier choice sends the visitor to their language", async ({
  page,
  context,
}) => {
  await useLocale(context, "en");
  await page.goto("/contact");
  await expect(page).toHaveURL(/\/en\/contact$/);
});

test("pages with no English URL drop the prefix", async ({ page }) => {
  const response = await page.request.get("/en/dashboard", { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers()["location"]).toMatch(/\/dashboard$/);
});
