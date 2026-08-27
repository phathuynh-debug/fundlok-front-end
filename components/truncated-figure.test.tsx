import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { TruncatedFigure } from "./truncated-figure";

// jsdom performs no layout, so scrollWidth/clientWidth are always 0 and there
// is no ResizeObserver. Both are stubbed here so the clipped and unclipped
// branches can actually be exercised — the whole point of the component is that
// it behaves differently depending on measurement.

let triggerResize: (() => void) | null = null;

function stubLayout({
  scrollWidth,
  clientWidth,
}: {
  scrollWidth: number;
  clientWidth: number;
}) {
  Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
    configurable: true,
    get: () => scrollWidth,
  });
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get: () => clientWidth,
  });
}

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        // The real ResizeObserver invokes the callback once on observe; the
        // component relies on that for its initial measurement.
        triggerResize = callback;
      }
      observe() {
        triggerResize?.();
      }
      disconnect() {
        triggerResize = null;
      }
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  triggerResize = null;
  // @ts-expect-error — restore jsdom's own zero-valued getters
  delete HTMLElement.prototype.scrollWidth;
  // @ts-expect-error — same
  delete HTMLElement.prototype.clientWidth;
});

const FULL = "2.605.000.000 ₫";

describe("TruncatedFigure", () => {
  it("always keeps the complete value in the DOM, clipped or not", () => {
    // Truncation is visual only, so the accessible name must stay complete —
    // a screen reader should never hear an ellipsis.
    stubLayout({ scrollWidth: 400, clientWidth: 150 });
    render(<TruncatedFigure value={FULL} />);
    expect(screen.getByText(FULL)).toBeInTheDocument();
  });

  it("is not focusable when the value fits", () => {
    stubLayout({ scrollWidth: 150, clientWidth: 150 });
    render(<TruncatedFigure value={FULL} />);
    expect(screen.getByText(FULL)).not.toHaveAttribute("tabindex");
  });

  it("becomes focusable once the value is clipped", () => {
    // Without a tab stop the hidden digits are unreachable by keyboard, which
    // is the accessibility half of the fix.
    stubLayout({ scrollWidth: 400, clientWidth: 150 });
    render(<TruncatedFigure value={FULL} />);
    expect(screen.getByText(FULL)).toHaveAttribute("tabindex", "0");
  });

  it("treats a one-pixel overflow as fitting", () => {
    // Sub-pixel rounding otherwise flags perfectly fitting figures as clipped
    // at certain zoom levels, producing a tooltip that repeats visible text.
    stubLayout({ scrollWidth: 151, clientWidth: 150 });
    render(<TruncatedFigure value={FULL} />);
    expect(screen.getByText(FULL)).not.toHaveAttribute("tabindex");
  });

  it("clips with block display, since text-overflow ignores inline boxes", () => {
    stubLayout({ scrollWidth: 400, clientWidth: 150 });
    render(<TruncatedFigure value={FULL} />);
    const figure = screen.getByText(FULL);
    expect(figure.className).toContain("block");
    expect(figure.className).toContain("truncate");
  });

  it("keeps the caller's classes", () => {
    stubLayout({ scrollWidth: 150, clientWidth: 150 });
    render(<TruncatedFigure value={FULL} className="text-2xl font-bold" />);
    const figure = screen.getByText(FULL);
    expect(figure.className).toContain("text-2xl");
    expect(figure.className).toContain("font-bold");
  });

  it("renders without a ResizeObserver instead of throwing", () => {
    // Guards the jsdom/SSR path: no measurement available means no tooltip,
    // not a crash.
    vi.stubGlobal("ResizeObserver", undefined);
    stubLayout({ scrollWidth: 400, clientWidth: 150 });
    expect(() => render(<TruncatedFigure value={FULL} />)).not.toThrow();
    expect(screen.getByText(FULL)).toBeInTheDocument();
  });
});
