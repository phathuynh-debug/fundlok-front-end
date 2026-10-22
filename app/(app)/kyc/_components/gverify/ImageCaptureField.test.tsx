import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ImageCaptureField } from "./ImageCaptureField";
import type { StagedImage } from "./useGVerifyKyc";

vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({
    locale: "en",
    setLocale: vi.fn(),
    t: (key: string) => key,
  }),
}));

const EMPTY: StagedImage = { file: null, previewUrl: null, error: null };
const TAKEN: StagedImage = {
  file: new File(["x"], "front-capture.jpg", { type: "image/jpeg" }),
  previewUrl: "blob:test",
  error: null,
};

function renderField(image: StagedImage = EMPTY, onSelect = vi.fn()) {
  const view = render(
    <ImageCaptureField
      slot="front"
      image={image}
      disabled={false}
      onSelect={onSelect}
    />,
  );
  return { ...view, onSelect };
}

// Sets the two things cameraSupported() reads, and puts them back after.
function stubCamera(getUserMedia?: () => Promise<MediaStream>) {
  Object.defineProperty(window, "isSecureContext", {
    value: true,
    configurable: true,
  });
  Object.defineProperty(navigator, "mediaDevices", {
    value: getUserMedia ? { getUserMedia } : undefined,
    configurable: true,
  });
}

afterEach(() => {
  Object.defineProperty(navigator, "mediaDevices", {
    value: undefined,
    configurable: true,
  });
});

describe("ImageCaptureField", () => {
  it("has no way to choose a file from the device", () => {
    const { container } = renderField();

    // Photos are taken live to show who is registering, so there is no file
    // input to pick from the gallery or the file system, hidden or not.
    expect(container.querySelector('input[type="file"]')).toBeNull();
    expect(screen.queryByText("kyc.gv.chooseFromLibrary")).toBeNull();
  });

  it("is a real button, so the keyboard can reach it", () => {
    renderField();

    const tile = screen.getByRole("button", { name: /kyc\.gv\.clickToAdd/ });
    expect(tile.tagName).toBe("BUTTON");
    // Named for the photo it takes, not just "tap to take a photo".
    expect(tile).toHaveAccessibleName(/kyc\.gv\.frontLabel/);
  });

  it("opens the live camera, and not a file picker, when tapped", async () => {
    stubCamera(() => new Promise<MediaStream>(() => {})); // never settles
    renderField();

    fireEvent.click(
      screen.getByRole("button", { name: /kyc\.gv\.clickToAdd/ }),
    );

    expect(
      await screen.findByRole("dialog", { name: "kyc.gv.frontLabel" }),
    ).toBeInTheDocument();
    // The camera is in <body>, so look there: no file input anywhere.
    expect(document.body.querySelector('input[type="file"]')).toBeNull();
    expect(screen.queryByText("kyc.gv.chooseFromLibrary")).toBeNull();
    // The shutter is the only thing in the dialog that adds a photo.
    expect(
      screen.getByRole("button", { name: "kyc.gv.captureBtn" }),
    ).toBeInTheDocument();
  });

  it("opens the camera over the page, not inside the field", async () => {
    stubCamera(() => new Promise<MediaStream>(() => {}));
    const { container } = renderField();

    fireEvent.click(
      screen.getByRole("button", { name: /kyc\.gv\.clickToAdd/ }),
    );

    const camera = await screen.findByRole("dialog");
    // Inside the field it took on the field's `space-y-2` margin, which
    // shrank the full-screen box and left a strip of the page under it.
    expect(container).not.toContainElement(camera);
    expect(camera.parentElement).toBe(document.body);
  });

  it("says the camera is blocked, and offers no upload instead", async () => {
    stubCamera(() =>
      Promise.reject(new DOMException("blocked", "NotAllowedError")),
    );
    const { onSelect } = renderField();

    fireEvent.click(
      screen.getByRole("button", { name: /kyc\.gv\.clickToAdd/ }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "kyc.gv.cameraDenied",
    );
    // The dialog is gone, nothing was staged, and still no way around it.
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onSelect).not.toHaveBeenCalled();
    expect(document.body.querySelector('input[type="file"]')).toBeNull();
  });

  it("says when no camera could be started", async () => {
    stubCamera(() => Promise.reject(new DOMException("none", "NotFoundError")));
    renderField();

    fireEvent.click(
      screen.getByRole("button", { name: /kyc\.gv\.clickToAdd/ }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "kyc.gv.cameraFailed",
    );
  });

  it("says when the page cannot use a camera at all", async () => {
    stubCamera(); // no mediaDevices: an old browser, or a plain-http origin
    renderField();

    fireEvent.click(
      screen.getByRole("button", { name: /kyc\.gv\.clickToAdd/ }),
    );

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "kyc.gv.cameraUnsupported",
      ),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows a taken photo, retakes from the tile, and removes separately", () => {
    stubCamera(() => new Promise<MediaStream>(() => {}));
    const { onSelect } = renderField(TAKEN);

    expect(screen.getByText("kyc.gv.photoTaken")).toBeInTheDocument();

    // Remove is its own button next to the tile, not nested inside it.
    const remove = screen.getByRole("button", { name: "Remove" });
    const tile = screen.getByRole("button", { name: /kyc\.gv\.photoTaken/ });
    expect(tile).not.toContainElement(remove);
    fireEvent.click(remove);
    expect(onSelect).toHaveBeenCalledWith("front", null);

    // Tapping the tile retakes: it opens the camera again.
    fireEvent.click(tile);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
