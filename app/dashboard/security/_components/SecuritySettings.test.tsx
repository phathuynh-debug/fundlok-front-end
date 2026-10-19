import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

import { SecuritySettings } from "./SecuritySettings";

// What the security endpoints answer for the account under test.
const account = vi.hoisted(() => ({
  sessionsError: null as unknown,
  totpEnabled: false,
  passkeys: [] as { id: string; name: string }[],
}));

const mutation = vi.hoisted(() => () => ({
  mutate: vi.fn(),
  reset: vi.fn(),
  isPending: false,
  data: undefined,
  error: null,
  variables: undefined,
}));

vi.mock("@/hooks/use-authentication", () => ({
  useRequireAuth: () => ({ user: { role: "ADMIN" }, isLoading: false }),
  useSessions: () => ({
    data: undefined,
    isLoading: false,
    error: account.sessionsError,
  }),
  useSecurityEvents: () => ({
    data: [],
    isLoading: false,
    isFetching: false,
  }),
  useSecurityPreferences: () => ({ data: undefined, isLoading: false }),
  useTwoFactorStatus: () => ({
    data: { enabled: account.totpEnabled },
    isLoading: false,
  }),
  usePasskeys: () => ({
    data: account.passkeys,
    isLoading: false,
    isPending: false,
  }),
  useRevokeSession: mutation,
  useRevokeOtherSessions: mutation,
  useUpdateSecurityPreferences: mutation,
  useChangePassword: mutation,
  useStartTwoFactorSetup: mutation,
  useEnableTwoFactor: mutation,
  useDisableTwoFactor: mutation,
  useRegisterPasskey: mutation,
  useDeletePasskey: mutation,
  useLogout: mutation,
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

const MFA_REQUIRED = {
  message: "Admin accounts must sign in with a second factor.",
  status: 403,
  code: "MFA_REQUIRED",
};

describe("SecuritySettings, admin without a second factor", () => {
  beforeEach(() => {
    account.sessionsError = null;
    account.totpEnabled = false;
    account.passkeys = [];
  });

  it("explains the rule and offers only what gets them a second factor", () => {
    account.sessionsError = MFA_REQUIRED;
    render(<SecuritySettings />);

    expect(
      screen.getByText("security.secondFactorRequired.setupBody"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("dashboard.security.protections.items.totp"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("dashboard.security.protections.items.passkey"),
    ).toBeInTheDocument();
    // Refused until they sign in with a factor, so not shown as empty lists
    // and switches that fail.
    expect(
      screen.queryByText("dashboard.security.protections.items.loginAlerts"),
    ).toBeNull();
    expect(screen.queryByText("dashboard.security.sessions.title")).toBeNull();
  });

  it("asks them to sign in again once a factor is enrolled", () => {
    account.sessionsError = MFA_REQUIRED;
    account.passkeys = [{ id: "pk-1", name: "MacBook Touch ID" }];
    render(<SecuritySettings />);

    expect(
      screen.getByText("security.secondFactorRequired.signInAgainBody"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "security.secondFactorRequired.signInAgain",
      }),
    ).toBeInTheDocument();
  });

  it("shows the full screen to everyone else", () => {
    render(<SecuritySettings />);

    expect(screen.queryByRole("alert")).toBeNull();
    expect(
      screen.getByText("dashboard.security.sessions.title"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("dashboard.security.protections.items.loginAlerts"),
    ).toBeInTheDocument();
  });
});
