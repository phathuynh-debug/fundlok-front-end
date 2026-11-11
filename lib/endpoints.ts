// All API calls go through the Next.js proxy at /api/*.
// Next.js rewrites /api/* → http://127.0.0.1:8000/* server-side,
// so the browser only ever talks to localhost:3000 — same origin,
// which means httpOnly cookies are sent automatically on every request.
export const API_URL = "/api";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const AUTH_ENDPOINTS = {
  login: "/auth/login",
  register: "/auth/register",
  oauthLogin: "/auth/oauth/login",
  refresh: "/auth/refresh",
  logout: "/auth/logout",
  verifyEmail: (token: string) => `/auth/verify-email?token=${token}`,
  resendVerification: "/auth/resend-verification",
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password",
  // Security screen: live sign-ins and the account's security history.
  securityOverview: "/auth/security-overview",
  sessions: "/auth/sessions",
  revokeSession: (sessionId: string) => `/auth/sessions/${sessionId}/revoke`,
  revokeOtherSessions: "/auth/sessions/revoke-others",
  securityEvents: "/auth/security-events",
  // Two-factor auth. `twoFactorLogin` is the only one reachable without a
  // session: it trades the challenge token from POST /auth/login for one.
  twoFactor: "/auth/2fa",
  twoFactorSetup: "/auth/2fa/setup",
  twoFactorEnable: "/auth/2fa/enable",
  twoFactorDisable: "/auth/2fa/disable",
  twoFactorLogin: "/auth/login/2fa",
  // Passkeys (WebAuthn). The two `passkeyLogin*` routes are reachable without
  // a session — that is the point of them; everything else requires one.
  passkeys: "/auth/passkeys",
  passkeyRegisterOptions: "/auth/passkeys/register/options",
  passkeyRegisterVerify: "/auth/passkeys/register/verify",
  passkeyDelete: (id: string) => `/auth/passkeys/${id}`,
  passkeyLoginOptions: "/auth/passkeys/login/options",
  passkeyLoginVerify: "/auth/passkeys/login/verify",
} as const;

// Accepting the Terms & Services and data consent at sign-up (Contract 1):
// three tick boxes and an emailed one-time code.
export const CONSENT_ENDPOINTS = {
  status: "/consent/status",
  // Emails a 6-digit code to the account's own address.
  code: "/consent/code",
  accept: "/consent/accept",
} as const;

export const USER_ENDPOINTS = {
  me: "/users/me",
  // Sets the role for a user who registered/logged in without one.
  selectRole: "/users/me/role",
  // Marks the first-run dashboard walkthrough as seen for this account.
  completeOnboardingTour: "/users/me/onboarding-tour/complete",
  avatarPresign: "/users/me/avatar/presign",
  avatarConfirm: "/users/me/avatar/confirm",
  // Sets a FIRST password on an account created without one (OAuth sign-in).
  // Changing an existing password is /auth/forgot-password → reset-password.
  setPassword: "/users/me/password",
  // Changing an EXISTING password is a different endpoint: it requires the
  // current one, because a session alone must not be enough to take an account
  // over. See app/users/router.py.
  changePassword: "/users/me/password/change",
  securityPreferences: "/users/me/security-preferences",
  // Phone verification by one-time code sent by Zalo ZNS. A new
  // account proves a number here before it may choose a role.
  phoneSendCode: "/users/me/phone/send-code",
  phoneVerify: "/users/me/phone/verify",
} as const;

// Bank accounts a user pays from or is paid into (HANDOFF-04 Epic 0). Saved
// accounts are approved at once; there is no review step.
export const PAYMENT_ACCOUNT_ENDPOINTS = {
  banks: "/direct-transfer/banks",
  list: "/payment-accounts",
  create: "/payment-accounts",
  // Reads bank + account number from the text of a bank-app QR (decoded in the browser).
  parseVietQr: "/payment-accounts/parse-vietqr",
  vietQr: (id: string) => `/payment-accounts/${id}/vietqr`,
} as const;

