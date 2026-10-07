// The accounts the E2E suite signs in as, and the data the stub API serves for
// each one.
//
// A test authenticates by setting the `access_token` cookie to one of these
// keys (see e2e/support/auth.ts). The stub reads that cookie and answers
// /users/me — and everything else — as that user. This is what lets the suite
// exercise the proxy's real role/verification gating without a database.

export type StubUserKey =
  | "investor"
  | "sme"
  | "smeNoProject"
  | "admin"
  | "systemAdmin"
  | "unverifiedEmail"
  | "noRole"
  | "unapprovedInvestor"
  | "unapprovedInvestorTab"
  | "unapprovedInvestorCamera"
  | "unapprovedSme"
  | "unapprovedSmeIdentity"
  | "smeDraftApplication"
  | "smeRejectedApplication"
  | "smeApprovedApplication"
  | "twoFactor"
  | "suspended"
  | "expiredSession";

export interface StubUser {
  id: string;
  email: string;
  full_name: string;
  /** Absent for the roleless account, which the proxy sends to /select-role. */
  role?: "INVESTOR" | "SME" | "ADMIN" | "SYSTEM_ADMIN";
  email_verified: boolean;
  /** Drives /gverify/{kyc,kyb}/status — the proxy's on-demand action gate. */
  is_approved: boolean;
  avatar_url: string | null;
  /**
   * What the KYB certificate OCR read off this SME's business registration.
   * Only set where a test needs the project application's prefill; absent
   * means the status endpoint reports the fields as null, which is itself a
   * case worth covering.
   */
  kyb?: {
    business_name: string;
    tax_code: string;
    /** Verbatim single line, exactly as the real provider returns it. */
    company_address: string;
    date_of_establishment: string;
  };
}

const base = {
  full_name: "E2E Test User",
  email_verified: true,
  is_approved: true,
  avatar_url: null,
} as const;

