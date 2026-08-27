import { test, expect } from "@playwright/test";

import { signInAs } from "../support/auth";

/**
 * Regression guard for horizontal page overflow.
 *
 * A VND figure is 15-16 characters and Intl puts a NON-BREAKING space before
 * the ₫, so the string can never wrap. Left unable to shrink, one such figure
 * sets a min-content width on its card, the grid refuses to compress, and the
 * whole page becomes wider than the viewport — which clipped the ₫ on the
 * summary cards and pushed the last table column off screen at 125% browser
 * zoom. It was reported twice.
 *
 * Browser zoom of N% is layout-equivalent to a viewport 1/N as wide, so the
 * widths below cover 100%, 125% and 150% zoom on common laptop screens without
 * needing to drive Chrome's zoom.
 */

const WIDTHS = [
  { label: "1512 @ 150% zoom", width: 1008 },
  { label: "1440 @ 125% zoom", width: 1152 },
  { label: "1512 @ 125% zoom", width: 1210 },
  { label: "1512 @ 100% zoom", width: 1512 },
  { label: "tablet portrait", width: 768 },
  { label: "phone", width: 390 },
];

const ROUTES = [
  { path: "/dashboard", as: "investor" as const },
  { path: "/dashboard/transactions", as: "investor" as const },
  { path: "/dashboard/analytics", as: "investor" as const },
  { path: "/dashboard/projects", as: "investor" as const },
  { path: "/dashboard", as: "sme" as const },
];

for (const route of ROUTES) {
  for (const { label, width } of WIDTHS) {
    test(`${route.path} (${route.as}) does not scroll sideways at ${label}`, async ({
      page,
      context,
    }) => {
      await signInAs(context, route.as);
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route.path);
      await page.waitForLoadState("networkidle");

      const overflow = await page.evaluate(() => {
        const root = document.documentElement;
        return {
          scrollWidth: root.scrollWidth,
          clientWidth: root.clientWidth,
        };
      });

      // +1 absorbs sub-pixel rounding. Anything beyond that is a real
      // horizontal scrollbar on the page body.
      expect(
        overflow.scrollWidth,
        `page is ${overflow.scrollWidth - overflow.clientWidth}px wider than the viewport`,
      ).toBeLessThanOrEqual(overflow.clientWidth + 1);
    });
  }
}

test("a wide table scrolls inside its own container, not the page", async ({
  page,
  context,
}) => {
  // The fix is not "make the table narrow" — it is that the table owns its
  // overflow. This asserts the mechanism, so a future change that lets the
  // page scroll again fails here even if nothing looks clipped.
  await signInAs(context, "investor");
  await page.setViewportSize({ width: 1210, height: 900 });
  await page.goto("/dashboard/transactions");
  await page.waitForLoadState("networkidle");

  const table = page.getByRole("table");
  await expect(table).toBeVisible();

  const scrollsInsideAContainer = await table.evaluate((el) => {
    let node: HTMLElement | null = el.parentElement;
    while (node && node !== document.body) {
      const overflowX = getComputedStyle(node).overflowX;
      if (overflowX === "auto" || overflowX === "scroll") return true;
      node = node.parentElement;
    }
    return false;
  });

  expect(
    scrollsInsideAContainer,
    "the table must sit inside an overflow-x container of its own",
  ).toBe(true);
});