// Investing through a project's funding window (ADR-009): the investor holds an
// amount, agrees to the investing terms, then pays the business directly.
export const FUNDING_ENDPOINTS = {
  // The investor's money in and out, and the portfolio month by month.
  myTransactions: "/funding/me/transactions",
  myAnalytics: "/funding/me/analytics",
  // The business's money in and out, and its loan.
  businessTransactions: "/funding/me/business-transactions",
  businessAnalytics: "/funding/me/business-analytics",
  window: (listingId: string) => `/funding/listings/${listingId}/window`,
  // Reserves the amount and signs the acceptance in one call; needs an
  // Idempotency-Key header.
  reserve: (windowId: string) => `/funding/windows/${windowId}/reservations`,
  // The Investor Service Agreement (Contract 4): GET whether it must still be
  // confirmed with the next commitment; POST {version, tranche_id, code} to
  // confirm it with the one-time code (the investor's signature). The PDF to
  // read, filled in with the investor's details, and the copy kept once
  // confirmed.
  investorAgreement: "/funding/me/investor-agreement",
  // POST {version, tranche_id}: sends the one-time code by Zalo to the phone
  // number on the investor's account.
  investorAgreementCode: "/funding/me/investor-agreement/code",
  investorAgreementDocument: "/funding/me/investor-agreement/document",
  investorAgreementSigned: "/funding/me/investor-agreement/signed",
  // The Loan Contract (Contract 5) the business and its guarantor signed for
  // this listing, as a PDF: read before committing. 404 when it has none.
  windowLoanContract: (windowId: string) =>
    `/funding/windows/${windowId}/loan-contract`,
  // The Investment Confirmation (the agreement's Annex) for an amount on a
  // window, as it will be signed: ?amount_vnd=
  investmentConfirmation: (windowId: string) =>
    `/funding/windows/${windowId}/investment-confirmation`,
  // The business's account, the exact amount, the memo and the VietQR.
  payment: (trancheId: string) => `/funding/tranches/${trancheId}/payment`,
  // The Investment Confirmation (Annex) kept when the investor agreed to this
  // ticket: its values, and the filled-in PDF.
  trancheConfirmation: (trancheId: string) =>
    `/funding/tranches/${trancheId}/investment-confirmation`,
  trancheConfirmationDocument: (trancheId: string) =>
    `/funding/tranches/${trancheId}/investment-confirmation/document`,
  myTranches: "/funding/me/tranches",
  // The investor's bank receipt for their transfer (multipart `file`).
  receipt: (trancheId: string) => `/funding/tranches/${trancheId}/receipt`,
  // The business's side: its rounds and tickets (investors masked), and
  // closing early once the minimum is confirmed.
  myRounds: "/funding/me/rounds",
  // Its daily repayments to investors: projected until the loan forms.
  repaymentPlan: (windowId: string) =>
    `/funding/me/rounds/${windowId}/repayment-plan`,
  closeEarly: (windowId: string) => `/funding/windows/${windowId}/close-early`,
  reportMissingTransfer: (trancheId: string) =>
    `/funding/tranches/${trancheId}/report-missing`,
} as const;

// Daily repayment once a round has formed its loan: what the business owes each
// investor today (one VietQR per investor), marking days paid, and a ticket's
// whole schedule.
export const REPAYMENT_ENDPOINTS = {
  today: "/repayment/today",
  schedule: (trancheId: string) => `/repayment/tranches/${trancheId}/schedule`,
  reportMissing: (dayId: string) => `/repayment/days/${dayId}/report-missing`,
  // Before the loan forms: what a confirmed ticket's days would be.
  projection: (trancheId: string) =>
    `/repayment/tranches/${trancheId}/projection`,
  // The business's side of one investment: what is due now, and paying it
  // with the transfer receipt.
  due: (trancheId: string) => `/repayment/tranches/${trancheId}/due`,
  pay: (trancheId: string) => `/repayment/tranches/${trancheId}/pay`,
  // The investor's side: the receipts businesses uploaded for paying them,
  // and confirming the money arrived.
  receipts: "/repayment/receipts",
  confirmReceipt: (receiptId: string) =>
    `/repayment/receipts/${receiptId}/confirm`,
} as const;

export const PROJECT_ENDPOINTS = {
  list: "/projects",
  create: "/projects",
  public: "/projects/public",
} as const;

// Public marketing contact form. No session needed — the backend gates it on
// Cloudflare Turnstile instead.
export const CONTACT_ENDPOINTS = {
  submit: "/contact",
} as const;

export const FILES_ENDPOINTS = {
  presign: "/files/presign",
  commit: (fileId: string) => `/files/${fileId}/commit`,
} as const;