export const STUB_USERS: Record<StubUserKey, StubUser> = {
  investor: {
    ...base,
    id: "00000000-0000-0000-0000-0000000000a1",
    email: "investor@e2e.test",
    full_name: "Investor Test",
    role: "INVESTOR",
  },
  sme: {
    ...base,
    id: "00000000-0000-0000-0000-0000000000a2",
    email: "sme@e2e.test",
    full_name: "SME Test",
    role: "SME",
  },
  // An SME whose application is still DRAFT, so the dashboard renders the
  // application wizard rather than the read-only status panel. Kept separate
  // from `sme` so the existing SUBMITTED-state tests are unaffected.
  smeDraftApplication: {
    ...base,
    id: "00000000-0000-0000-0000-0000000000a9",
    email: "sme-draft@e2e.test",
    full_name: "SME With Draft",
    role: "SME",
  },
  // The refused outcome. Its own account because the status panel is driven
  // by the application's status, and the SUBMITTED-state tests must keep
  // seeing "awaiting review".
  smeRejectedApplication: {
    ...base,
    id: "00000000-0000-0000-0000-0000000000aa",
    email: "sme-rejected@e2e.test",
    full_name: "SME Refused",
    role: "SME",
  },
  // An operator-approved request: `status` stays UNDER_REVIEW (approval is
  // one half of the gate) and the outcome arrives as `approval`.
  smeApprovedApplication: {
    ...base,
    id: "00000000-0000-0000-0000-0000000000ab",
    email: "sme-approved@e2e.test",
    full_name: "SME Approved",
    role: "SME",
  },
  // Same role, but /projects comes back empty — the dashboard's "apply for
  // funding" empty state.
  smeNoProject: {
    ...base,
    id: "00000000-0000-0000-0000-0000000000a3",
    email: "sme-empty@e2e.test",
    full_name: "SME Without Project",
    role: "SME",
    // Shaped after a real certificate: the address arrives as one line with
    // the province last behind a "Tỉnh" prefix, and carries no postal code.
    kyb: {
      business_name: "CÔNG TY CỔ PHẦN FUNDLOK",
      tax_code: "1501167629",
      company_address:
        "Thửa đất số 7, Khóm Thuận Tiến B, Phường Bình Minh, Tỉnh Vĩnh Long, Việt Nam",
      date_of_establishment: "15/03/2019",
    },
  },
  admin: {
    ...base,
    id: "00000000-0000-0000-0000-0000000000a4",
    email: "admin@e2e.test",
    role: "ADMIN",
  },
  systemAdmin: {
    ...base,
    id: "00000000-0000-0000-0000-0000000000a5",
    email: "sysadmin@e2e.test",
    role: "SYSTEM_ADMIN",
  },
  unverifiedEmail: {
    ...base,
    id: "00000000-0000-0000-0000-0000000000a6",
    email: "unverified@e2e.test",
    role: "INVESTOR",
    email_verified: false,
  },
  noRole: {
    ...base,
    id: "00000000-0000-0000-0000-0000000000a7",
    email: "norole@e2e.test",
  },
  // Dedicated to the 2FA spec. That spec MUTATES stub state (enrolment is a
  // state machine), and the stub is one process shared by every parallel
  // worker — so enrolling `investor` would have switched 2FA on for every
  // other spec that signs in as them. Its own identity keeps that contained.
  twoFactor: {
    ...base,
    id: "00000000-0000-0000-0000-0000000000b1",
    email: "twofactor@e2e.test",
    full_name: "Two Factor Test",
    role: "INVESTOR",
  },
  // Verification-gate cases: role is fine, KYC/KYB is not approved, so the
  // action routes (/dashboard/invest, /project-application) must divert to /kyc.
  unapprovedInvestor: {
    ...base,
    id: "00000000-0000-0000-0000-0000000000a8",
    email: "unapproved-investor@e2e.test",
    role: "INVESTOR",
    is_approved: false,
  },
  // Verifies during the two-tab KYC test only, so parallel tests that rely on
  // `unapprovedInvestor` staying unverified are unaffected.
  unapprovedInvestorTab: {
    ...base,
    id: "00000000-0000-0000-0000-0000000000ab",
    email: "unapproved-investor-tab@e2e.test",
    role: "INVESTOR",
    is_approved: false,
  },
  // Takes its identity photos and submits them in kyc-capture.spec.ts, which
  // verifies it. Its own account for the same reason as the one above: the stub
  // remembers an approval, and every other spec that needs an investor who is
  // still unverified would otherwise find this one approved.
  unapprovedInvestorCamera: {
    ...base,
    id: "00000000-0000-0000-0000-0000000000b4",
    email: "unapproved-investor-camera@e2e.test",
    role: "INVESTOR",
    is_approved: false,
  },
  // Suspended: the backend refuses this account on every request, so the proxy
  // must route it to /suspended rather than looping it through /login.
  suspended: {
    ...base,
    id: "00000000-0000-0000-0000-0000000000b2",
    email: "suspended@e2e.test",
    full_name: "Suspended Test",
    role: "INVESTOR",
  },
  // Cookie present, session refused — an expired access token. The proxy must
  // read this as signed out, not as a user who never picked a role.
  expiredSession: {
    ...base,
    id: "00000000-0000-0000-0000-0000000000b3",
    email: "expired@e2e.test",
    full_name: "Expired Session",
    role: "ADMIN",
  },
  unapprovedSme: {
    ...base,
    id: "00000000-0000-0000-0000-0000000000a9",
    email: "unapproved-sme@e2e.test",
    role: "SME",
    is_approved: false,
  },
  // Never verifies anything during the run, so a test can rely on it staying
  // unverified while other tests approve `unapprovedSme` in parallel.
  unapprovedSmeIdentity: {
    ...base,
    id: "00000000-0000-0000-0000-0000000000aa",
    email: "unapproved-sme-identity@e2e.test",
    role: "SME",
    is_approved: false,
  },
};

/** Password accepted for every stub account. Not a secret — the stub is fake. */
export const STUB_PASSWORD = "e2e-password";

export function userKeyForEmail(email: string): StubUserKey | null {
  const entry = Object.entries(STUB_USERS).find(
    ([, user]) => user.email.toLowerCase() === email.trim().toLowerCase(),
  );
  return entry ? (entry[0] as StubUserKey) : null;
}

/** The SME project rendered by the dashboard hero. Mirrors ProjectOut. */
export const STUB_PROJECT = {
  id: "20000000-0000-0000-0000-000000000001",
  legal_name: "E2E Manufacturing Co",
  tax_id: "0312345678",
  // Canonical grading-engine value, so the industry theme and label resolve.
  industry: "Manufacturing",
  address: {
    street: "12 Nguyen Hue",
    city: "Ho Chi Minh City",
    state: "",
    postal_code: "70000",
    country: "Vietnam",
  },
  incorporation_date: "2021-04-12",
  status: "ACTIVE",
  created_at: "2026-05-02T08:30:00+07:00",
  updated_at: "2026-08-01T08:30:00+07:00",
  loan_application: {
    id: "30000000-0000-0000-0000-000000000001",
    project_id: "20000000-0000-0000-0000-000000000001",
    requested_amount: "800000000.00",
    duration_months: 6,
    interest_rate_pct: null,
    purpose: "Working capital for a new production line",
    repayment_preference: "MONTHLY",
    // SUBMITTED rather than DRAFT: the DRAFT branch renders the upload wizard,
    // which needs presigned R2 uploads the stub has no business faking.
    status: "SUBMITTED",
    submitted_at: "2026-05-10T09:00:00+07:00",
    created_at: "2026-05-02T08:30:00+07:00",
    documents: [],
  },
};

