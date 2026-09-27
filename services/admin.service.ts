import { apiClient } from "@/lib/api-client";
import { ADMIN_ENDPOINTS } from "@/lib/endpoints";

// Which table the BFF /admin/overview endpoint should return alongside stats.
export type AdminMode = "users" | "projects";

// Mirrors backend get_stats().
// The *_by_* maps only contain keys that exist in the DB — a bucket with zero
// rows is absent, not 0. Read defensively (map[key] ?? 0); never assume keys.
export interface AdminStats {
  total_users: number;
  total_projects: number;
  users_by_role: Record<string, number>;
  users_by_status: Record<string, number>;
  projects_by_status: Record<string, number>;
}

// A row in the users table (mode=users).
export interface AdminUserRow {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  email_verified?: boolean;
  avatar_url?: string | null;
  created_at?: string | null;
}

// A row in the projects table (mode=projects).
export interface AdminProjectRow {
  id: string;
  legal_name: string;
  industry: string;
  status: string;
  created_at?: string | null;
}

export type AdminTableRow = AdminUserRow | AdminProjectRow;

// Paginated table envelope. `items` holds the rows; the rest drives paging.
export interface AdminTable<T = AdminTableRow> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// One-shot BFF payload: stats + whichever table was requested.
export interface AdminOverview {
  stats: AdminStats;
  mode: AdminMode;
  table: AdminTable;
}

export interface AdminOverviewParams {
  mode?: AdminMode;
  page?: number;
  page_size?: number;
  search?: string | null;
  status?: string | null;
  role?: string | null;
  industry?: string | null;
}

// A resolved user reference on an audit log (ActorOut on the backend).
export interface AuditUserRef {
  id: string;
  full_name: string;
  email: string;
}

// Mirrors backend AuditLogOut.
export interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  actor_id: string | null;
  // Who performed the action.
  actor: AuditUserRef | null;
  // The subject user — only populated when entity_type === "USER".
  entity_user: AuditUserRef | null;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string | null;
}

export interface AuditLogParams {
  entity_type?: string | null;
  entity_id?: string | null;
  actor_id?: string | null;
  // ISO timestamps for the backend's created_after / created_before filters.
  created_after?: string | null;
  created_before?: string | null;
  limit?: number;
}

// Mirrors backend MaintenanceState.
export interface MaintenanceState {
  enabled: boolean;
  message: string | null;
  updated_at?: string | null;
  updated_by?: string | null;
}

// Body for PUT /admin/system/maintenance (MaintenanceUpdate).
export interface MaintenanceUpdate {
  enabled: boolean;
  message?: string | null;
}

// --- Project preview: the two-approval gate ------------------------------- //
//
// A funding request needs BOTH the verification engine's approval (GVerify KYB,
// plus a locked score run) and an operator's. The preview shows both so it is
// clear WHY an application has not moved.

/** What an operator can decide. There is no way back to PENDING. */
export type AdminDecision = "APPROVED" | "REJECTED";

/** PENDING until someone decides; server-side CHECK constraint enforces it. */
export type AdminApproval = "PENDING" | AdminDecision;

// The engine's half. `status` is the provider's own verdict — MANUAL_REVIEW is
// the only one an operator may resolve.
export interface AdminKybVerification {
  id: string;
  status: string;
  is_approved: boolean;
  rejection_reason: string | null;
  business_name: string | null;
  tax_code: string | null;
  updated_at: string | null;
}

// One file the SME uploaded on the loan-application wizard. Metadata only —
// there is no download endpoint yet, so the panel shows WHAT was supplied
// rather than pretending to offer the file.
export interface AdminApplicationDocument {
  id: string;
  // Backend document_type: legal_charter | business_registration |
  // e_invoice_data | cic_report. Rendered through an i18n lookup.
  document_type: string;
  original_filename: string;
  content_type: string | null;
  file_size_bytes: number | null;
  // PENDING = presigned but never confirmed in storage; UPLOADED = HEAD-checked.
  status: string;
  uploaded_at: string | null;
}

// What the grading engine produced. `status` is the run's lifecycle
// (RUNNING | READY | LOCKED | FAILED); `decision` is the grading OUTCOME
// (APPROVED | REVIEW | REJECT | INSUFFICIENT_DATA | AI_PENDING). They are not
// the same thing — a LOCKED run that decided REVIEW is not an approval.
export interface AdminScoreRun {
  id: string;
  status: string;
  decision: string | null;
  /** 0-100 internal assessment, full precision. */
  final_grade: number | null;
  /** All-in annual rate the score implies, capped at the 20% ceiling. */
  interest_rate_pct: number | null;
  engine_version: string | null;
  params_version: string | null;
  created_at: string | null;
  /**
   * On an INSUFFICIENT_DATA run: the grading inputs still missing now (e.g.
   * "kyc_aml_passed"), so the panel can say why there is no score. Optional:
   * older responses omit it.
   */
  missing_inputs?: string[];
}

