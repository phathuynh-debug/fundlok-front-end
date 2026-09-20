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
  | "unapprovedSme"
  | "smeDraftApplication"
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
    requested_amount: "1250000000.00",
    duration_months: 12,
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

export function projectsFor(key: StubUserKey) {
  if (key === "sme" || key === "unapprovedSme") return [STUB_PROJECT];
  if (key === "smeDraftApplication") return [STUB_PROJECT_DRAFT_APPLICATION];
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
