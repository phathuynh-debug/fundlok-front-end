import { test, expect, type Page } from "@playwright/test";

import { settle } from "../support/ui";

// The "SME or investor?" question that opens the landing page's process
// section. It is a tall scroll track with one screen pinned inside it, and
// everything on it (heading, the two cards sliding in from the sides, the hint,
// the fade-out) is driven by scroll position.
//
// That is the kind of thing that looks right in a screenshot and is wrong at the
// scroll position nobody looked at. It once rendered a BLANK screen for the
// whole time it was pinned, and only showed the cards while scrolling back up,
// because two of its animation paths ran on different clocks. So these tests
// scroll to positions and read what a reader would actually see there.

const heading = (page: Page) => page.locator("#audience-gate-title");

/** The tall element the gate's panel is pinned inside. */
const track = (page: Page) =>
  heading(page).locator("xpath=ancestor::div[contains(@style,'vh')][1]");

/** The two audience cards: SME first, investor second. */
const cards = (page: Page) =>
  page
    .locator('[role="group"][aria-labelledby="audience-gate-title"]')
    .getByRole("button");

/**
 * Scroll so the gate's track is `p` of the way through: 0 is the moment its top
 * enters the bottom of the screen, about 0.54 is where the panel pins, 1 is the
 * moment its bottom reaches the bottom of the screen. Then give framer-motion a
 * few frames to catch up, since it runs off the frame loop, not the scroll.
 */
async function scrollGateTo(page: Page, p: number): Promise<void> {
  await page.evaluate(async (progress) => {
    const t = document
      .getElementById("audience-gate-title")!
      .closest<HTMLElement>("div[style*='vh']")!;
    const top = t.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: top - window.innerHeight + progress * t.offsetHeight,
      behavior: "instant",
    });
    for (let i = 0; i < 4; i++) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  }, p);
}

/** How opaque an element really is: its own opacity times every ancestor's. */
const effectiveOpacity = (el: Element): number => {
  let opacity = 1;
  for (let n: Element | null = el; n; n = n.parentElement) {
    opacity *= parseFloat(getComputedStyle(n).opacity);
  }
  return opacity;
};

/** Wait for a smooth scroll (the click on a card starts one) to come to rest. */
async function scrollSettled(page: Page): Promise<void> {
  let last = -1;
  await expect
    .poll(
      async () => {
        const y = await page.evaluate(() => window.scrollY);
        const same = y === last;
        last = y;
        return same;
      },
      { intervals: [250], timeout: 10_000 },
    )
    .toBe(true);
}

/** The pinned hold: everything is on screen, opaque, and can be clicked. */
async function expectSeated(page: Page): Promise<void> {
  const viewport = page.viewportSize()!;

  const panelTop = await track(page).evaluate(
    (t) => t.firstElementChild!.getBoundingClientRect().top,
  );
  expect(Math.abs(panelTop), "the panel is pinned to the top").toBeLessThan(
    1.5,
  );

  await expect
    .poll(() => heading(page).evaluate(effectiveOpacity))
    .toBeGreaterThan(0.99);

  for (const i of [0, 1]) {
    const card = cards(page).nth(i);
    await expect
      .poll(() => card.evaluate(effectiveOpacity), {
        message: `card ${i} is fully opaque while pinned`,
      })
      .toBeGreaterThan(0.99);

    const box = (await card.boundingBox())!;
    expect(box.x, `card ${i} is inside the left edge`).toBeGreaterThanOrEqual(
      0,
    );
    expect(
      box.x + box.width,
      `card ${i} is inside the right edge`,
    ).toBeLessThanOrEqual(viewport.width);
    expect(
      box.y + box.height,
      `card ${i} is above the bottom`,
    ).toBeLessThanOrEqual(viewport.height);

    // A trial click runs every actionability check without clicking, including
    // "does this element actually receive the pointer at its centre".
    await card.click({ trial: true });
  }
}

