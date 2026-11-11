import { describe, expect, it } from "vitest";
import {
  codeIsSpent,
  formatVietnameseMobile,
  isVietnameseMobile,
  phoneVerificationErrorKey,
} from "./phone-verification";

describe("isVietnameseMobile", () => {
  it.each([
    "0912345678",
    "+84912345678",
    "84912345678",
    "0912 345 678",
    "091.234.5678",
    " 0387654321 ",
  ])("accepts %s", (value) => {
    expect(isVietnameseMobile(value)).toBe(true);
  });

  // Same rule as the backend (app/phone_verification/phone.py): codes go to
  // Vietnamese mobiles only, never landlines or foreign numbers.
  it.each([
    "",
    "+14155550123",
    "02838123456",
    "0212345678",
    "091234567",
    "09123456789",
    "０９１２３４５６７８",
  ])("rejects %j", (value) => {
    expect(isVietnameseMobile(value)).toBe(false);
  });
});

describe("formatVietnameseMobile", () => {
  it("groups a canonical number", () => {
    expect(formatVietnameseMobile("+84912345678")).toBe("+84 912 345 678");
  });

  it("leaves anything else as it is", () => {
    expect(formatVietnameseMobile("0912345678")).toBe("0912345678");
  });
});

describe("phoneVerificationErrorKey", () => {
  it.each([
    ["Incorrect code", "incorrectCode"],
    ["This code has expired. Request a new one.", "codeExpired"],
    ["Too many incorrect attempts. Request a new code.", "tooManyAttempts"],
    ["Phone number already registered", "phoneTaken"],
    ["This number has no Zalo account that can receive the code", "noZalo"],
  ])("maps the backend's %j", (message, key) => {
    expect(phoneVerificationErrorKey({ message, status: 400 })).toBe(
      `auth.verifyPhone.errors.${key}`,
    );
  });

  it.each([
    [422, "phoneInvalid"],
    [429, "tooManyRequests"],
    [502, "sendFailed"],
    [503, "unavailable"],
    [500, "generic"],
    [undefined, "generic"],
  ])("maps status %s", (status, key) => {
    expect(
      phoneVerificationErrorKey({ message: "anything else", status }),
    ).toBe(`auth.verifyPhone.errors.${key}`);
  });

  it("falls back when there is no error at all", () => {
    expect(phoneVerificationErrorKey(null)).toBe(
      "auth.verifyPhone.errors.generic",
    );
  });
});

describe("codeIsSpent", () => {
  it("is true only when the code can no longer be used", () => {
    expect(codeIsSpent("auth.verifyPhone.errors.codeExpired")).toBe(true);
    expect(codeIsSpent("auth.verifyPhone.errors.tooManyAttempts")).toBe(true);
    expect(codeIsSpent("auth.verifyPhone.errors.incorrectCode")).toBe(false);
  });
});