/** Marketplace listing for /dashboard/projects. */
export const STUB_PUBLIC_PROJECTS = [
  {
    ...STUB_PROJECT,
    id: "20000000-0000-0000-0000-000000000002",
    legal_name: "Delta Foods JSC",
    industry: "Food & Beverage",
  },
  {
    ...STUB_PROJECT,
    id: "20000000-0000-0000-0000-000000000003",
    legal_name: "Northwind IT",
    industry: "IT Services",
  },
];

/**
 * A company that exists only in the admin console, never on the marketplace.
 *
 * It carries the funding request the engine CANNOT grade, so the panel's
 * ungraded state has a company of its own — the marketplace specs derive their
 * expectations from STUB_PUBLIC_PROJECTS, and a third listing there would be a
 * third card on a screen this has nothing to do with.
 */
export const STUB_ADMIN_ONLY_PROJECT = {
  ...STUB_PROJECT,
  id: "20000000-0000-0000-0000-000000000004",
  legal_name: "Ungraded Trading Co",
  industry: "Retail",
};

/**
 * An admin-only company whose funding request has every required document on
 * file, so the operator's Approve is available. The other admin companies are
 * missing documents, and approval is refused for them (as the real API does).
 */
export const STUB_ADMIN_COMPLETE_PROJECT = {
  ...STUB_PROJECT,
  id: "20000000-0000-0000-0000-000000000005",
  legal_name: "Complete Docs Co",
  industry: "Manufacturing",
};

/**
 * Admin-only companies that are still DRAFT, with every required document on
 * file. They are the two halves of the two-approval gate's own fixtures: the
 * stub records each decision and each approved score, so a test that walks one
 * company through the gate has to own it. A business is ACTIVE only when both
 * halves are in, and the two companies cover both orders they can arrive in.
 */
export const STUB_ADMIN_GATE_PROJECTS = [
  {
    ...STUB_PROJECT,
    id: "20000000-0000-0000-0000-000000000006",
    legal_name: "Riverside Packaging Co",
    industry: "Manufacturing",
    status: "DRAFT",
  },
  {
    ...STUB_PROJECT,
    id: "20000000-0000-0000-0000-000000000007",
    legal_name: "Harbor Logistics Co",
    industry: "Logistics",
    status: "DRAFT",
  },
];

/**
 * The same company, but with the application still in DRAFT.
 *
 * The DRAFT branch of SmeDashboard renders the application wizard. That used
 * to be untestable because every step demanded a file, but steps 2 and 3 now
 * collect typed figures and the uploads on the remaining steps are staged
 * locally until Send — so the wizard can be driven end-to-end without the stub
 * pretending to be R2.
 */
export const STUB_PROJECT_DRAFT_APPLICATION = {
  ...STUB_PROJECT,
  id: "20000000-0000-0000-0000-000000000009",
  loan_application: {
    ...STUB_PROJECT.loan_application,
    id: "30000000-0000-0000-0000-000000000009",
    project_id: "20000000-0000-0000-0000-000000000009",
    status: "DRAFT",
    submitted_at: null,
  },
};

/**
 * A refused application, carrying the operator's reason and a gap in the file.
 *
 * Both are what the applicant is owed on a refusal: an outcome with no
 * explanation is the thing they phone about. `cic_report` is deliberately
 * absent so the "still missing" list has something real in it.
 */
export const STUB_PROJECT_REJECTED_APPLICATION = {
  ...STUB_PROJECT,
  id: "20000000-0000-0000-0000-00000000000a",
  loan_application: {
    ...STUB_PROJECT.loan_application,
    id: "30000000-0000-0000-0000-00000000000a",
    project_id: "20000000-0000-0000-0000-00000000000a",
    status: "REJECTED",
    decision_note:
      "The revenue in the declarations does not match the figures on the form.",
    decided_at: "2026-09-12T09:00:00+07:00",
    documents: [
      {
        id: "d1",
        document_type: "legal_charter",
        original_filename: "dieu-le-cong-ty.pdf",
        content_type: "application/pdf",
        file_size_bytes: 240000,
        status: "UPLOADED",
        uploaded_at: "2026-09-01T00:00:00Z",
      },
    ],
  },
};