test.describe("the audience gate", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await settle(page);
  });

  test("stays out of sight until the reader nears it", async ({ page }) => {
    await scrollGateTo(page, 0.02);

    await expect.poll(() => heading(page).evaluate(effectiveOpacity)).toBe(0);
    for (const i of [0, 1]) {
      await expect
        .poll(() => cards(page).nth(i).evaluate(effectiveOpacity))
        .toBe(0);
    }
  });

  test("the cards travel in from opposite sides and meet in the middle", async ({
    page,
  }) => {
    const lefts = () =>
      Promise.all(
        [0, 1].map((i) =>
          cards(page)
            .nth(i)
            .evaluate((el) => el.getBoundingClientRect().left),
        ),
      );

    await scrollGateTo(page, 0.2);
    const early = await lefts();
    await scrollGateTo(page, 0.5);
    const seated = await lefts();

    expect(early[0], "the SME card arrives from the left").toBeLessThan(
      seated[0],
    );
    expect(
      early[1],
      "the investor card arrives from the right",
    ).toBeGreaterThan(seated[1]);
  });

  test("holds both cards on screen while pinned, scrolling down and back up", async ({
    page,
  }) => {
    // Down, from the top of the page, the way a reader gets here. This is the
    // direction that used to show an empty screen.
    for (const p of [0, 0.15, 0.3, 0.45, 0.6, 0.68]) {
      await scrollGateTo(page, p);
    }
    await expectSeated(page);

    // Scrolled on, the panel has released...
    await scrollGateTo(page, 1);
    for (const i of [0, 1]) {
      await expect
        .poll(() => cards(page).nth(i).evaluate(effectiveOpacity))
        .toBeLessThan(0.05);
    }

    // ...and coming back up finds it exactly as it was.
    await scrollGateTo(page, 0.68);
    await expectSeated(page);
  });

  test("scrolling straight through without choosing gives the Business flow", async ({
    page,
  }) => {
    await scrollGateTo(page, 0.68);
    await expect(cards(page).nth(0)).toHaveAttribute("aria-pressed", "true");
    await expect(cards(page).nth(1)).toHaveAttribute("aria-pressed", "false");

    // Past the end of the track and into the sequence below it.
    await scrollGateTo(page, 1.5);
    await expect(
      page.locator("ol li").filter({ hasText: "KYB" }).first(),
    ).toBeVisible();
  });

  test("choosing Investor switches the flow, and scrolling back up keeps it", async ({
    page,
  }) => {
    await scrollGateTo(page, 0.68);
    await cards(page).nth(1).click();

    await expect(cards(page).nth(1)).toHaveAttribute("aria-pressed", "true");
    await expect(cards(page).nth(0)).toHaveAttribute("aria-pressed", "false");

    // The click smooth-scrolls to the sequence, which is now the investor's.
    await scrollSettled(page);
    await expect(
      page.locator("ol li").filter({ hasText: "KYC" }).first(),
    ).toBeVisible();

    // Back up through the tail of the gate: a choice is not undone by scrolling.
    await scrollGateTo(page, 0.9);
    await expect(cards(page).nth(1)).toHaveAttribute("aria-pressed", "true");
  });
});

test.describe("on a screen too short to pin a whole screen of content", () => {
  // A phone on its side, or a window with devtools docked.
  test.use({ viewport: { width: 844, height: 390 } });

  test("shows the plain gate, and both cards still work", async ({ page }) => {
    await page.goto("/");
    await settle(page);

    await expect(track(page)).toBeHidden();

    const plain = track(page).locator("xpath=preceding-sibling::div[1]");
    const options = plain.getByRole("button");
    await expect(options).toHaveCount(2);

    await options.nth(1).scrollIntoViewIfNeeded();
    await expect
      .poll(() => options.nth(1).evaluate(effectiveOpacity))
      .toBeGreaterThan(0.99);

    await options.nth(1).click();
    await expect(options.nth(1)).toHaveAttribute("aria-pressed", "true");
  });
});
