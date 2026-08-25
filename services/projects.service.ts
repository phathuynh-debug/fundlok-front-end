import { apiClient } from "@/lib/api-client";
import { PROJECT_ENDPOINTS } from "@/lib/endpoints";
import type { CompanySize } from "@/lib/constants/company-size";
import type { ApplicationDocument } from "@/services/uploads.service";

export interface ProjectAddress {
  street: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
}

// Mirrors backend ProjectLoanApplicationOut (nested under the project).
export interface ProjectLoanApplication {
  id: string;
  project_id: string;
  // Decimal on the backend — serialized as a JSON string by FastAPI.
  requested_amount: string | number;
  purpose: string | null;
  repayment_preference: string | null;
  status: string;
  submitted_at: string | null;
  created_at: string | null;
  documents: ApplicationDocument[];
}

export interface Project {
  id: string;
  legal_name: string;
  tax_id: string;
  industry: string;
  address: Record<string, unknown>;
  incorporation_date: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  loan_application?: ProjectLoanApplication | null;
}

// Mirrors backend LoanApplicationCreateInline: a DRAFT loan application is
// created in the same request as the project.
export interface CreateLoanApplicationPayload {
  requested_amount: number;
  /**
   * Loan term in months, one of 3 / 6 / 9 / 12 — the grading engine's
   * `allowed_durations_months`. The backend has no column for this yet
   * (`loan_applications` stores amount, purpose and repayment_preference only)
   * and Pydantic drops unknown fields, so this is sent but not yet persisted.
   * See lib/constants/loan-constraints.ts.
   */
  duration_months: number;
  purpose?: string | null;
  repayment_preference?: string | null;
}

export interface CreateProjectPayload {
  legal_name: string;
  tax_id: string;
  industry: string;
  /**
   * Headcount as entered by the SME, and the band derived from it. The grading
   * engine takes `company_size` (one of micro / small / medium, per
   * `company_sizes` in grading_params_v1.yaml) and never a raw count, but the
   * count is what the applicant actually knows — so both are sent.
   *
   * Neither is persisted yet: `projects` has no column for either and Pydantic
   * drops unknown fields. See lib/constants/company-size.ts.
   */
  employee_count: number;
  company_size: CompanySize;
  incorporation_date: string;
  address: ProjectAddress;
  loan_application?: CreateLoanApplicationPayload | null;
}

export const projectsService = {
  getMyProjects() {
    return apiClient.get<Project[]>(PROJECT_ENDPOINTS.list);
  },

  getPublicProjects() {
    return apiClient.get<Project[]>(PROJECT_ENDPOINTS.public);
  },

  createProject(payload: CreateProjectPayload) {
    return apiClient.post<Project>(PROJECT_ENDPOINTS.create, payload);
  },
};
