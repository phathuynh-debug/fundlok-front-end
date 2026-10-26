import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render } from "@testing-library/react";

import { LoginForm } from "./login-form";
import type { ApiError } from "@/lib/types";

// Vietnamese, because that is where a lockout used to read as "wrong email or
// password": the backend's English detail is never shown on this locale.
vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({
    locale: "vi",
    t: (key: string) => key,
    localize: (path: string) => path,
  }),
}));

const toast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));

vi.mock("@/hooks/use-turnstile", () => ({
  useTurnstile: () => ({
    turnstileToken: "turnstile-token",
    turnstileContainerRef: { current: null },
    reset: vi.fn(),
  }),
}));

let failWith: ApiError;
vi.mock("@/app/(app)/login/use-login", () => ({
  useLogin: () => ({
    login: (_payload: unknown, options: { onError: (e: ApiError) => void }) =>
      options.onError(failWith),
    googleLogin: vi.fn(),
    isPending: false,
    isGooglePending: false,
    totpRequired: false,
    submitTotpCode: vi.fn(),
    isVerifyingCode: false,
    totpError: null,
    cancelTotp: vi.fn(),
  }),
}));

vi.mock("@/components/passkey-sign-in-button", () => ({
  PasskeySignInButton: () => null,
}));

function signIn(error: ApiError) {
  failWith = error;
  const { container } = render(<LoginForm />);
  fireEvent.change(container.querySelector("#email")!, {
    target: { value: "owner@example.com" },
  });
  fireEvent.change(container.querySelector("#password")!, {
    target: { value: "a-wrong-guess" },
  });
  fireEvent.submit(container.querySelector("form")!);
  return toast.mock.calls.at(-1)?.[0];
}

describe("LoginForm errors", () => {
  beforeEach(() => {
    toast.mockClear();
    // The "keep me signed in" checkbox (Radix) measures itself; jsdom has no
    // ResizeObserver.
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  it("says the account is locked, not that the password is wrong", () => {
    const shown = signIn({
      message: "Too many failed sign-in attempts. Try again in 15 minutes.",
      status: 429,
      code: "SIGN_IN_LOCKED",
    });

    expect(shown.description).toBe("auth.login.lockedDescription");
  });

  it("tells a visitor over the per-network limit to wait a minute", () => {
    const shown = signIn({
      message: "Too many requests. Try again shortly.",
      status: 429,
      code: "RATE_LIMITED",
    });

    expect(shown.description).toBe("auth.login.rateLimitedDescription");
  });

  it("keeps the wrong-password message for a wrong password", () => {
    const shown = signIn({
      message: "Incorrect email or password",
      status: 401,
    });

    expect(shown.description).toBe("auth.login.failedDescription");
  });
});
