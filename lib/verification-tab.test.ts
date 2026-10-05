import { describe, it, expect } from "vitest";
import {
  VERIFICATION_TAB_PARAM,
  isVerificationTabId,
  newVerificationTabId,
  readVerificationMessage,
  verificationUrl,
} from "./verification-tab";

// The two-tab verification handshake: the tab that opened /kyc only acts on a
// message for its own id, with an on-site destination.

const ID = "3f2c9a1e-7b4d-4c1a-9e2f-0a1b2c3d4e5f";

describe("verificationUrl", () => {
  it("carries the destination, and the tab id in tab mode", () => {
    const url = new URL(
      verificationUrl("/dashboard/invest?amount=131&projectId=p1", ID),
      "https://fundlok.com",
    );
    expect(url.pathname).toBe("/kyc");
    expect(url.searchParams.get("next")).toBe(
      "/dashboard/invest?amount=131&projectId=p1",
    );
    expect(url.searchParams.get(VERIFICATION_TAB_PARAM)).toBe(ID);
  });

  it("has no tab id for a same-tab fallback", () => {
    const url = new URL(
      verificationUrl("/project-application"),
      "https://x.test",
    );
    expect(url.searchParams.has(VERIFICATION_TAB_PARAM)).toBe(false);
  });
});

describe("tab ids", () => {
  it("generates ids the /kyc page accepts", () => {
    const a = newVerificationTabId();
    expect(isVerificationTabId(a)).toBe(true);
    expect(newVerificationTabId()).not.toBe(a);
  });

  it.each(["", "short", "<script>", "a".repeat(65), null, 42])(
    "rejects %j",
    (value) => {
      expect(isVerificationTabId(value)).toBe(false);
    },
  );
});

describe("readVerificationMessage", () => {
  it("accepts a verified message for this tab", () => {
    expect(
      readVerificationMessage(
        { type: "verified", id: ID, next: "/dashboard/invest?amount=1" },
        ID,
      ),
    ).toEqual({ type: "verified", id: ID, next: "/dashboard/invest?amount=1" });
  });

  it("accepts an ack for this tab", () => {
    expect(readVerificationMessage({ type: "ack", id: ID }, ID)).toEqual({
      type: "ack",
      id: ID,
    });
  });

  it("ignores messages meant for another tab", () => {
    expect(
      readVerificationMessage(
        { type: "verified", id: "another-tab-id", next: "/dashboard" },
        ID,
      ),
    ).toBeNull();
  });

  it.each(["//evil.com", "/.//evil.com", "https://evil.com", "", 7])(
    "ignores an off-site or malformed destination (%j)",
    (next) => {
      expect(
        readVerificationMessage({ type: "verified", id: ID, next }, ID),
      ).toBeNull();
    },
  );

  it.each([null, undefined, "verified", 1, { type: "other", id: ID }])(
    "ignores junk (%j)",
    (data) => {
      expect(readVerificationMessage(data, ID)).toBeNull();
    },
  );
});
