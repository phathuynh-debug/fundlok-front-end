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
  },
  {
    bin: "970422",
    code: "MB",
    short_name: "MBBank",
    name: "Ngân hàng TMCP Quân đội",
    kind: "BANK",
    popular: true,
  },
  {
    bin: "970425",
    code: "ABB",
    short_name: "ABBANK",
    name: "Ngân hàng TMCP An Bình",
    kind: "BANK",
    popular: false,
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
const statementPdf = () =>
  new File(["%PDF"], "statement.pdf", { type: "application/pdf" });

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

  it("requires a statement before saving", async () => {
    const user = userEvent.setup();
    decodeQrImage.mockResolvedValue("PAYLOAD");
    parseMutate.mockImplementation((_payload, { onSuccess }) =>
      onSuccess(PARSED),
    );
    renderDialog();

    await user.upload(screen.getByTestId("bank-qr-input"), qrImage());
    await user.type(
      screen.getByLabelText("Account holder name"),
      "NGUYEN VAN A",
    );
    await user.click(screen.getByRole("button", { name: "Save account" }));

    expect(
      await screen.findByText(
        "Upload a bank statement or confirmation letter.",
      ),
    ).toBeInTheDocument();
    expect(saveMutate).not.toHaveBeenCalled();
  });

  it("saves a hand-entered account with the statement", async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderDialog();

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText("MBBank"));
    await user.type(screen.getByLabelText("Account number"), "0123 4567 89");
    await user.type(screen.getByLabelText("Account holder name"), "TRAN THI B");
    await user.click(screen.getByLabelText("Bank confirmation letter"));
    await user.upload(
      screen.getByTestId("bank-statement-input"),
      statementPdf(),
    );
    await user.click(screen.getByRole("button", { name: "Save account" }));

    await waitFor(() => expect(saveMutate).toHaveBeenCalledTimes(1));
    const [variables] = saveMutate.mock.calls[0];
    expect(variables).toMatchObject({
      bank_bin: "970422",
      account_number: "0123456789",
      account_name: "TRAN THI B",
      holder_type: "INDIVIDUAL",
      statementPurpose: "BANK_CONFIRMATION",
    });
    expect(variables.statement.name).toBe("statement.pdf");
  });

  it("refuses a statement of the wrong type", async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderDialog();

    await user.upload(
      screen.getByTestId("bank-statement-input"),
      new File(["x"], "notes.txt", { type: "text/plain" }),
    );

    expect(
      await screen.findByText("Please choose a PDF, JPG, PNG or WebP file."),
    ).toBeInTheDocument();
  });
});
