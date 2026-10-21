import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TwoFactorSetupDialog } from "./TwoFactorSetupDialog";

// Starting setup needs the account password (lib/step-up.ts): an authenticator
// enrolled from a stolen session locks the owner out of an account without
// 2FA. Accounts with no password skip the step and start on open.
const { account, startSetup, setupState } = vi.hoisted(() => ({
  account: { has_password: true },
  startSetup: vi.fn(),
  setupState: { error: null as unknown },
}));

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

vi.mock("@/hooks/use-authentication", () => ({
  useCurrentUser: () => ({ data: account }),
  useStartTwoFactorSetup: () => ({
    mutate: startSetup,
    data: undefined,
    isPending: false,
    error: setupState.error,
    reset: vi.fn(),
  }),
  useEnableTwoFactor: () => ({ mutate: vi.fn(), isPending: false }),
  useLogout: () => ({ isPending: false, mutate: vi.fn() }),
}));

vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({
    locale: "en",
    setLocale: vi.fn(),
    t: (key: string) => key,
  }),
}));

describe("TwoFactorSetupDialog step-up", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // clearAllMocks keeps implementations; the wrong-password test sets one.
    startSetup.mockReset();
    account.has_password = true;
    setupState.error = null;
  });

  it("asks for the password before minting a secret", async () => {
    render(<TwoFactorSetupDialog open onOpenChange={vi.fn()} />);

    expect(startSetup).not.toHaveBeenCalled();
    await userEvent.type(
      screen.getByLabelText("security.stepUp.passwordLabel"),
      "correct horse",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "security.stepUp.continue" }),
    );

    expect(startSetup).toHaveBeenCalledWith(
      "correct horse",
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it("shows a wrong password on the password step", async () => {
    startSetup.mockImplementation(
      (_password: string, options: { onError: (e: unknown) => void }) =>
        options.onError({ message: "Password is incorrect", status: 400 }),
    );
    render(<TwoFactorSetupDialog open onOpenChange={vi.fn()} />);

    await userEvent.type(
      screen.getByLabelText("security.stepUp.passwordLabel"),
      "guess",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "security.stepUp.continue" }),
    );

    expect(screen.getByText("Password is incorrect")).toBeInTheDocument();
  });

  it("starts at once for an account without a password", () => {
    account.has_password = false;
    render(<TwoFactorSetupDialog open onOpenChange={vi.fn()} />);

    expect(startSetup).toHaveBeenCalledWith(undefined);
    expect(
      screen.queryByLabelText("security.stepUp.passwordLabel"),
    ).not.toBeInTheDocument();
  });

  it("tells an account without a password to sign in again when its session is old", () => {
    account.has_password = false;
    setupState.error = { code: "REAUTH_REQUIRED", message: "x", status: 403 };
    render(<TwoFactorSetupDialog open onOpenChange={vi.fn()} />);

    expect(
      screen.getByText("security.stepUp.reauthRequired"),
    ).toBeInTheDocument();
    // Retrying cannot help: only a fresh sign-in does.
    expect(
      screen.queryByRole("button", { name: /security.twoFactor.retry/ }),
    ).not.toBeInTheDocument();
  });
});
