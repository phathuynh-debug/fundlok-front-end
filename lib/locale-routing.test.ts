import { describe, expect, it } from "vitest";

import {
  LOCALIZED_PATHS,
  languageAlternates,
  localizedHref,
  localizedPath,
  parseLocalePath,
} from "./locale-routing";

describe("parseLocalePath", () => {
  it("reads /en as the English home page", () => {
    expect(parseLocalePath("/en")).toEqual({
      path: "/",
      locale: "en",
      prefixed: true,
    });
  });

  it("reads /en/<page> as that page in English", () => {
    expect(parseLocalePath("/en/rate")).toEqual({
      path: "/rate",
      locale: "en",
      prefixed: true,
    });
  });

  it("treats an unprefixed public page as Vietnamese", () => {
    expect(parseLocalePath("/faq")).toEqual({
      path: "/faq",
      locale: "vi",
      prefixed: false,
    });
  });

  it("gives a non-public page no language, so the cookie decides", () => {
    expect(parseLocalePath("/dashboard").locale).toBeNull();
  });

  it("flags /en on a non-public page so the proxy can redirect it", () => {
    expect(parseLocalePath("/en/dashboard")).toEqual({
      path: "/dashboard",
      locale: null,
      prefixed: true,
    });
  });

  it("does not mistake a path that merely starts with 'en' for the prefix", () => {
    // "/enterprise" is not "/en" + "/terprise".
    expect(parseLocalePath("/enterprise")).toEqual({
      path: "/enterprise",
      locale: null,
      prefixed: false,
    });
  });

  it("ignores a trailing slash after the prefix", () => {
    expect(parseLocalePath("/en/faq/").path).toBe("/faq");
  });
});

describe("localizedPath / localizedHref", () => {
  it("leaves Vietnamese at the existing URLs", () => {
    for (const path of LOCALIZED_PATHS) {
      expect(localizedPath(path, "vi")).toBe(path);
    }
  });

  it("prefixes English, with the home page at /en rather than /en/", () => {
    expect(localizedPath("/", "en")).toBe("/en");
    expect(localizedPath("/rate", "en")).toBe("/en/rate");
  });

  it("never prefixes a page that has no English URL", () => {
    expect(localizedPath("/dashboard", "en")).toBe("/dashboard");
  });

  it("keeps the query and hash on an href", () => {
    expect(localizedHref("/login?mode=register", "en")).toBe(
      "/en/login?mode=register",
    );
    expect(localizedHref("/#process", "en")).toBe("/en#process");
    expect(localizedHref("/why-us#achievements", "en")).toBe(
      "/en/why-us#achievements",
    );
  });

  it("leaves external and protocol-relative hrefs alone", () => {
    expect(localizedHref("https://example.com/faq", "en")).toBe(
      "https://example.com/faq",
    );
    expect(localizedHref("//example.com/faq", "en")).toBe("//example.com/faq");
    expect(localizedHref("#top", "en")).toBe("#top");
  });

  it("round-trips: every English URL parses back to its page", () => {
    for (const path of LOCALIZED_PATHS) {
      expect(parseLocalePath(localizedPath(path, "en"))).toEqual({
        path,
        locale: "en",
        prefixed: true,
      });
    }
  });
});

describe("languageAlternates", () => {
  it("names both versions and points x-default at Vietnamese", () => {
    expect(languageAlternates("/rate")).toEqual({
      vi: "/rate",
      en: "/en/rate",
      "x-default": "/rate",
    });
  });
});
