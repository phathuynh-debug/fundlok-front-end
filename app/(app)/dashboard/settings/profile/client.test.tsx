import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import enDictionary from "@/lib/i18n/en.json";
import { ProfileClient } from "./client";

const mockUser = {
  id: "user-1",
  full_name: "Phat Huynh",
  email: "tanphat.huynh23@gmail.com",
  phone: "0901234567",
  bio: "Software Engineer",
  email_signature: "Best regards,\nPhat",
  role: "SME",
  created_at: "2026-01-01T00:00:00.000Z",
  email_verified: true,
  has_password: true,
  avatar_url: null,
};

const mutateMock = vi.fn();

vi.mock("@/hooks/use-authentication", () => ({
  useCurrentUser: () => ({ data: mockUser }),
}));

vi.mock("@/hooks/use-users", () => ({
  useUpdateProfile: () => ({
    mutate: mutateMock,
    isPending: false,
  }),
  useSetPassword: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useUpdateAvatar: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("@/lib/i18n", () => {
  const getNested = (obj: unknown, path: string): unknown =>
    path.split(".").reduce<unknown>((acc, part) => {
      if (acc && typeof acc === "object" && part in acc) {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, obj);

  return {
    useTranslations: () => ({
      locale: "en",
      setLocale: vi.fn(),
      t: (key: string) => {
        const val = getNested(enDictionary, key);
        return typeof val === "string" ? val : key;
      },
    }),
  };
});

vi.mock("framer-motion", () => ({
  m: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
    header: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <header {...props}>{children}</header>
    ),
  },
}));

describe("ProfileClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders profile information and resolves emailSignature i18n keys correctly", () => {
    render(<ProfileClient />);

    expect(screen.getByText("Personal information")).toBeInTheDocument();
    expect(screen.getByText("Email signature")).toBeInTheDocument();
    expect(
      screen.queryByText("dashboard.settings.profile.emailSignature"),
    ).not.toBeInTheDocument();

    const sigTextarea = screen.getByLabelText(
      /Email signature/i,
    ) as HTMLTextAreaElement;
    expect(sigTextarea.value).toBe("Best regards,\nPhat");
  });

  it("disables 'Save changes' button when entering edit mode with no changes", async () => {
    const user = userEvent.setup();
    render(<ProfileClient />);

    const editBtn = screen.getByRole("button", { name: /Edit profile/i });
    await user.click(editBtn);

    const saveBtn = screen.getByRole("button", { name: /Save changes/i });
    expect(saveBtn).toBeDisabled();
  });

  it("enables 'Save changes' button when form is modified", async () => {
    const user = userEvent.setup();
    render(<ProfileClient />);

    await user.click(screen.getByRole("button", { name: /Edit profile/i }));
    const saveBtn = screen.getByRole("button", { name: /Save changes/i });
    expect(saveBtn).toBeDisabled();

    const nameInput = screen.getByDisplayValue("Phat Huynh");
    await user.type(nameInput, " Senior");

    expect(saveBtn).toBeEnabled();
  });

  it("disables 'Save changes' button again if changes are reverted back to initial values", async () => {
    const user = userEvent.setup();
    render(<ProfileClient />);

    await user.click(screen.getByRole("button", { name: /Edit profile/i }));
    const saveBtn = screen.getByRole("button", { name: /Save changes/i });
    expect(saveBtn).toBeDisabled();

    const nameInput = screen.getByDisplayValue("Phat Huynh");
    await user.type(nameInput, "!");
    expect(saveBtn).toBeEnabled();

    await user.type(nameInput, "{backspace}");
    expect(saveBtn).toBeDisabled();
  });

  it("calls mutate with updated values when saved", async () => {
    const user = userEvent.setup();
    render(<ProfileClient />);

    await user.click(screen.getByRole("button", { name: /Edit profile/i }));
    const sigInput = screen.getByLabelText(/Email signature/i);
    await user.clear(sigInput);
    await user.type(sigInput, "Cheers, Phat");

    const saveBtn = screen.getByRole("button", { name: /Save changes/i });
    expect(saveBtn).toBeEnabled();
    await user.click(saveBtn);

    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(mutateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email_signature: "Cheers, Phat",
      }),
      expect.any(Object),
    );
  });

  it("resets form and exits edit mode when cancelled", async () => {
    const user = userEvent.setup();
    render(<ProfileClient />);

    await user.click(screen.getByRole("button", { name: /Edit profile/i }));
    const nameInput = screen.getByDisplayValue("Phat Huynh");
    await user.type(nameInput, " Changed");

    const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
    await user.click(cancelBtn);

    // After cancel, back to read only
    expect(
      screen.getByRole("button", { name: /Edit profile/i }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Phat Huynh")).toBeInTheDocument();
  });
});