export const UPLOADS_ENDPOINTS = {
  initUpload: "/uploads/init-upload",
  confirm: "/uploads/confirm",
  // Reads the e-invoice zip the moment it is picked, to prefill step 2.
  einvoicePreview: "/uploads/einvoice-preview",
  // Reads the tax filings (statement XML, or the folder .zip) to prefill step 2.
  taxFilingsPreview: "/uploads/tax-filings-preview",
  cicPreview: "/uploads/cic-preview",
} as const;

export const LOANS_ENDPOINTS = {
  /**
   * Indicative rate for a visitor with no account (the public /rate page).
   * Unauthenticated and stateless: it stores nothing and returns a band, never
   * a single rate. The engine runs server-side because the reference rate and
   * the rating formula are internal pricing inputs.
   */
  rateEstimate: "/loans/rate-estimate",
  submit: (applicationId: string) =>
    `/loans/applications/${applicationId}/submit`,
  /**
   * Self-reported figures for the Lite grading path (replaces the VAT and
   * annual-financials uploads). NOTE: not implemented on the backend yet —
   * `loan_applications` has no columns for these (see
   * app/lending/models.py), so this needs a migration + route before it
   * returns anything but 404.
   */
  figures: (applicationId: string) =>
    `/loans/applications/${applicationId}/figures`,
  /**
   * The SME Service Agreement as a PDF, filled in with the SME's verified
   * details and the application's amount, term and (once approved) rate. The
   * owning SME only.
   */
  serviceAgreement: (applicationId: string) =>
    `/loans/applications/${applicationId}/service-agreement`,
  /**
   * The Standing Offer to Conclude Loan Contracts as a PDF, filled in with the
   * SME, its Personal Guarantor and the approved terms. 409 SIGNING_NOT_OPEN
   * until FundLok approves the request. The owning SME only.
   */
  standingOffer: (applicationId: string) =>
    `/loans/applications/${applicationId}/standing-offer`,
  /**
   * The Loan Contract template (Contract 5) as a PDF, filled in with the SME,
   * its Personal Guarantor and the approved terms; each Investor's own
   * contract is generated from it at commitment. 409 SIGNING_NOT_OPEN until
   * FundLok approves the request, 409 SIGNING_OFFER_FIRST until the Standing
   * Offer is signed (it cites the Offer's date). The owning SME only.
   */
  loanContract: (applicationId: string) =>
    `/loans/applications/${applicationId}/loan-contract`,
  /**
   * PUT { address }: the Personal Guarantor's address, for the Standing Offer
   * and the Loan Contract when the eKYC carries none. 409
   * SIGNING_ALREADY_SIGNED once either is signed.
   */
  guarantorAddress: (applicationId: string) =>
    `/loans/applications/${applicationId}/guarantor-address`,
  /** GET: where signing the three listing documents stands. */
  listingDocuments: (applicationId: string) =>
    `/loans/applications/${applicationId}/listing-documents`,
  /** POST (multipart `file`): the signed copy, checked with NEAC. */
  signListingDocument: (applicationId: string, kind: ListingDocumentKind) =>
    `/loans/applications/${applicationId}/listing-documents/${kind}`,
  /** GET: the signed copy on file, exactly as uploaded. */
  signedListingDocument: (applicationId: string, kind: ListingDocumentKind) =>
    `/loans/applications/${applicationId}/listing-documents/${kind}/signed`,
} as const;

/** The three documents an SME signs after approval. */
export type ListingDocumentKind =
  "service-agreement" | "standing-offer" | "loan-contract";

export const RATE_CALCULATOR_ENDPOINTS = {
  calculate: "/api/v1/rates/calculate",
  inquiries: "/admin/rates/inquiries",
  inquiryDetail: (id: string) => `/admin/rates/inquiries/${id}`,
  investorTiers: "/api/v1/rates/investor/tiers",
  investorLeads: "/api/v1/rates/investor/leads",
  investorEstimate: (leadId: string) =>
    `/api/v1/rates/investor/leads/${leadId}/estimate`,
  investorSignup: (leadId: string) =>
    `/api/v1/rates/investor/leads/${leadId}/signup`,
  // Admin only. No /api/v1 alias exists for these: they hold personal data.
  investorLeadsAdmin: "/admin/rates/investor-leads",
  investorLeadAdmin: (id: string) => `/admin/rates/investor-leads/${id}`,
} as const;

