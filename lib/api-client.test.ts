import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import ApiClient from "./api-client";

const MFA_DETAIL =
  "Admin accounts must sign in with a second factor. Set up an authenticator app or a passkey, then sign in again with it.";

// An adapter that answers like the backend refusing the call, so the request
// runs through the real response interceptor without any network.
function refuse(status: number, code?: string) {
  return async (config: InternalAxiosRequestConfig) => {
    throw new AxiosError(
      "Request failed",
      AxiosError.ERR_BAD_REQUEST,
      config,
      null,
      {
        data: { detail: MFA_DETAIL },
        status,
        statusText: "Forbidden",
        headers: code ? { "x-error-code": code } : {},
        config,
      },
    );
  };
}

// Whether a promise has settled shortly after the call.
async function outcome(promise: Promise<unknown>) {
  return Promise.race([
    promise.then(
      () => "resolved",
      () => "rejected",
    ),
    new Promise((resolve) => setTimeout(() => resolve("pending"), 20)),
  ]);
}

let replace: ReturnType<typeof vi.fn>;

function visit(pathname: string) {
  replace = vi.fn();
  vi.stubGlobal("location", { pathname, replace });
}

describe("ApiClient, admin second factor", () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends an admin on a password-only session to set one up", async () => {
    visit("/admin/users");

    const call = client.get("/admin/users", {
      adapter: refuse(403, "MFA_REQUIRED"),
    });

    // Left pending, so the page being replaced shows no error state on the
    // way out.
    expect(await outcome(call)).toBe("pending");
    expect(replace).toHaveBeenCalledWith("/admin/security");
  });

  it("navigates once for a page's burst of refused queries", async () => {
    visit("/admin");

    const calls = ["/admin/overview", "/rate-inquiries", "/investor-leads"].map(
      (url) => client.get(url, { adapter: refuse(403, "MFA_REQUIRED") }),
    );
    await Promise.all(calls.map(outcome));

    expect(replace).toHaveBeenCalledTimes(1);
  });

  it("lets the security page see the refusal instead of reloading itself", async () => {
    visit("/admin/security");

    await expect(
      client.get("/auth/sessions", { adapter: refuse(403, "MFA_REQUIRED") }),
    ).rejects.toEqual({
      message: MFA_DETAIL,
      details: undefined,
      status: 403,
      code: "MFA_REQUIRED",
    });
    expect(replace).not.toHaveBeenCalled();
  });

  it("leaves other refusals alone", async () => {
    visit("/admin/users");

    await expect(
      client.get("/admin/users", { adapter: refuse(403) }),
    ).rejects.toMatchObject({ status: 403, code: undefined });
    expect(replace).not.toHaveBeenCalled();
  });
});
