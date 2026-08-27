import type { Locator, Page } from "@playwright/test";

/**
 * The visible toast matching `text`.
 *
 * Radix renders every toast TWICE: the real one as an `<li>` inside the viewport
 * `<ol>`, and a duplicate inside a visually-hidden `aria-live` region so screen
 * readers announce it (ToastAnnounce in @radix-ui/react-toast). An unscoped
 * `getByText()` therefore always resolves to two elements and fails strict mode
 * — scoping to the viewport picks the one a user can actually see.
 */
export function toast(page: Page, text: string): Locator {
  return page.locator("ol > li").filter({ hasText: text });
}

/**
 * Wait until the page is genuinely ready to be measured or scraped.
 *
 * Replaces `waitForLoadState("networkidle")`, which Playwright discourages and
 * which proved flaky here: under four parallel workers a heavy page can take
 * longer than the timeout to go quiet, even though nothing is actually pending.
 *
 * `document.fonts.ready` is the load-bearing part for any test that measures
 * layout — text width depends on the font, so measuring before the webfont
 * swaps in gives numbers for the fallback face instead.
 */
export async function settle(page: Page): Promise<void> {
  await page.waitForLoadState("load");
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
}