export const ADMIN_ENDPOINTS = {
  overview: "/admin/overview",
  auditLogs: "/admin/audit-logs",
  maintenance: "/system/maintenance",
  rateInquiries: "/admin/rates/inquiries",
  rateInquiryDetail: (id: string) => `/admin/rates/inquiries/${id}`,
  // The project preview: one company, its funding requests, and the owner's
  // latest KYB attempt — both halves of the two-approval gate in one payload.
  projectDetail: (id: string) => `/admin/projects/${id}`,
  // Opens a live project for investment by hand, for one that did not open
  // when its business's bank account was approved.
  projectFundingWindow: (id: string) => `/admin/projects/${id}/funding-window`,
  // The operator's two decisions. Both are admin-only server-side and both are
  // one-way: a decided record answers 409, never a silent overwrite.
  resolveKybVerification: (id: string) =>
    `/admin/kyb-verifications/${id}/resolve`,
  // Investor KYC attempts the engine parked in MANUAL_REVIEW (an ID number
  // already verified on another account). The list defaults to that queue.
  kycVerifications: "/admin/kyc-verifications",
  kycVerification: (id: string) => `/admin/kyc-verifications/${id}`,
  // A 10-minute read URL for one submitted image.
  kycImage: (id: string, name: string) =>
    `/admin/kyc-verifications/${id}/images/${name}`,
  resolveKycVerification: (id: string) =>
    `/admin/kyc-verifications/${id}/resolve`,
  // The business-verification queue: KYB attempts parked in MANUAL_REVIEW
  // (every submission while verification mode is MANUAL), with a 10-minute
  // read URL for the submitted certificate.
  kybVerifications: "/admin/kyb-verifications",
  kybVerification: (id: string) => `/admin/kyb-verifications/${id}`,
  kybCertificate: (id: string) => `/admin/kyb-verifications/${id}/certificate`,
  // KYC/KYB verification mode. Reading it with who/when is SYSTEM_ADMIN only,
  // and so is changing it.
  verificationModeAdmin: "/system/verification-mode/admin",
  setVerificationMode: "/system/verification-mode",
  applicationDecision: (id: string) => `/admin/applications/${id}/decision`,
  // Account status. SUSPENDED is a real deny server-side, not a label.
  userStatus: (id: string) => `/admin/users/${id}/status`,
  // Full detail preview for one account (profile + projects + investments + security).
  userDetail: (id: string) => `/admin/users/${id}`,
  // Bank accounts users saved: the review queue and the approve/reject call.
  paymentAccounts: "/admin/payment-accounts",
  paymentAccountDecision: (id: string) =>
    `/admin/payment-accounts/${id}/decision`,
  // The Transactions tab: funding rounds, investor transfers, a 10-minute link
  // to a receipt, and the approve / deny staff make after looking at it.
  fundingRounds: "/admin/funding/rounds",
  // Does what is due on a round now (close, then form the loan); stands in for
  // the scheduled job.
  fundingRoundAdvance: (windowId: string) =>
    `/admin/funding/rounds/${windowId}/advance`,
  fundingTransfers: "/admin/funding/transfers",
  // The transfers' audit trail: who approved or denied what, and why.
  fundingActivity: "/admin/funding/activity",
  fundingTransfer: (trancheId: string) =>
    `/admin/funding/transfers/${trancheId}`,
  // The repayment approving starts, worked out step by step.
  fundingTransferRepayment: (trancheId: string) =>
    `/admin/funding/transfers/${trancheId}/repayment`,
  transferReceiptUrl: (transferId: string) =>
    `/admin/funding/transfers/${transferId}/receipt-url`,
  transferDecision: (transferId: string) =>
    `/admin/funding/transfers/${transferId}/decision`,
  // The receipts businesses upload when they repay an investor. Read-only:
  // the investor confirms a repayment, not staff.
  fundingRepayments: "/admin/funding/repayments",
  fundingRepayment: (receiptId: string) =>
    `/admin/funding/repayments/${receiptId}`,
  repaymentReceiptUrl: (receiptId: string) =>
    `/admin/funding/repayments/${receiptId}/receipt-url`,
  // SYSTEM_ADMIN only. Creates an ADMIN account with no password and emails
  // the invitee a single-use link to choose one.
  inviteAdmin: "/admin/users/admins",
  // A 10-minute read URL for one uploaded application document.
  documentUrl: (id: string) => `/admin/documents/${id}/url`,
  // POST: check the SME's signed Service Agreement with NEAC (neac.gov.vn)
  // and record the verdict. sme_service_agreement documents only.
  documentNeacCheck: (id: string) => `/admin/documents/${id}/neac-check`,
} as const;

