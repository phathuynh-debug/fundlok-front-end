import { describe, it, expect } from "vitest";
import { apiErrorMessage, backendText } from "./api-error-message";

// The backend writes English only. Its text may appear on the English site and
// nowhere else, or the Vietnamese site shows English sentences (a KYC rejection
// reason did exactly that).

describe("backendText", () => {
  it("shows the backend's wording on the English site", () => {
    expect(backendText("ID card front not valid", "en", "fallback")).toBe(
      "ID card front not valid",
    );
  });

  it("shows the translated fallback on the Vietnamese site", () => {
    expect(
      backendText(
        "We could not complete your identity verification.",
        "vi",
        "Chúng tôi không thể xác minh danh tính của bạn.",
      ),
    ).toBe("Chúng tôi không thể xác minh danh tính của bạn.");
  });

  it.each([null, undefined, "", "   ", 42])(
    "falls back when the backend gave nothing usable (%j)",
    (text) => {
      expect(backendText(text, "en", "fallback")).toBe("fallback");
    },
  );
});

describe("apiErrorMessage", () => {
  it("applies the same rule to an error's message", () => {
    const error = { message: "KYC is under manual review" };
    expect(apiErrorMessage(error, "en", "fallback")).toBe(
      "KYC is under manual review",
    );
    expect(apiErrorMessage(error, "vi", "fallback")).toBe("fallback");
    expect(apiErrorMessage(null, "en", "fallback")).toBe("fallback");
  });
});
