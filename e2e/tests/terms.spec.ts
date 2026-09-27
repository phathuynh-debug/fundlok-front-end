import { test, expect } from "@playwright/test";
import { t } from "../support/i18n";
import { settle } from "../support/ui";

test.describe("Terms of Service page and links", () => {
  test("renders terms page with header, compliance notice, and table of contents", async ({
    page,
  }) => {
    const response = await page.goto("/terms");
    expect(response?.status()).toBeLessThan(400);

    // Assert main heading and compliance notice
    await expect(
      page.getByRole("heading", { name: t("termsPage.title") }),
    ).toBeVisible();
    await expect(page.getByText(t("termsPage.noticeTitle"))).toBeVisible();
    await expect(page.getByText(t("termsPage.tableOfContents"))).toBeVisible();

    // Assert section articles exist
    await expect(page.locator("#part-a")).toBeVisible();
    await expect(page.locator("#part-b")).toBeVisible();
    await expect(page.locator("#part-c")).toBeVisible();
  });

  test("filters clauses dynamically using search input", async ({ page }) => {
    await page.goto("/terms");
    await settle(page);

    const searchInput = page.getByPlaceholder(t("termsPage.searchPlaceholder"));
    await expect(searchInput).toBeVisible();

    // Type a query that matches specific terms
    await searchInput.fill("custodial");
    await expect(page.locator("#part-a")).toBeVisible();

    // Type a query that matches nothing
    await searchInput.fill("thiskeyworddoesnotexistanywhere123");
    await expect(page.getByText(t("termsPage.noResults"))).toBeVisible();
  });

  test("login page links to terms of service", async ({ page }) => {
    await page.goto("/login");
    await settle(page);

    // Footer link
    const termsLink = page.getByRole("link", {
      name: t("auth.footer.termsLink"),
    });
    await expect(termsLink.first()).toBeVisible();
    await termsLink.first().click();

    await expect(page).toHaveURL(/\/terms$/);
    await expect(
      page.getByRole("heading", { name: t("termsPage.title") }),
    ).toBeVisible();
  });

  test("registration form links to terms of service", async ({ page }) => {
    await page.goto("/login?mode=register");
    await settle(page);

    // The form notice link
    const termsNoticeLink = page.locator("form").getByRole("link", {
      name: t("auth.footer.termsLink"),
    });
    await expect(termsNoticeLink).toBeVisible();
    await termsNoticeLink.click();

    await expect(page).toHaveURL(/\/terms$/);
  });

  test("site footer links to terms of service from landing page", async ({
    page,
  }) => {
    await page.goto("/");
    await settle(page);

    const footerTerms = page
      .locator("footer")
      .getByRole("link", { name: new RegExp(t("footer.terms"), "i") });
    await expect(footerTerms).toBeVisible();
    await footerTerms.click();

    await expect(page).toHaveURL(/\/terms$/);
  });
});
