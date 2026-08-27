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
