import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DocumentGuideVideo } from "./document-guide-video";

vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({ locale: "en", t: (key: string) => key }),
}));

describe("DocumentGuideVideo", () => {
  it("does not load the video until the dialog is opened", async () => {
    const { container } = render(<DocumentGuideVideo />);
    expect(container.ownerDocument.querySelector("video")).toBeNull();

    await userEvent.click(
      screen.getByRole("button", { name: "dashboard.documentGuide.videoOpen" }),
    );
    const video = document.querySelector("video");
    expect(video).not.toBeNull();
    expect(video?.getAttribute("src")).toBe("/videos/document-guide.mp4");
    expect(video?.hasAttribute("controls")).toBe(true);
  });
});
