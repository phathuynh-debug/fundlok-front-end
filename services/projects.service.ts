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
  /**
   * Loan term in months. Optional because the backend has no column for it yet
   * — the SME form collects it and the API drops it (grading-input-sources spec
   * §3.3). The marketplace card shows "pending" until the column lands.
   */
  duration_months?: number | null;
  /**
   * Expected return for an investor, from the grading engine's priced rate.
   * Absent until POST /underwriting/score-runs actually calls grade() — today
   * it returns a hardcoded mock, so the card shows "pending grading" rather
   * than inventing a number.
   */
  interest_rate_pct?: number | null;
  purpose: string | null;
  repayment_preference: string | null;
  status: string;
  submitted_at: string | null;
  created_at: string | null;
  /**
   * The operator's reason for the decision, shown to the applicant once the
   * application is decided. Null while it is still under review, and null on
   * a decision the operator left unexplained.
   */
  decision_note: string | null;
  decided_at: string | null;
  documents: ApplicationDocument[];
  /**
   * Present once an operator has approved the request (status stays
   * UNDER_REVIEW: approval is one half of the two-approval gate). Carries the
   * stored score and rate the decision rests on. Optional: older responses
   * omit it.
   */
  approval?: LoanApproval | null;
}

/** The applicant-facing summary of an approval (backend LoanApprovalOut). */
export interface LoanApproval {
  approved_at: string | null;
  /** 0-100 business score — a reference input, never a credit rating. */
  business_score: number | null;
  /** All-in annual reference rate, % per year. */
  reference_rate_pct: number | null;
  duration_months: number | null;
  /** Principal plus flat interest, charged once (INV-2). */
  total_repayment_vnd: number | null;
  /** An estimate until the business-day calendar exists. */
  estimated_daily_repayment_vnd: number | null;
  engine_version: string | null;
  params_version: string | null;
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
