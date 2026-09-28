import { describe, it, expect } from "vitest";
import { safeNextPath } from "./safe-next-path";

describe("safeNextPath", () => {
  it("accepts same-origin absolute paths, keeping query and hash", () => {
    expect(safeNextPath("/dashboard")).toBe("/dashboard");
    expect(safeNextPath("/dashboard/invest?id=42#terms")).toBe(
      "/dashboard/invest?id=42#terms",
    );
    expect(safeNextPath("/project-application?step=2")).toBe(
      "/project-application?step=2",
    );
  });

  it("returns the normalised in-app path for harmless dot-segments", () => {
    expect(safeNextPath("/dashboard/../admin")).toBe("/admin");
    expect(safeNextPath("/./dashboard")).toBe("/dashboard");
  });

  it("rejects empty and non-absolute values", () => {
    expect(safeNextPath(null)).toBeNull();
    expect(safeNextPath(undefined)).toBeNull();
    expect(safeNextPath("")).toBeNull();
    expect(safeNextPath("dashboard")).toBeNull();
    expect(safeNextPath("https://evil.com")).toBeNull();
    expect(safeNextPath("javascript:alert(1)")).toBeNull();
  });

  it("rejects raw protocol-relative values", () => {
    expect(safeNextPath("//evil.com")).toBeNull();
    expect(safeNextPath("//evil.com/phish")).toBeNull();
    expect(safeNextPath("/\\evil.com")).toBeNull();
    expect(safeNextPath("/\\\\evil.com")).toBeNull();
  });

  // Regression: these pass a raw-string check but normalise to "//evil.com".
  it.each([
    "/.//evil.com",
    "/..//evil.com",
    "/%2e//evil.com",
    "/%2E//evil.com",
    "/%2e%2e//evil.com",
    "/a/..//evil.com",
    "/a/b/../..//evil.com",
    "/./\\evil.com",
    "/.\\/evil.com",
    "/..//evil.com/login?x=1",
  ])("rejects dot-segment bypass %j", (payload) => {
    expect(safeNextPath(payload)).toBeNull();
  });

  it("rejects values the URL parser resolves to another origin", () => {
    // Tabs and newlines are stripped by the parser: "/\t/evil.com" -> "//evil.com".
    expect(safeNextPath("/\t/evil.com")).toBeNull();
    expect(safeNextPath("/\n/evil.com")).toBeNull();
  });

  it("never returns a value a browser would treat as off-site", () => {
    const payloads = [
      "/.//evil.com",
      "/%2e//evil.com",
      "/./\\evil.com",
      "/\t/evil.com",
      "/dashboard",
    ];
    for (const payload of payloads) {
      const result = safeNextPath(payload);
      if (result === null) continue;
      expect(new URL(result, "https://fundlok.com").origin).toBe(
        "https://fundlok.com",
      );
    }
  });
});