/**
 * An approved request, shaped like the backend's LoanApprovalOut: the score
 * and rate of the reference application in docs (60.16, 15.19% on 50m over
 * 5 months).
 */
export const STUB_PROJECT_APPROVED_APPLICATION = {
  ...STUB_PROJECT,
  id: "20000000-0000-0000-0000-00000000000b",
  loan_application: {
    ...STUB_PROJECT.loan_application,
    id: "30000000-0000-0000-0000-00000000000b",
    project_id: "20000000-0000-0000-0000-00000000000b",
    requested_amount: "50000000",
    duration_months: 5,
    repayment_preference: "DAILY",
    status: "UNDER_REVIEW",
    decided_at: "2026-09-27T09:00:00+07:00",
    // As a real approval has them: the registration came from the verified
    // business certificate, so it is the one type not uploaded.
    documents: (
      ["legal_charter", "e_invoice_data", "tax_filings", "cic_report"] as const
    ).map((document_type, i) => ({
      id: `approved-doc-${i}`,
      document_type,
      original_filename: `${document_type}.pdf`,
      content_type: "application/pdf",
      file_size_bytes: 120000,
      status: "UPLOADED",
      uploaded_at: "2026-09-20T00:00:00Z",
    })),
    approval: {
      approved_at: "2026-09-27T09:00:00+07:00",
      business_score: 60.16,
      reference_rate_pct: 15.19,
      duration_months: 5,
      total_repayment_vnd: 53164039,
      estimated_daily_repayment_vnd: 483309,
      engine_version: "1.0.0",
      params_version: "wb-v1-20260917",
    },
  },
};

export function projectsFor(key: StubUserKey) {
  if (key === "sme" || key === "unapprovedSme") return [STUB_PROJECT];
  if (key === "smeDraftApplication") return [STUB_PROJECT_DRAFT_APPLICATION];
  if (key === "smeRejectedApplication")
    return [STUB_PROJECT_REJECTED_APPLICATION];
  if (key === "smeApprovedApplication")
    return [STUB_PROJECT_APPROVED_APPLICATION];
  return [];
}

/** Rows for the admin overview table (mode=users). */
export const STUB_ADMIN_USERS = [
  // The signed-in admin appears in their own table, which is what makes the
  // "cannot change your own status" guard reachable from the UI.
  {
    id: STUB_USERS.admin.id,
    email: STUB_USERS.admin.email,
    full_name: "Admin Test",
    role: "ADMIN",
    status: "ACTIVE",
    email_verified: true,
    avatar_url: null,
    created_at: "2026-01-05T08:00:00+07:00",
  },
  {
    id: STUB_USERS.investor.id,
    email: STUB_USERS.investor.email,
    full_name: STUB_USERS.investor.full_name,
    role: "INVESTOR",
    status: "ACTIVE",
    email_verified: true,
    avatar_url: null,
    created_at: "2026-03-14T10:00:00+07:00",
  },
  {
    id: STUB_USERS.sme.id,
    email: STUB_USERS.sme.email,
    full_name: STUB_USERS.sme.full_name,
    role: "SME",
    status: "ACTIVE",
    email_verified: true,
    avatar_url: null,
    created_at: "2026-04-02T10:00:00+07:00",
  },
  {
    id: STUB_USERS.unverifiedEmail.id,
    email: STUB_USERS.unverifiedEmail.email,
    full_name: STUB_USERS.unverifiedEmail.full_name,
    role: "INVESTOR",
    status: "PENDING",
    email_verified: false,
    avatar_url: null,
    created_at: "2026-08-20T10:00:00+07:00",
  },
];

export const STUB_ADMIN_STATS = {
  total_users: STUB_ADMIN_USERS.length,
  total_projects: 2,
  users_by_role: { INVESTOR: 2, SME: 1, ADMIN: 1 },
  users_by_status: { ACTIVE: 2, PENDING: 1 },
  projects_by_status: { ACTIVE: 1, DRAFT: 1 },
};