// Admin > Email. Every admin connects their own Gmail account (the app
// password is write-only, never returned) and sends from it; /settings is
// always the signed-in admin's own. The org-wide policy is readable by any
// admin and changeable by SYSTEM_ADMIN only.
// Spec: backend docs/specs/admin/internal-email.md.
export const ADMIN_EMAIL_ENDPOINTS = {
  // GET your own connection; PUT sender name, signature and the sending
  // switch. The Google account itself is connected through oauthAuthorize.
  settings: "/admin/email/settings",
  // Google's consent URL for connecting your Gmail account (Google OAuth).
  // Google sends the browser back to /api/admin/email/oauth/callback, which
  // the backend answers with a redirect to /admin/email?connected=true or
  // ?error=<code>.
  oauthAuthorize: "/admin/email/oauth/authorize",
  // Forgets your Google account and revokes its token at Google.
  disconnect: "/admin/email/disconnect",
  // Allowed recipient domains for every admin. PUT is SYSTEM_ADMIN only.
  policy: "/admin/email/policy",
  // Sends the test template to the signed-in admin's own address.
  testEmail: "/admin/email/settings/test",
  // Renders exactly what would be sent; sends nothing.
  preview: "/admin/email/preview",
  send: "/admin/email/send",
  // Your own sends; a SYSTEM_ADMIN gets every admin's.
  messages: "/admin/email/messages",
  // Users to pick for the To list (active, verified). ?q= searches name and
  // email; ?fundlok_only=true keeps FundLok's own addresses.
  recipients: "/admin/email/recipients",
} as const;

// Underwriting. Admin-only server-side (require_roles(Role.ADMIN) — note that
// is ADMIN specifically, not SYSTEM_ADMIN). A score run is a dated, audited
// artefact: it writes an append-only score_run_inputs row for exact replay and
// records the board-set bank rate in force, so it is started deliberately
// rather than as a side effect of an upload.
export const UNDERWRITING_ENDPOINTS = {
  scoreRuns: "/underwriting/score-runs",
  scoreRun: (id: string) => `/underwriting/score-runs/${id}`,
  approveScoreRun: (id: string) => `/underwriting/score-runs/${id}/approve`,
} as const;

// GVerify (Datatrust) — identity/business verification for both roles, gated
// by role server-side: investors do KYC, SMEs do KYB (calling the wrong one
// 403s). Direct API, so no redirect and no webhook: we submit the images in
// one call and the response carries the final verdict. The browser only talks
// to our API; the backend owns the provider session and is the source of truth.
export const GVERIFY_ENDPOINTS = {
  verify: "/gverify/kyc/verify",
  status: "/gverify/kyc/status",
  // Phone handoff: desktop mints a 10-minute token (shown as a QR), the phone
  // submits the images with it as a Bearer credential — no login cookie needed.
  handoff: "/gverify/kyc/handoff",
  handoffVerify: "/gverify/kyc/handoff/verify",
  // KYB — business verification for SMEs: registration certificate OCR +
  // state tax-registry cross-check, synchronous verdict.
  kybVerify: "/gverify/kyb/verify",
  kybStatus: "/gverify/kyb/status",
  // A 10-minute read URL for the certificate the SME already submitted for
  // KYB, so the loan application does not ask for the same file twice.
  kybCertificate: "/gverify/kyb/certificate",
  // Any signed-in user: whether results come from the provider (AUTOMATIC)
  // or from an admin (MANUAL), so the screens can say so up front.
  verificationMode: "/system/verification-mode",
} as const;

// In-app notifications — the bell in the sidebar. Every route is scoped to the
// signed-in user server-side; there is no "all notifications" read.
export const NOTIFICATION_ENDPOINTS = {
  list: "/notifications",
  markRead: (id: string) => `/notifications/${id}/read`,
  markAllRead: "/notifications/read-all",
  realtimeToken: "/notifications/realtime-token",
} as const;
