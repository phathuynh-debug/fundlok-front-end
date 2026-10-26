import { describe, it, expect, vi } from "vitest";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { LazyMotion, domAnimation } from "framer-motion";

import { WelcomeCutscreen } from "./welcome-cutscreen";

vi.mock("@/lib/i18n", () => ({
  supportedLocales: ["en", "vi"],
  useTranslations: () => ({
    locale: "vi",
    setLocale: vi.fn(),
    t: (key: string) => key,
  }),
}));

vi.mock("@/components/welcome/welcome-visuals", () => ({
  WelcomeVisual: () => null,
}));

// The app's real loader is a lazy import; here it is a promise the test
// settles, so it can decide exactly when the animation features arrive.
let settleFeatures: (features: typeof domAnimation) => void;
const features = new Promise<typeof domAnimation>((resolve) => {
  settleFeatures = resolve;
});
vi.mock("@/components/appearance-provider", () => ({
  useAppearance: () => ({ reduceMotion: true }),
  loadMotionFeatures: () => features,
}));

describe("WelcomeCutscreen", () => {
  it("still changes slide when the animation code arrives mid-change", async () => {
    // CI caught this (welcome.spec "moves with the arrow keys"): an arrow
    // pressed in the moment the lazily loaded animation features land left
    // the first slide on screen for good, under a "2 / 8" counter.
    render(
      <LazyMotion features={() => features} strict>
        <WelcomeCutscreen role="SME" onFinish={vi.fn()} onClose={vi.fn()} />
      </LazyMotion>,
    );
    expect(screen.getByText("welcome.common.hello.title")).toBeInTheDocument();

    await act(async () => {
      settleFeatures(domAnimation);
      // LazyMotion registers the features here; its re-render is still queued
      // when the key goes down, so both land in the same render.
      await features;
      fireEvent.keyDown(document, { key: "ArrowRight" });
    });

    await waitFor(
      () =>
        expect(screen.getByText("welcome.sme.intro.title")).toBeInTheDocument(),
      { timeout: 2000 },
    );
    expect(screen.queryByText("welcome.common.hello.title")).toBeNull();
  });
});