export const STUB_AUDIT_LOGS = [
  {
    id: "40000000-0000-0000-0000-000000000001",
    entity_type: "USER",
    entity_id: STUB_USERS.investor.id,
    action: "SIGN_IN",
    actor_id: STUB_USERS.investor.id,
    actor: {
      id: STUB_USERS.investor.id,
      full_name: STUB_USERS.investor.full_name,
      email: STUB_USERS.investor.email,
    },
    entity_user: {
      id: STUB_USERS.investor.id,
      full_name: STUB_USERS.investor.full_name,
      email: STUB_USERS.investor.email,
    },
    before_state: null,
    after_state: null,
    ip_address: "127.0.0.1",
    created_at: "2026-08-27T09:00:00+07:00",
  },
  {
    id: "40000000-0000-0000-0000-000000000002",
    entity_type: "PROJECT",
    entity_id: STUB_PROJECT.id,
    action: "PROJECT_CREATED",
    actor_id: STUB_USERS.sme.id,
    actor: {
      id: STUB_USERS.sme.id,
      full_name: STUB_USERS.sme.full_name,
      email: STUB_USERS.sme.email,
    },
    entity_user: null,
    before_state: null,
    after_state: { status: "ACTIVE" },
    ip_address: "127.0.0.1",
    created_at: "2026-05-02T08:30:00+07:00",
  },
];

// --- Admin KYC review ------------------------------------------------------ //
//
// Attempts the GVerify engine parked because their ID number was already
// verified on another account. One per test that settles an attempt: the suite
// runs fully parallel against one stub process, so a test that approves a row
// must not remove it from under a test that is still reading the queue.

const KYC_OWNER = {
  id: "00000000-0000-4000-8000-0000000c0001",
  email: "real.owner@example.com",
  full_name: "Nguyễn Văn Chủ",
  status: "ACTIVE",
  created_at: "2026-04-02T09:00:00+07:00",
};

const KYC_OWNER_CONFLICT = {
  verification_id: "00000000-0000-4000-8000-0000000c0a01",
  user: KYC_OWNER,
  full_name: "NGUYEN VAN CHU",
  date_of_birth: "12/05/1988",
  approved_at: "2026-04-02T09:20:00+07:00",
};

function parkedKycAttempt(
  id: string,
  email: string,
  fullName: string,
  createdAt: string,
) {
  return {
    id,
    status: "MANUAL_REVIEW",
    is_approved: false,
    rejection_reason: "Your verification needs a manual review",
    person_number: "079188001234",
    full_name: "NGUYEN VAN CHU",
    date_of_birth: "12/05/1988",
    face_match_score: 0.91,
    created_at: createdAt,
    provider_checked: true,
    user: {
      id: `${id}-user`,
      email,
      full_name: fullName,
      status: "ACTIVE",
      created_at: "2026-09-27T21:00:00+07:00",
    },
    conflicts: [KYC_OWNER_CONFLICT],
  };
}

/** Read-only: listed and opened, never settled. */
export const STUB_KYC_REVIEW_LISTED = parkedKycAttempt(
  "00000000-0000-4000-8000-0000000c0b01",
  "second.account@example.com",
  "Chủ Tài Khoản Hai",
  "2026-09-28T08:15:00+07:00",
);
/** Settled by the approve test. */
export const STUB_KYC_REVIEW_TO_APPROVE = parkedKycAttempt(
  "00000000-0000-4000-8000-0000000c0b02",
  "lost.access@example.com",
  "Chủ Mất Quyền Truy Cập",
  "2026-09-28T09:40:00+07:00",
);
/** Settled by the reject test. */
export const STUB_KYC_REVIEW_TO_REJECT = parkedKycAttempt(
  "00000000-0000-4000-8000-0000000c0b03",
  "impostor@example.com",
  "Người Mạo Danh",
  "2026-09-28T10:05:00+07:00",
);

/** The owner's own attempt: the history under the "Approved" tab. */
export const STUB_KYC_OWNER_APPROVED = {
  id: KYC_OWNER_CONFLICT.verification_id,
  status: "APPROVED",
  is_approved: true,
  rejection_reason: null,
  person_number: "079188001234",
  full_name: "NGUYEN VAN CHU",
  date_of_birth: "12/05/1988",
  face_match_score: 0.96,
  created_at: "2026-04-02T09:20:00+07:00",
  provider_checked: true,
  user: KYC_OWNER,
  conflicts: [],
};

export const STUB_KYC_REVIEWS = [
  STUB_KYC_OWNER_APPROVED,
  STUB_KYC_REVIEW_LISTED,
  STUB_KYC_REVIEW_TO_APPROVE,
  STUB_KYC_REVIEW_TO_REJECT,
];
