import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PasskeyDialog } from "./PasskeyDialog";

const { toast, logout } = vi.hoisted(() => ({
  toast: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));

// Registration succeeds: the browser ceremony and both API calls are behind
// this hook, so it answers as a finished registration would.
vi.mock("@/hooks/use-authentication", () => ({
  usePasskeys: () => ({ data: [], isPending: false }),
  useRegisterPasskey: () => ({
    isPending: false,
    mutate: (
      _name: string | undefined,
      options: { onSuccess: (created: { name: string }) => void },
    ) => options.onSuccess({ name: "MacBook Touch ID" }),
  }),
  useDeletePasskey: () => ({ isPending: false, mutate: vi.fn() }),
  useLogout: () => ({ isPending: false, mutate: logout }),
}));

vi.mock("@/lib/passkeys", () => ({
  isPasskeySupported: () => true,
  isPasskeyCancellation: () => false,
}));

// Echo translation keys so assertions read against stable identifiers rather
// than copy that may be reworded.
vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({
    locale: "en",
    setLocale: vi.fn(),
    t: (key: string) => key,
  }),
}));

async function addPasskey(secondFactorRequired: boolean) {
  render(
    <PasskeyDialog
      open
      onOpenChange={vi.fn()}
      secondFactorRequired={secondFactorRequired}
    />,
  );
  await userEvent.click(
    screen.getByRole("button", { name: "dashboard.security.passkeys.add" }),
  );
  return toast.mock.calls[0][0];
}

describe("PasskeyDialog, after adding a passkey", () => {
  beforeEach(() => vi.clearAllMocks());

  it("says the passkey can sign you in", async () => {
    const shown = await addPasskey(false);

    expect(shown.description).toBe("dashboard.security.passkeys.addedBody");
    expect(shown.action).toBeUndefined();
  });

  // Registering does not upgrade an admin's password-only session, so the
  // admin area stays locked until they sign in again with the passkey.
  it("tells an admin without a second factor to sign in again", async () => {
    const shown = await addPasskey(true);

    expect(shown.title).toBe("dashboard.security.passkeys.addedTitle");
    expect(shown.description).toBe("security.secondFactorRequired.toastBody");

    // fireEvent: the open modal sets pointer-events: none on everything
    // outside it, which the real toast layer escapes and this render does not.
    render(shown.action);
    fireEvent.click(
      screen.getByText("security.secondFactorRequired.signInAgain"),
    );
    expect(logout).toHaveBeenCalledTimes(1);
  });
});