export interface AdminLoanApplication {
  id: string;
  // Integer VND. The column is Numeric(20, 0) and the API serialises it as an
  // int for that reason — do not coerce it through a float.
  requested_amount: number;
  purpose: string | null;
  repayment_preference: string | null;
  status: string;
  admin_approval: AdminApproval;
  submitted_at: string | null;
  decided_at: string | null;
  decision_note: string | null;
  created_at: string | null;
  documents: AdminApplicationDocument[];
  /** Null until the engine has run — no run means no opinion, not a zero. */
  score_run: AdminScoreRun | null;
}

export interface AdminProjectDetail {
  id: string;
  legal_name: string;
  tax_id: string | null;
  industry: string | null;
  status: string;
  // The raw JSONB the SME filled in on the project application — no
  // server-side schema, so it is read defensively where rendered.
  address: Record<string, unknown> | null;
  incorporation_date: string | null;
  created_at: string | null;
  applications: AdminLoanApplication[];
  kyb: AdminKybVerification | null;
}

// Account statuses. Only SUSPENDED denies — the backend rejects a suspended
// account on every request AND at login. PENDING_KYC is a normal onboarding
// state and stays permissive.
export type AdminUserStatus = "ACTIVE" | "PENDING_KYC" | "SUSPENDED";

export interface AdminUserDetail {
  id: string;
  email: string;
  full_name: string | null;
  role: string | null;
  status: AdminUserStatus;
  email_verified: boolean;
  created_at: string | null;
}

export interface AdminUserStatusPayload {
  status: AdminUserStatus;
  note?: string | null;
}

export interface AdminDocumentUrl {
  url: string;
  /** Seconds the URL stays valid — 600. */
  expires_in: number;
  content_type: string | null;
  original_filename: string;
}

export interface AdminDecisionPayload {
  decision: AdminDecision;
  note?: string | null;
}

export const adminService = {
  getOverview(params: AdminOverviewParams = {}) {
    return apiClient.get<AdminOverview>(ADMIN_ENDPOINTS.overview, { params });
  },

  // Admin only. One company, its funding requests, and the owner's latest KYB.
  getProjectDetail(projectId: string) {
    return apiClient.get<AdminProjectDetail>(
      ADMIN_ENDPOINTS.projectDetail(projectId),
    );
  },

  // Admin only. Settles a KYB attempt the engine parked in MANUAL_REVIEW;
  // 409 if it was already decided by the provider.
  resolveKybVerification(verificationId: string, body: AdminDecisionPayload) {
    return apiClient.post<AdminKybVerification>(
      ADMIN_ENDPOINTS.resolveKybVerification(verificationId),
      body,
    );
  },

  // Admin only. The operator half of the gate; 409 if already decided.
  decideApplication(applicationId: string, body: AdminDecisionPayload) {
    return apiClient.post<AdminLoanApplication>(
      ADMIN_ENDPOINTS.applicationDecision(applicationId),
      body,
    );
  },

  // Admin only. Two server-side guards beyond the role check: nobody may
  // change their own status (self-suspension is unrecoverable), and only a
  // SYSTEM_ADMIN may act on an admin-level account.
  setUserStatus(userId: string, body: AdminUserStatusPayload) {
    return apiClient.patch<AdminUserDetail>(
      ADMIN_ENDPOINTS.userStatus(userId),
      body,
    );
  },

  // Admin only. Fetched on demand when a document is opened, never up front:
  // the URL expires in 10 minutes, so one minted with the list would often be
  // dead by the time anyone clicked it.
  getDocumentUrl(documentId: string) {
    return apiClient.get<AdminDocumentUrl>(
      ADMIN_ENDPOINTS.documentUrl(documentId),
    );
  },

  // Admin only — returns a flat list (not paginated), newest first.
  getAuditLogs(params: AuditLogParams = {}) {
    return apiClient.get<AuditLog[]>(ADMIN_ENDPOINTS.auditLogs, { params });
  },

  // System-admin only.
  getMaintenance() {
    return apiClient.get<MaintenanceState>(ADMIN_ENDPOINTS.maintenance);
  },

  setMaintenance(body: MaintenanceUpdate) {
    return apiClient.put<MaintenanceState>(ADMIN_ENDPOINTS.maintenance, body);
  },
};
