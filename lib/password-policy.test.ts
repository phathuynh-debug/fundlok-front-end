import { describe, it, expect } from "vitest";
import en from "./i18n/en.json";
import {
  isPasswordBreached,
  isPasswordTooLong,
  passwordProblem,
  unmetPasswordRules,
} from "./password-policy";

// Resolves a dot-path against en.json, as the app's translator does.
const t = (key: string): string =>
  key
    .split(".")
    .reduce<unknown>(
      (node, part) => (node as Record<string, unknown>)?.[part],
      en,
    ) as string;

describe("unmetPasswordRules", () => {
  it.each(["Str0ngPassw0rd!1", "Mật-khẩu-2026", "aB3$efgh", "with Space 9!"])(
    "accepts %s",
    (password) => {
      expect(unmetPasswordRules(password)).toEqual([]);
    },
  );

  it.each([
    ["aB3$efg", "length"],
    ["AB3$EFGH", "lowercase"],
    ["ab3$efgh", "uppercase"],
    ["aB$$efgh", "digit"],
    ["aB3defgh", "symbol"],
    ["aB3 efgh", "symbol"], // a space is not a symbol, as on the server
  ])("%s lacks %s", (password, rule) => {
    expect(unmetPasswordRules(password)).toEqual([rule]);
  });

  it("counts characters, not UTF-16 units, toward the length", () => {
    // Seven characters, one of them outside the BMP (two UTF-16 units).
    expect(unmetPasswordRules("aB3$ef😀")).toEqual(["length"]);
  });
});

describe("isPasswordTooLong", () => {
  it("measures bytes, as the server does", () => {
    // 27 characters but 73 bytes: "ậ" takes three bytes in UTF-8.
    expect(isPasswordTooLong("Aa1!" + "ậ".repeat(23))).toBe(true);
    expect(isPasswordTooLong("Aa1!" + "a".repeat(68))).toBe(false);
  });
});

describe("passwordProblem", () => {
  it("is null for a password that meets every rule", () => {
    expect(passwordProblem("Str0ngPassw0rd!1", t)).toBeNull();
  });

  it("names everything missing in one sentence", () => {
    expect(passwordProblem("short", t)).toBe(
      "Password needs: at least 8 characters, an uppercase letter, a digit, a symbol.",
    );
  });

  it("says too long before listing rules", () => {
    expect(passwordProblem("a".repeat(80), t)).toBe(
      en.auth.passwordPolicy.tooLong,
    );
  });
});

describe("isPasswordBreached", () => {
  it("recognises the server's refusal by its code", () => {
    expect(
      isPasswordBreached({
        message: "breached",
        status: 400,
        code: "PASSWORD_BREACHED",
      }),
    ).toBe(true);
  });

  it.each([
    { message: "Current password is incorrect", status: 400 },
    null,
    undefined,
  ])("ignores other failures: %o", (error) => {
    expect(isPasswordBreached(error)).toBe(false);
  });
});
