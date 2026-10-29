import { apiClient } from "@/lib/api-client";
import { PAYMENT_ACCOUNT_ENDPOINTS } from "@/lib/endpoints";

// Mirrors backend BankOut (GET /direct-transfer/banks). `bin` is the NAPAS bank
// code the account is saved with; never let the user type it.
export interface Bank {
  bin: string;
  code: string;
  short_name: string;
  name: string;
  kind: "BANK" | "WALLET";
  popular: boolean;
  // False for banks a VietQR cannot pay into (HSBC, Citibank, …): an account
  // there can be saved, but it gets no QR.
  vietqr: boolean;
}

export type PaymentAccountStatus = "PENDING" | "APPROVED" | "REJECTED";
export type HolderType = "INDIVIDUAL" | "ENTITY";

// Mirrors backend PaymentAccountOut.
export interface PaymentAccount {
  id: string;
  holder_role: "SME" | "INVESTOR";
  holder_type: HolderType;
  bank_bin: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: PaymentAccountStatus;
  rejection_reason: string | null;
  created_at: string;
  approved_at: string | null;
}

// Mirrors backend PaymentAccountCreate (POST /payment-accounts). The holder's
// role is taken from the signed-in user, and the bank name from the bank list.
export interface CreatePaymentAccountRequest {
  holder_type: HolderType;
  bank_bin: string;
  account_number: string;
  account_name: string;
}

export interface VietQr {
  payload: string;
}

// What the backend read from a bank-app QR, to pre-fill the form.
export interface ParsedVietQr {
  bank_bin: string;
  bank_name: string;
  account_number: string;
  account_name: string | null;
}

export const paymentAccountsService = {
  // GET /direct-transfer/banks — popular banks first, then A–Z. Static data.
  listBanks() {
    return apiClient.get<Bank[]>(PAYMENT_ACCOUNT_ENDPOINTS.banks);
  },

  // GET /payment-accounts — the caller's own accounts, oldest first.
  listPaymentAccounts() {
    return apiClient.get<PaymentAccount[]>(PAYMENT_ACCOUNT_ENDPOINTS.list);
  },

  // POST /payment-accounts — saves the account as PENDING.
  createPaymentAccount(payload: CreatePaymentAccountRequest) {
    return apiClient.post<PaymentAccount>(
      PAYMENT_ACCOUNT_ENDPOINTS.create,
      payload,
    );
  },

  // POST /payment-accounts/parse-vietqr — `payload` is the decoded QR text.
  parseVietQr(payload: string) {
    return apiClient.post<ParsedVietQr>(PAYMENT_ACCOUNT_ENDPOINTS.parseVietQr, {
      payload,
    });
  },

  // GET /payment-accounts/{id}/vietqr — a static VietQR for the saved account.
  getVietQr(id: string) {
    return apiClient.get<VietQr>(PAYMENT_ACCOUNT_ENDPOINTS.vietQr(id));
  },
};
