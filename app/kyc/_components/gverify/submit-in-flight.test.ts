import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { CAPTURE_SLOTS, useGVerifyKyc } from "./useGVerifyKyc";
import { useGVerifyKyb } from "./useGVerifyKyb";

// Each submit first base64-encodes the staged files and only then calls the
// mutation, so the mutation's own isPending cannot stop a second tap that
// lands in between. Every tap that got through was a separate paid GVerify
// call and a separate attempt. These pin the synchronous in-flight guard.

const verifySession = vi.fn();
const verifyToken = vi.fn();
const verifyKyb = vi.fn();

vi.mock("@/hooks/use-gverify", () => ({
  useGVerifyVerify: () => ({ mutateAsync: verifySession, isPending: false }),
  useGVerifyVerifyWithToken: () => ({
    mutateAsync: verifyToken,
    isPending: false,
  }),
  useGVerifyKybVerify: () => ({ mutateAsync: verifyKyb, isPending: false }),
}));

/** A promise the test settles by hand, standing in for the provider call. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

// Small enough to skip compression, so staging needs no canvas.
const image = (name: string) =>
  new File(["img"], `${name}.jpg`, { type: "image/jpeg" });

beforeEach(() => {
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn(() => "blob:test"),
    revokeObjectURL: vi.fn(),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("KYC submit", () => {
  async function stagedKyc(options?: { handoffToken?: string }) {
    const hook = renderHook(() => useGVerifyKyc(options));
    act(() => {
      CAPTURE_SLOTS.forEach((slot) =>
        hook.result.current.setFile(slot, image(slot)),
      );
    });
    await waitFor(() => expect(hook.result.current.allReady).toBe(true));
    return hook;
  }

  it("sends one verification for a double-tap", async () => {
    const call = deferred<{ status: string }>();
    verifySession.mockReturnValue(call.promise);
    const { result } = await stagedKyc();

    let first!: Promise<unknown>;
    let second!: Promise<unknown>;
    act(() => {
      first = result.current.submit();
      second = result.current.submit();
    });

    await expect(second).resolves.toBeNull();
    expect(result.current.submitting).toBe(true);

    await act(async () => {
      call.resolve({ status: "APPROVED" });
      await first;
    });
    expect(verifySession).toHaveBeenCalledTimes(1);
    await expect(first).resolves.toEqual({ status: "APPROVED" });
    expect(result.current.submitting).toBe(false);
  });

  it("guards the phone handoff the same way", async () => {
    verifyToken.mockResolvedValue({ status: "PENDING" });
    const { result } = await stagedKyc({ handoffToken: "handoff" });

    await act(async () => {
      await Promise.all([result.current.submit(), result.current.submit()]);
    });
    expect(verifyToken).toHaveBeenCalledTimes(1);
  });

  it("allows a new attempt once the first has failed", async () => {
    verifySession.mockRejectedValueOnce(new Error("network"));
    verifySession.mockResolvedValueOnce({ status: "APPROVED" });
    const { result } = await stagedKyc();

    await act(async () => {
      await expect(result.current.submit()).rejects.toThrow("network");
    });
    await act(async () => {
      await expect(result.current.submit()).resolves.toEqual({
        status: "APPROVED",
      });
    });
    expect(verifySession).toHaveBeenCalledTimes(2);
  });
});

describe("KYB submit", () => {
  it("sends one verification for a double-click", async () => {
    const call = deferred<{ status: string }>();
    verifyKyb.mockReturnValue(call.promise);
    const { result } = renderHook(() => useGVerifyKyb());
    act(() => {
      result.current.setFile(image("certificate"));
    });
    await waitFor(() => expect(result.current.document.file).not.toBeNull());

    let first!: Promise<unknown>;
    let second!: Promise<unknown>;
    act(() => {
      first = result.current.submit();
      second = result.current.submit();
    });

    await expect(second).resolves.toBeNull();
    expect(result.current.submitting).toBe(true);
    await act(async () => {
      call.resolve({ status: "APPROVED" });
      await first;
    });
    expect(verifyKyb).toHaveBeenCalledTimes(1);
    expect(result.current.submitting).toBe(false);
  });
});
