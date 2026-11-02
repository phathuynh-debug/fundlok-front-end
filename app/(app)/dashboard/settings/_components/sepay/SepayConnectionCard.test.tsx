import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import enDictionary from "@/lib/i18n/en.json";
import type { SepayBankAccount, SepayStatus } from "@/services/sepay.service";
import { SepayConnectionCard } from "./SepayConnectionCard";

const statusState: { data?: SepayStatus; isLoading: boolean } = {
  isLoading: false,
};
const accountsState: {
  data?: SepayBankAccount[];
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: null;
} = {
  data: [],
  isLoading: false,
  isError: false,
  isSuccess: true,
  error: null,
};
const startMutate = vi.fn();
const accountsEnabled = vi.fn();

vi.mock("@/hooks/use-sepay", () => ({
  useSepayStatus: () => statusState,
  useSepayBankAccounts: (enabled: boolean) => {
    accountsEnabled(enabled);
    return accountsState;
  },
  useStartSepayConnect: () => ({
    mutate: startMutate,
    isPending: false,
    isSuccess: false,
  }),
  useDisconnectSepay: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
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
      t: (key: string, vars?: Record<string, string | number>) => {
        const val = getNested(enDictionary, key);
        if (typeof val !== "string") return key;
        return Object.entries(vars ?? {}).reduce(
          (text, [name, value]) => text.replace(`{${name}}`, String(value)),
          val,
        );
      },
    }),
  };
});

const status = (overrides: Partial<SepayStatus>): SepayStatus => ({
  configured: true,
  connected: false,
  status: null,
  connected_at: null,
  scopes: [],
  ...overrides,
});

describe("SepayConnectionCard", () => {
  beforeEach(() => {
    startMutate.mockReset();
    accountsEnabled.mockReset();
    accountsState.data = [];
  });

  it("renders nothing until the server has SePay configured", () => {
    statusState.data = status({ configured: false });
    const { container } = render(<SepayConnectionCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it("offers to connect and explains what is shared", async () => {
    statusState.data = status({});
    render(<SepayConnectionCard />);
    expect(screen.getByText(/read-only access/)).toBeInTheDocument();
    expect(accountsEnabled).toHaveBeenLastCalledWith(false);

    await userEvent.click(
      screen.getByRole("button", { name: /connect sepay/i }),
    );
    expect(startMutate).toHaveBeenCalledTimes(1);
  });

  it("lists linked bank accounts once connected", () => {
    statusState.data = status({
      connected: true,
      status: "ACTIVE",
      connected_at: "2026-10-30T09:00:00Z",
    });
    accountsState.data = [
      {
        id: 7,
        label: null,
        account_number: "123123123123",
        account_holder_name: "HUYNH TAN PHAT",
        bank_short_name: "VietinBank",
        bank_full_name: null,
        bank_bin: "970415",
        bank_logo_url: null,
        active: true,
      },
    ];
    render(<SepayConnectionCard />);
    expect(screen.getByText("VietinBank")).toBeInTheDocument();
    expect(screen.getByText("123123123123")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /disconnect/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /connect sepay/i }),
    ).not.toBeInTheDocument();
  });

  it("asks to reconnect when the connection expired", () => {
    statusState.data = status({ connected: true, status: "NEEDS_RECONNECT" });
    render(<SepayConnectionCard />);
    expect(screen.getByRole("alert")).toHaveTextContent(/expired/);
    expect(
      screen.getByRole("button", { name: /reconnect sepay/i }),
    ).toBeInTheDocument();
    expect(accountsEnabled).toHaveBeenLastCalledWith(false);
  });
});
