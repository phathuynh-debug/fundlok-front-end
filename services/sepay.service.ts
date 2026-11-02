import { apiClient } from "@/lib/api-client";
import { SEPAY_ENDPOINTS } from "@/lib/endpoints";

export type SepayConnectionStatus = "ACTIVE" | "NEEDS_RECONNECT";

// Mirrors backend SepayStatusOut (GET /integrations/sepay).
export interface SepayStatus {
  // False until FundLok's SePay app is set up on the server; hide the feature.
  configured: boolean;
  connected: boolean;
  status: SepayConnectionStatus | null;
  connected_at: string | null;
  scopes: string[];
}

export interface SepayConnectStart {
  authorize_url: string;
}

// The query parameters SePay sends back to the callback page.
export interface SepayCallbackPayload {
  code: string;
  state: string;
}

// Mirrors backend SepayBankAccountOut. The balance is never sent.
export interface SepayBankAccount {
  id: number;
  label: string | null;
  account_number: string;
  account_holder_name: string | null;
  bank_short_name: string | null;
  bank_full_name: string | null;
  bank_bin: string | null;
  bank_logo_url: string | null;
  active: boolean;
}

export const sepayService = {
  // GET /integrations/sepay — whether the user has a connection.
  getStatus() {
    return apiClient.get<SepayStatus>(SEPAY_ENDPOINTS.status);
  },

  // POST /integrations/sepay/connect — the SePay approval URL to send the user to.
  startConnect() {
    return apiClient.post<SepayConnectStart>(SEPAY_ENDPOINTS.connect);
  },

  // POST /integrations/sepay/callback — trades SePay's code for tokens (server-side).
  finishConnect(payload: SepayCallbackPayload) {
    return apiClient.post<SepayStatus>(SEPAY_ENDPOINTS.callback, payload);
  },

  // GET /integrations/sepay/bank-accounts — accounts linked in SePay.
  listBankAccounts() {
    return apiClient.get<SepayBankAccount[]>(SEPAY_ENDPOINTS.bankAccounts);
  },

  // DELETE /integrations/sepay — forgets the tokens on our side.
  disconnect() {
    return apiClient.delete<void>(SEPAY_ENDPOINTS.disconnect);
  },
};
