import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import enDictionary from "@/lib/i18n/en.json";
import type { Bank, ParsedVietQr } from "@/services/payment-accounts.service";
import { AddBankAccountDialog } from "./AddBankAccountDialog";

const BANKS: Bank[] = [
  {
    bin: "970407",
    code: "TCB",
    short_name: "Techcombank",
    name: "Ngân hàng TMCP Kỹ thương Việt Nam",
    kind: "BANK",
    popular: true,
    vietqr: true,
  },
  {
    bin: "970422",
    code: "MB",
    short_name: "MBBank",
    name: "Ngân hàng TMCP Quân đội",
    kind: "BANK",
    popular: true,
    vietqr: true,
  },
  {
    bin: "970425",
    code: "ABB",
    short_name: "ABBANK",
    name: "Ngân hàng TMCP An Bình",
    kind: "BANK",
    popular: false,
    vietqr: true,
  },
  {
    bin: "458761",
    code: "HSBC",
    short_name: "HSBC",
    name: "Ngân hàng TNHH MTV HSBC (Việt Nam)",
    kind: "BANK",
    popular: false,
    vietqr: false,
  },
];

const parseMutate = vi.fn();
const saveMutate = vi.fn();
const decodeQrImage = vi.fn();

vi.mock("@/hooks/use-payment-accounts", () => ({
  useBanks: () => ({ data: BANKS, isLoading: false }),
  useParseVietQr: () => ({ mutate: parseMutate, isPending: false }),
  useSavePaymentAccount: () => ({ mutate: saveMutate, isPending: false }),
}));

vi.mock("@/lib/decode-qr-image", () => ({
  decodeQrImage: (file: File) => decodeQrImage(file),
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

// Radix Popover and cmdk use browser APIs jsdom does not ship.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.scrollIntoView ??= vi.fn();
});

const PARSED: ParsedVietQr = {
  bank_bin: "970407",
  bank_name: "Techcombank",
  account_number: "19036789012",
  account_name: null,
};

function renderDialog() {
  return render(
    <AddBankAccountDialog
      open
      onOpenChange={vi.fn()}
      defaultHolderType="INDIVIDUAL"
    />,
  );
}

const qrImage = () => new File(["png"], "qr.png", { type: "image/png" });

describe("AddBankAccountDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fills bank and account number from the bank app's QR", async () => {
    const user = userEvent.setup();
    decodeQrImage.mockResolvedValue("000201010211PAYLOAD");
    parseMutate.mockImplementation((_payload, { onSuccess }) =>
      onSuccess({ ...PARSED, account_name: "NGUYEN VAN A" }),
    );
    renderDialog();

    await user.upload(screen.getByTestId("bank-qr-input"), qrImage());

    await waitFor(() =>
      expect(parseMutate).toHaveBeenCalledWith(
        "000201010211PAYLOAD",
        expect.anything(),
      ),
    );
    expect(screen.getByLabelText("Account number")).toHaveValue("19036789012");
    expect(screen.getByLabelText("Account holder name")).toHaveValue(
      "NGUYEN VAN A",
    );
    expect(screen.getByRole("combobox")).toHaveTextContent("Techcombank");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Filled in from your QR",
    );
  });

  it("says so when the image has no QR, without calling the server", async () => {
    const user = userEvent.setup();
    decodeQrImage.mockResolvedValue(null);
    renderDialog();

    await user.upload(screen.getByTestId("bank-qr-input"), qrImage());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No QR code found in that image.",
    );
    expect(parseMutate).not.toHaveBeenCalled();
  });

  it("explains a card or shop QR in its own words", async () => {
    const user = userEvent.setup();
    decodeQrImage.mockResolvedValue("000201...");
    parseMutate.mockImplementation((_payload, { onError }) =>
      onError({ message: "x", status: 400, code: "NOT_AN_ACCOUNT_QR" }),
    );
    renderDialog();

    await user.upload(screen.getByTestId("bank-qr-input"), qrImage());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That QR is for a card or a shop, not a bank account.",
    );
  });

  it("marks banks a VietQR cannot pay into", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("combobox"));
    const hsbc = (await screen.findByText("HSBC")).closest('[role="option"]');
    const mb = screen.getByText("MBBank").closest('[role="option"]');
    expect(hsbc).toHaveTextContent("No VietQR");
    expect(mb).not.toHaveTextContent("No VietQR");
  });

  it("saves a hand-entered account", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText("MBBank"));
    await user.type(screen.getByLabelText("Account number"), "0123 4567 89");
    await user.type(screen.getByLabelText("Account holder name"), "TRAN THI B");
    await user.click(screen.getByRole("button", { name: "Save account" }));

    await waitFor(() => expect(saveMutate).toHaveBeenCalledTimes(1));
    const [variables] = saveMutate.mock.calls[0];
    expect(variables).toEqual({
      bank_bin: "970422",
      other_bank_name: null,
      account_number: "0123456789",
      account_name: "TRAN THI B",
      holder_type: "INDIVIDUAL",
    });
  });

  it("saves an account at a bank outside the list by its typed name", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("combobox"));
    await user.type(screen.getByPlaceholderText("Search banks"), "zzz");
    await user.click(await screen.findByText("Other bank (not in the list)"));
    await user.type(
      screen.getByLabelText("Bank name"),
      "Quỹ tín dụng nhân dân Phú Thọ",
    );
    await user.type(screen.getByLabelText("Account number"), "555000111");
    await user.type(screen.getByLabelText("Account holder name"), "LE VAN C");
    await user.click(screen.getByRole("button", { name: "Save account" }));

    await waitFor(() => expect(saveMutate).toHaveBeenCalledTimes(1));
    expect(saveMutate.mock.calls[0][0]).toEqual({
      bank_bin: null,
      other_bank_name: "Quỹ tín dụng nhân dân Phú Thọ",
      account_number: "555000111",
      account_name: "LE VAN C",
      holder_type: "INDIVIDUAL",
    });
  });

  it("needs the name of a bank outside the list", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText("Other bank (not in the list)"));
    await user.type(screen.getByLabelText("Account number"), "555000111");
    await user.type(screen.getByLabelText("Account holder name"), "LE VAN C");
    await user.click(screen.getByRole("button", { name: "Save account" }));

    expect(
      await screen.findByText("Enter your bank's name."),
    ).toBeInTheDocument();
    expect(saveMutate).not.toHaveBeenCalled();
  });
});
