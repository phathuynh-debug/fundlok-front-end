import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SecuritySettings } from "./SecuritySettings";

// What the security endpoints answer for the account under test.
const account = vi.hoisted(() => ({
  sessionsError: null as unknown,
  secondFactorRequired: false,
  totpEnabled: false,
  passkeys: [] as { id: string; name: string }[],
  signinAlertsEnabled: true,
}));

const savePreferences = vi.hoisted(() => vi.fn());

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
  useSecurityOverview: () => ({
    data: {
      second_factor_required: account.secondFactorRequired,
      two_factor: { enabled: account.totpEnabled },
      passkeys: account.passkeys,
      sessions: [],
      security_events: [],
      security_preferences: {
        signin_alerts_enabled: account.signinAlertsEnabled,
      },
    },
    isLoading: false,
    isFetched: true,
  }),
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
  useSecurityPreferences: () => ({
    data: { signin_alerts_enabled: account.signinAlertsEnabled },
    isLoading: false,
  }),
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
  useUpdateSecurityPreferences: () => ({
    ...mutation(),
    mutate: savePreferences,
  }),
  useChangePassword: mutation,
  useCurrentUser: () => ({ data: { has_password: true } }),
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

describe("SecuritySettings, sign-in alerts", () => {
  beforeEach(() => {
    account.sessionsError = null;
    account.totpEnabled = false;
    account.passkeys = [];
    account.signinAlertsEnabled = true;
    savePreferences.mockClear();
  });

  const alertsRow = () =>
    within(
      screen
        .getByText("dashboard.security.protections.items.loginAlerts")
        .closest("li") as HTMLElement,
    );

  it("warns before turning alerts off, and saves only once confirmed", async () => {
    const user = userEvent.setup();
    render(<SecuritySettings />);

    await user.click(
      alertsRow().getByRole("button", {
        name: "dashboard.security.protections.action.turnOff",
      }),
    );
    const dialog = await screen.findByRole("alertdialog");
    expect(
      within(dialog).getByText(
        "dashboard.security.protections.loginAlertsOff.body",
      ),
    ).toBeInTheDocument();
    expect(savePreferences).not.toHaveBeenCalled();

    await user.click(
      within(dialog).getByRole("button", {
        name: "dashboard.security.protections.loginAlertsOff.confirm",
      }),
    );
    expect(savePreferences).toHaveBeenCalledTimes(1);
    expect(savePreferences.mock.calls[0][0]).toEqual({
      signin_alerts_enabled: false,
    });
  });

  it("leaves alerts on when the warning is dismissed", async () => {
    const user = userEvent.setup();
    render(<SecuritySettings />);

    await user.click(
      alertsRow().getByRole("button", {
        name: "dashboard.security.protections.action.turnOff",
      }),
    );
    const dialog = await screen.findByRole("alertdialog");
    await user.click(
      within(dialog).getByRole("button", {
        name: "dashboard.security.protections.loginAlertsOff.keep",
      }),
    );
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(savePreferences).not.toHaveBeenCalled();
  });

  it("turns alerts back on with one click, no warning", async () => {
    account.signinAlertsEnabled = false;
    const user = userEvent.setup();
    render(<SecuritySettings />);

    await user.click(
      alertsRow().getByRole("button", {
        name: "dashboard.security.protections.action.turnOn",
      }),
    );
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(savePreferences.mock.calls[0][0]).toEqual({
      signin_alerts_enabled: true,
    });
  });
});
