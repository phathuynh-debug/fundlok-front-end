import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { ComposeEmailCard } from "./ComposeEmailCard";

vi.mock("@/lib/i18n", () => ({
  useTranslations: () => ({
    locale: "vi",
    setLocale: vi.fn(),
    t: (key: string) => key,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/hooks/use-authentication", () => ({
  useCurrentUser: () => ({
    data: { id: "admin-1", email: "a@fundlok.com", full_name: "Admin" },
  }),
}));

vi.mock("@/hooks/use-admin-email", () => ({
  useEmailSettings: () => ({
    data: { configured: true, enabled: true, gmail_address: "a@fundlok.com" },
  }),
  useEmailPolicy: () => ({ data: { allowed_domains: [] } }),
  usePreviewEmail: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSendEmail: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

// The recipients field has its own data hooks; not under test here.
vi.mock("./RecipientsField", () => ({
  RecipientsField: () => null,
}));

const presetButton = (id: string) =>
  screen.getByRole("button", {
    // Title and hint spans join into one accessible name.
    name: new RegExp(`^admin\\.email\\.compose\\.presets\\.${id}`),
  });

const subject = () =>
  screen.getByLabelText("admin.email.compose.subjectLabel") as HTMLInputElement;

describe("ComposeEmailCard predefined content", () => {
  it("fills the form in the chosen language", () => {
    render(<ComposeEmailCard />);

    fireEvent.click(presetButton("investor_onboarding"));
    expect(subject().value).toMatch(/^Chào mừng bạn đến với FundLok/);
    expect(document.getElementById("compose-body")?.innerHTML).toContain(
      "Xin chào Quý nhà đầu tư,",
    );
    expect(
      (
        screen.getByLabelText(
          "admin.email.compose.buttonUrlLabel",
        ) as HTMLInputElement
      ).value,
    ).toMatch(/^https:\/\/.+\/kyc$/);
  });

  it("asks before replacing what was written, and keeps it on cancel", () => {
    render(<ComposeEmailCard />);
    fireEvent.change(subject(), { target: { value: "My own subject" } });

    fireEvent.click(
      screen.getByRole("radio", {
        name: "admin.email.compose.presets.languages.en",
      }),
    );
    fireEvent.click(presetButton("sme_onboarding"));

    expect(
      screen.getByText("admin.email.compose.presets.replaceTitle"),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "common.cancel" }));
    expect(subject().value).toBe("My own subject");

    fireEvent.click(presetButton("sme_onboarding"));
    fireEvent.click(
      screen.getByRole("button", {
        name: "admin.email.compose.presets.replace",
      }),
    );
    expect(subject().value).toBe(
      "Welcome to FundLok – start raising capital in 2 steps",
    );
  });
});
