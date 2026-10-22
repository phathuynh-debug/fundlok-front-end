import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SecondFactorNotice } from "./SecondFactorNotice";

const logout = vi.fn();

vi.mock("@/hooks/use-authentication", () => ({
  useLogout: () => ({ mutate: logout, isPending: false }),
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

describe("SecondFactorNotice", () => {
  beforeEach(() => vi.clearAllMocks());

  it("tells an admin with no second factor to set one up", () => {
    render(<SecondFactorNotice hasSecondFactor={false} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "security.secondFactorRequired.title",
    );
    expect(
      screen.getByText("security.secondFactorRequired.setupBody"),
    ).toBeInTheDocument();
    // Signing in again before there is a factor would land them right back.
    expect(screen.queryByRole("button")).toBeNull();
  });

  // Enrolling does not upgrade the session, so an admin who has a factor has
  // to sign out and sign in again with it.
  it("offers to sign out once there is a factor to sign in with", async () => {
    render(<SecondFactorNotice hasSecondFactor />);

    expect(
      screen.getByText("security.secondFactorRequired.signInAgainBody"),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", {
        name: "security.secondFactorRequired.signInAgain",
      }),
    );
    expect(logout).toHaveBeenCalledTimes(1);
  });
});
