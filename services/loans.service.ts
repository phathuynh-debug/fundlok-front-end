import { apiClient } from "@/lib/api-client";
import { LOANS_ENDPOINTS } from "@/lib/endpoints";

export interface LoanApplicationSubmitResponse {
  id: string;
  status: string;
}

export const loansService = {
  async submitApplication(applicationId: string) {
    return apiClient.post<LoanApplicationSubmitResponse>(
      LOANS_ENDPOINTS.submit(applicationId),
    );
  },
};
