import { test, expect } from "@playwright/test";

import {
  STUB_ADMIN_STATS,
  STUB_ADMIN_USERS,
  STUB_KYC_OWNER_APPROVED,
  STUB_KYC_REVIEW_LISTED,
  STUB_KYC_REVIEW_TO_APPROVE,
  STUB_KYC_REVIEW_TO_REJECT,
  STUB_USERS,
} from "../stub-api/fixtures";
import { signInAs } from "../support/auth";
import { t } from "../support/i18n";
import { toast } from "../support/ui";

// The /admin area. Access control is covered in auth-gating.spec.ts; this file
// is about the screens themselves rendering the API's data.

test.describe("as an admin", () => {
  test.beforeEach(async ({ context }) => {
    await signInAs(context, "admin");
  });

  test("the overview shows platform stats", async ({ page }) => {
    await page.goto("/admin");

    await expect(
      page.getByRole("heading", { name: t("admin.title"), exact: true }),
    ).toBeVisible();
    await expect(
      page
        .getByText(String(STUB_ADMIN_STATS.total_users), { exact: true })
        .first(),
    ).toBeVisible();
  });

  test("the overview lists recent rate-page leads with how to reach them", async ({
    page,
  }) => {
    await page.goto("/admin");

    const sme = page.getByTestId("recent-sme-leads");
    await expect(sme).toContainText(t("admin.recentLeads.smeTitle"));
    await expect(sme).toContainText("Lê Thị Chủ Shop");
    await expect(sme).toContainText("Công ty TNHH Bán Lẻ Mẫu");
    await expect(
      sme.getByRole("link", { name: "owner@retail.vn" }),
    ).toHaveAttribute("href", "mailto:owner@retail.vn");
    await expect(
      sme.getByRole("link", { name: "0912 345 678" }),
    ).toHaveAttribute("href", "tel:0912345678");

    const investors = page.getByTestId("recent-investor-leads");
    await expect(investors).toContainText("Trần Thị Nhà Đầu Tư");
    await expect(
      investors.getByRole("link", { name: "investor.lead@example.com" }),
    ).toBeVisible();
    await expect(
      investors.getByRole("link", { name: "0901 234 567" }),
    ).toBeVisible();

    // "View all" opens the matching tab of the full lists.
    await investors
      .getByRole("link", { name: t("admin.recentLeads.viewAll") })
      .click();
    await expect(page).toHaveURL(/\/admin\/rates\?tab=investor/);
    await expect(
      page.getByRole("tab", { name: t("admin.ratesPage.tabInvestor") }),
    ).toHaveAttribute("aria-selected", "true");
  });

  test("the users page lists users from the API", async ({ page }) => {
    await page.goto("/admin/users");

    for (const row of STUB_ADMIN_USERS) {
      await expect(page.getByText(row.email)).toBeVisible();
    }
  });

  test("audit logs render with actor and action", async ({ page }) => {
    await page.goto("/admin/audit-logs");

    await expect(
      page.getByRole("heading", { name: t("admin.auditLogs.title") }),
    ).toBeVisible();
    // Actions are shown as translated labels, not raw backend codes.
    await expect(
      page.getByText(t("enums.auditAction.SIGN_IN"), { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByText(STUB_USERS.investor.email).first(),
    ).toBeVisible();
  });

  test("cannot reach system settings", async ({ page }) => {
    // SYSTEM_ADMIN only. The proxy redirects; asserted here from the admin
    // screens' point of view so the nav cannot quietly start offering it.
    await page.goto("/admin/system");
    await expect(page).toHaveURL(/\/admin$/);
  });
});

test.describe("as a system admin", () => {
  test.beforeEach(async ({ context }) => {
    await signInAs(context, "systemAdmin");
  });

  test("system settings render the maintenance control", async ({ page }) => {
    await page.goto("/admin/system");

    await expect(
      page.getByRole("heading", { name: t("admin.system.title") }),
    ).toBeVisible();
  });

  test("the users page renders", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(
      page.getByRole("heading", { name: t("admin.usersPage.title") }),
    ).toBeVisible();
  });
});

test("a non-admin session is refused by the API as well as the router", async ({
  page,
  context,
  request,
}) => {
  // Defence in depth: the proxy redirect is a UX guard, not the security
  // boundary. Calling the endpoint directly as an investor must still 403 —
  // otherwise anything that bypassed the router would get admin data.
  await signInAs(context, "investor");
  await page.goto("/dashboard");

  const response = await page.request.get("/api/admin/overview");
  expect(response.status()).toBe(403);
  expect(request).toBeTruthy();
});

// --- Project preview: the two-approval gate ---------------------------------
// A business goes live (ACTIVE) only when BOTH halves are in: the operator's
// decision on the funding request and the engine's score run approved (locked).
// The preview is where an operator sees which half is missing and supplies
// theirs. It once offered only the first, so an approved request never reached
// Active and nothing on the screen said why.
//
// The stub records DECISIONS, and that state is mutable and shared by every
// test in a worker (same caveat as the 2FA fixture). So each test that decides
// something owns a different project — otherwise one test's approval is the
// next test's starting state.

/** "Run scoring" before the first run, "Run again" after it. */
function runButton(scope: import("@playwright/test").Locator) {
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return scope.getByRole("button", {
    name: new RegExp(
      `^(${escape(t("admin.preview.runScoring"))}|${escape(t("admin.preview.rescore"))})$`,
    ),
  });
}

test.describe("the admin project preview", () => {
  const openPreview = async (
    page: import("@playwright/test").Page,
    company: string,
  ) => {
    await page.goto("/admin/projects");
    await page.getByRole("button", { name: new RegExp(company) }).click();
  };

  test.beforeEach(async ({ context }) => {
    await signInAs(context, "admin");
  });

  test("a project row opens the preview", async ({ page }) => {
    // Read-only: asserts nothing that a decision elsewhere could change.
    await openPreview(page, "Delta Foods JSC");

    await expect(page.getByText(t("admin.preview.subtitle"))).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Delta Foods JSC" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: t("admin.preview.engineHeading") }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: t("admin.preview.applicationsHeading"),
      }),
    ).toBeVisible();
  });

  test("lists the documents the SME uploaded", async ({ page }) => {
    // Read-only, so it can share a company with the other read-only test.
    await openPreview(page, "Delta Foods JSC");

    // Labelled by type, not by raw backend key.
    await expect(
      page.getByText(t("admin.preview.documentTypes.legal_charter")),
    ).toBeVisible();
    await expect(page.getByText("dieu-le-cong-ty.pdf")).toBeVisible();
    await expect(
      page.getByText(t("admin.preview.documentTypes.business_registration")),
    ).toBeVisible();

    // A presign that never completed is surfaced, not hidden — that document
    // is missing as far as a reviewer is concerned.
    await expect(
      page.getByText(t("enums.documentStatus.PENDING")).last(),
    ).toBeVisible();
  });

  test("names the missing documents and blocks approval until they arrive", async ({
    page,
  }) => {
    // Read-only: the stub request holds a charter and a registration whose
    // upload never completed, so four required documents are not on file.
    await openPreview(page, "Delta Foods JSC");
    const panel = page.getByRole("dialog");

    for (const type of ["e_invoice_data", "tax_filings", "cic_report"]) {
      const row = panel.locator(`[data-missing-document="${type}"]`);
      await expect(row).toBeVisible();
      await expect(row).toContainText(t(`admin.preview.documentTypes.${type}`));
    }
    // Uploaded ones are not flagged.
    await expect(
      panel.locator('[data-missing-document="legal_charter"]'),
    ).toHaveCount(0);
    // The pending registration counts as missing too.
    await expect(
      panel.getByText(
        t("admin.preview.documentsMissingHint").replace("{count}", "4"),
      ),
    ).toBeVisible();

    // The funding request's Approve (the last one; the first is the
    // verification's) is unavailable and says why. Reject is not.
    await expect(
      panel.getByRole("button", { name: t("admin.preview.approve") }).last(),
    ).toBeDisabled();
    await expect(
      panel.getByRole("button", { name: t("admin.preview.reject") }).last(),
    ).toBeEnabled();
    await expect(
      panel.getByText(t("admin.preview.approveNeedsDocuments")),
    ).toBeVisible();
  });

  test("approving the funding request records the operator's half", async ({
    page,
  }) => {
    // Its own company: approval needs every required document on file, and
    // this is the one stub company that has them all.
    await openPreview(page, "Complete Docs Co");

    const approve = page.getByRole("button", {
      name: t("admin.preview.approve"),
    });

    // Both halves are outstanding to begin with, so both offer a decision.
    // Asserted on the CONTROLS rather than on badge text: "PENDING" also
    // labels a document whose upload never completed, and matching on the
    // word alone would conflate the two.
    await expect(
      page.getByText(t("enums.verificationStatus.MANUAL_REVIEW")),
    ).toBeVisible();
    await expect(approve).toHaveCount(2);

    // The last belongs to the funding request; the first is the engine's.
    await approve.last().click();

    await expect(
      page.getByText(t("enums.approval.APPROVED"), { exact: true }).first(),
    ).toBeVisible();
    // One-way: the funding request's controls retire, leaving only the
    // engine's, so it cannot be re-decided from the panel.
    await expect(approve).toHaveCount(1);
  });

  test("resolving the parked verification flips the engine half", async ({
    page,
  }) => {
    // Its own company, so the approval above cannot pre-empt this.
    await openPreview(page, "Northwind IT");
    await expect(
      page.getByText(t("enums.verificationStatus.MANUAL_REVIEW")),
    ).toBeVisible();

    await page
      .getByRole("button", { name: t("admin.preview.approve") })
      .first()
      .click();

    await expect(
      page.getByText(t("enums.verificationStatus.MANUAL_REVIEW")),
    ).toHaveCount(0);
  });

  test("shows no score until the engine is run, then shows one", async ({
    page,
  }) => {
    // Northwind: its own company, because this test mutates score-run state
    // and the stub shares it across a worker.
    await openPreview(page, "Northwind IT");

    await expect(page.getByText(t("admin.preview.noScoreRun"))).toBeVisible();

    await page
      .getByRole("button", { name: t("admin.preview.runScoring") })
      .click();

    // The engine's answer, before the operator gives theirs.
    await expect(page.getByText(t("admin.preview.scoreHeading"))).toBeVisible();
    await expect(page.getByText("75.91")).toBeVisible();
    await expect(page.getByText("13.93%")).toBeVisible();
    // Status and decision are separate axes and both are shown.
    await expect(
      page.getByText(t("enums.scoreRunStatus.READY"), { exact: true }),
    ).toBeVisible();
    await expect(
      page
        .getByText(t("enums.scoreDecision.APPROVED"), { exact: true })
        .first(),
    ).toBeVisible();
  });

  test("a run can be run again while the request is undecided", async ({
    page,
  }) => {
    // Its own company: this one mutates score-run state too.
    await openPreview(page, "Ungraded Trading Co");
    const panel = page.getByRole("dialog");

    // The stub's score-run state is shared, so another test may already have
    // run this company: start from whichever button is showing.
    await runButton(panel).click();
    await expect(
      panel.getByText(t("admin.preview.scoreInsufficientHint")),
    ).toBeVisible();

    // The first run moves the request to UNDER_REVIEW; the button stays so
    // the operator can score again once the inputs change.
    const again = panel.getByRole("button", {
      name: t("admin.preview.rescore"),
    });
    await expect(again).toBeEnabled();
    await again.click();
    await expect(
      page.getByText(t("admin.preview.scoreInconclusive")).first(),
    ).toBeVisible();
  });

  test("an ungraded run reads as blocked, not as a pending score", async ({
    page,
  }) => {
    // Its own company: this one mutates score-run state too.
    await openPreview(page, "Ungraded Trading Co");

    // Shared stub state: the re-run test may have scored this company first.
    await runButton(page.getByRole("dialog")).click();

    // Scoped to the panel: the toast reports the same decision, and matching
    // page-wide picks up its copy and its aria-live announcement too.
    const panel = page.getByRole("dialog");

    // The engine answered — it just has no score to give.
    await expect(
      panel.getByText(t("admin.preview.scoreInsufficientHint")),
    ).toBeVisible();
    // And it says which inputs are missing, by name.
    await expect(
      panel.getByText(t("admin.preview.missingInput.kyc_aml_passed")),
    ).toBeVisible();

    // The decision badge carries the destructive token, not the neutral one
    // the status badge uses — that contrast is the whole point of the change.
    await expect(
      panel.getByText(t("enums.scoreDecision.INSUFFICIENT_DATA"), {
        exact: true,
      }),
    ).toHaveClass(/bg-destructive/);
    await expect(
      panel.getByText(t("enums.scoreRunStatus.READY"), { exact: true }),
    ).not.toHaveClass(/bg-destructive/);
  });

  // The gate. Each of these walks a company of its own through it, because the
  // stub records every decision and every approved score.
  test.describe("the two-approval gate", () => {
    const approveRequest = (panel: import("@playwright/test").Locator) =>
      // The last one belongs to the funding request; the first is the
      // business verification's. Exact, because "Approve score" contains it.
      panel
        .getByRole("button", { name: t("admin.preview.approve"), exact: true })
        .last();
    const approveScore = (panel: import("@playwright/test").Locator) =>
      panel.getByRole("button", { name: t("admin.preview.approveScore") });
    const status = (
      panel: import("@playwright/test").Locator,
      value: "DRAFT" | "ACTIVE",
    ) => panel.getByText(t(`enums.projectStatus.${value}`), { exact: true });

    test("approving the request alone leaves the business in Draft and says what is missing", async ({
      page,
    }) => {
      await openPreview(page, "Riverside Packaging Co");
      const panel = page.getByRole("dialog");
      await expect(status(panel, "DRAFT")).toBeVisible();

      // The engine's answer first: ready, and recommending approval.
      await runButton(panel).click();
      await expect(
        panel.getByText(t("enums.scoreRunStatus.READY"), { exact: true }),
      ).toBeVisible();

      // The operator's half. The business must NOT go live on this alone.
      await approveRequest(panel).click();
      await expect(panel.getByTestId("gate-hint")).toHaveText(
        t("admin.preview.awaitingScoreApproval"),
      );
      await expect(status(panel, "DRAFT")).toBeVisible();
      await expect(status(panel, "ACTIVE")).toHaveCount(0);

      // The engine's half is the missing one, and it can be given from here.
      await approveScore(panel).click();
      await expect(toast(page, t("admin.preview.scoreApproved"))).toBeVisible();
      await expect(status(panel, "ACTIVE")).toBeVisible();
      await expect(status(panel, "DRAFT")).toHaveCount(0);
      await expect(
        panel.getByText(t("enums.scoreRunStatus.LOCKED"), { exact: true }),
      ).toBeVisible();
      // Nothing is still missing, and it is one-way: no second approval.
      await expect(panel.getByTestId("gate-hint")).toHaveCount(0);
      await expect(approveScore(panel)).toHaveCount(0);

      // The table the preview was opened from says Active too, not Draft. The
      // toast takes the first Escape and the sheet the next.
      await expect(async () => {
        await page.keyboard.press("Escape");
        await expect(panel).toBeHidden({ timeout: 1000 });
      }).toPass();
      await expect(
        page.getByRole("button", { name: /Riverside Packaging Co/ }),
      ).toContainText(t("enums.projectStatus.ACTIVE"));
    });

    test("either half can come second: the score first, then the request", async ({
      page,
    }) => {
      await openPreview(page, "Harbor Logistics Co");
      const panel = page.getByRole("dialog");

      await runButton(panel).click();
      await approveScore(panel).click();
      await expect(panel.getByTestId("gate-hint")).toHaveText(
        t("admin.preview.awaitingRequestApproval"),
      );
      await expect(status(panel, "DRAFT")).toBeVisible();

      await approveRequest(panel).click();
      await expect(status(panel, "ACTIVE")).toBeVisible();
      await expect(panel.getByTestId("gate-hint")).toHaveCount(0);
    });

    test("a score with no verdict cannot be approved", async ({ page }) => {
      // The engine declined to grade this company, so there is nothing to
      // approve: approving it would put a business live on no score at all.
      await openPreview(page, "Ungraded Trading Co");
      const panel = page.getByRole("dialog");

      await runButton(panel).click();
      await expect(
        panel.getByText(t("admin.preview.scoreInsufficientHint")),
      ).toBeVisible();
      await expect(approveScore(panel)).toHaveCount(0);
    });
  });

  test("both tables offer a preview", async ({ page }) => {
    // Superseded an earlier test that asserted user rows were inert — they
    // were, until the account panel landed. Kept as a positive assertion so
    // the affordance cannot silently disappear from either table.
    await page.goto("/admin/users");
    await expect(page.locator('tbody tr[role="button"]').first()).toBeVisible();

    await page.goto("/admin/projects");
    await expect(page.locator('tbody tr[role="button"]').first()).toBeVisible();
  });
});

// --- Account status ---------------------------------------------------------
// SUSPENDED is a real deny server-side: the backend rejects the account on
// every request and refuses a new session. So this panel is a security
// control, and the guards on it matter as much as the happy path.

test.describe("the admin user preview", () => {
  // Rows are labelled "Open {name}" from the full name, so that is what the
  // accessible name matches on — not the email shown in the cell.
  const openUser = async (
    page: import("@playwright/test").Page,
    fullName: string,
  ) => {
    await page.goto("/admin/users");
    await page
      .getByRole("button", {
        name: t("admin.userPreview.openRow").replace("{name}", fullName),
      })
      .click();
  };

  test("a user row opens the account panel", async ({ context, page }) => {
    await signInAs(context, "admin");
    await openUser(page, STUB_USERS.investor.full_name);

    await expect(
      page.getByText(t("admin.userPreview.statusHeading")),
    ).toBeVisible();
    // The copy states what suspending actually does, because it does it.
    await expect(
      page.getByText(t("admin.userPreview.suspendWarning")),
    ).toBeVisible();
  });

  test("suspending a member account updates the table", async ({
    context,
    page,
  }) => {
    await signInAs(context, "admin");
    await openUser(page, STUB_USERS.sme.full_name);

    await page
      .getByRole("button", { name: t("admin.userPreview.statuses.SUSPENDED") })
      .click();

    // The outcome that matters: the row in the table now reads as suspended
    // (the raw enum is translated for display). Scoped to a table cell rather
    // than matching the bare word, which also appears on the panel's own
    // status badge and button.
    await expect(
      page.getByRole("cell", {
        name: t("enums.userStatus.SUSPENDED"),
        exact: true,
      }),
    ).toBeVisible();
  });

  test("an admin cannot change their own status", async ({ context, page }) => {
    // Self-suspension is unrecoverable, so the controls are withheld rather
    // than offered and then refused by the server.
    await signInAs(context, "admin");
    await openUser(page, "Admin Test");

    await expect(
      page.getByText(t("admin.userPreview.blockedSelf")),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: t("admin.userPreview.statuses.SUSPENDED"),
      }),
    ).toHaveCount(0);
  });
});

// KYC review: investor identity checks the engine parked because the ID number
// was already verified on another account. Each settling test owns its own
// stub row (see STUB_KYC_REVIEWS) so parallel tests never race over one.
test.describe("KYC review", () => {
  test.beforeEach(async ({ context }) => {
    await signInAs(context, "admin");
  });

  // Rows are labelled by the account holder's name (DataTable getRowLabel).
  const rowFor = (
    page: import("@playwright/test").Page,
    user: { full_name: string | null; email: string },
  ) =>
    page.getByRole("button", {
      name: t("admin.kycReviews.rowLabel", {
        name: user.full_name || user.email,
      }),
    });

  const openReview = async (
    page: import("@playwright/test").Page,
    user: { full_name: string | null; email: string },
  ) => {
    await page.goto("/admin/kyc-reviews");
    await rowFor(page, user).click();
    const panel = page.getByRole("dialog");
    await expect(panel).toBeVisible();
    return panel;
  };

  test("the sidebar links to the review queue", async ({ page }) => {
    await page.goto("/admin");
    await page
      .getByRole("link", { name: t("admin.sidebar.kycReviews") })
      .click();
    await expect(page).toHaveURL(/\/admin\/kyc-reviews$/);
    await expect(
      page.getByRole("heading", { name: t("admin.kycReviews.title") }),
    ).toBeVisible();
  });

  test("the queue lists parked attempts and why they were flagged", async ({
    page,
  }) => {
    await page.goto("/admin/kyc-reviews");

    const row = rowFor(page, STUB_KYC_REVIEW_LISTED.user);
    await expect(row).toContainText(STUB_KYC_REVIEW_LISTED.person_number);
    await expect(row).toContainText(t("admin.kycReviews.conflictOne"));
    // History is a separate tab: the already-verified owner is not queued.
    await expect(
      page.getByText(STUB_KYC_OWNER_APPROVED.user.email),
    ).toHaveCount(0);
  });

  test("the approved tab shows past verifications", async ({ page }) => {
    await page.goto("/admin/kyc-reviews");
    await page
      .getByRole("tab", { name: t("admin.kycReviews.tabs.APPROVED") })
      .click();

    await expect(rowFor(page, STUB_KYC_OWNER_APPROVED.user)).toBeVisible();
  });

  test("the panel shows both accounts and the submitted images", async ({
    page,
  }) => {
    const panel = await openReview(page, STUB_KYC_REVIEW_LISTED.user);

    await expect(panel).toContainText(t("admin.kycReviews.whyDuplicate"));
    // This attempt, and the account that already holds the ID number.
    await expect(panel).toContainText(STUB_KYC_REVIEW_LISTED.user.email);
    await expect(panel).toContainText(
      STUB_KYC_REVIEW_LISTED.conflicts[0].user.email,
    );
    await expect(panel).toContainText(
      t("admin.kycReviews.faceMatchValue", { score: 91 }),
    );
    // Two stored images render; the back was never stored and says so.
    await expect(
      panel.getByRole("img", { name: t("admin.kycReviews.images.id_front") }),
    ).toBeVisible();
    await expect(
      panel.getByRole("img", { name: t("admin.kycReviews.images.portrait") }),
    ).toBeVisible();
    await expect(panel).toContainText(t("admin.kycReviews.imageMissing"));
  });

  test("approving is disabled until acknowledged with a note of at least 20 chars", async ({
    page,
  }) => {
    const panel = await openReview(page, STUB_KYC_REVIEW_LISTED.user);
    const approve = panel.getByRole("button", {
      name: t("admin.kycReviews.approve"),
    });

    await expect(approve).toBeDisabled();
    await expect(panel).toContainText(
      t("admin.kycReviews.overrideNoteRequired", { count: 0 }),
    );

    await panel.getByRole("textbox").fill("   ");
    await expect(approve).toBeDisabled();

    await panel.getByRole("textbox").fill("Called the owner");
    await expect(approve).toBeDisabled();
    await expect(panel).toContainText(
      t("admin.kycReviews.overrideNoteRequired", { count: 16 }),
    );

    await panel
      .getByRole("textbox")
      .fill("Same person: lost access to the old account, confirmed by phone");
    await expect(approve).toBeDisabled();

    await panel.getByRole("checkbox").check();
    await expect(approve).toBeEnabled();
  });

  test("approving with a note takes the attempt out of the queue", async ({
    page,
  }) => {
    const user = STUB_KYC_REVIEW_TO_APPROVE.user;
    const panel = await openReview(page, user);

    await panel.getByRole("checkbox").check();
    await panel
      .getByRole("textbox")
      .fill("Same person: lost access to the old account, confirmed by phone");
    await panel
      .getByRole("button", { name: t("admin.kycReviews.approve") })
      .click();

    await expect(
      page.getByText(t("admin.kycReviews.resolved"), { exact: true }),
    ).toBeVisible();
    await expect(panel).toBeHidden();
    await expect(rowFor(page, user)).toHaveCount(0);
  });

  test("rejecting needs no note and takes the attempt out of the queue", async ({
    page,
  }) => {
    const user = STUB_KYC_REVIEW_TO_REJECT.user;
    const panel = await openReview(page, user);

    await expect(panel).toContainText(t("admin.kycReviews.rejectHint"));
    await panel
      .getByRole("button", { name: t("admin.kycReviews.reject") })
      .click();

    await expect(
      page.getByText(t("admin.kycReviews.resolved"), { exact: true }),
    ).toBeVisible();
    await expect(rowFor(page, user)).toHaveCount(0);
    await page
      .getByRole("tab", { name: t("admin.kycReviews.tabs.REJECTED") })
      .click();
    await expect(rowFor(page, user)).toBeVisible();
  });

  test("a decided attempt offers no decision controls", async ({ page }) => {
    await page.goto("/admin/kyc-reviews");
    await page
      .getByRole("tab", { name: t("admin.kycReviews.tabs.APPROVED") })
      .click();
    await rowFor(page, STUB_KYC_OWNER_APPROVED.user).click();
    const panel = page.getByRole("dialog");

    await expect(panel).toContainText(t("admin.kycReviews.alreadyDecided"));
    await expect(
      panel.getByRole("button", { name: t("admin.kycReviews.approve") }),
    ).toHaveCount(0);
  });
});

test("non-admins cannot open the KYC review queue", async ({
  context,
  page,
}) => {
  await signInAs(context, "investor");
  await page.goto("/admin/kyc-reviews");
  await expect(page).not.toHaveURL(/\/admin\/kyc-reviews/);
});

test.describe("as an admin on mobile viewport", () => {
  test.use({ viewport: { width: 375, height: 667 }, isMobile: true });

  test.beforeEach(async ({ context }) => {
    await signInAs(context, "admin");
  });

  test("the navigation bar is visible and opens the menu drawer to navigate between admin pages", async ({
    page,
  }) => {
    await page.goto("/admin");

    // The mobile navigation toggle is visible
    const menuBtn = page.getByRole("button", { name: t("common.toggleMenu") });
    await expect(menuBtn).toBeVisible();

    // Opening the menu drawer shows the admin navigation links
    await menuBtn.click();
    const emailLink = page.getByRole("link", {
      name: t("admin.sidebar.email"),
    });
    await expect(emailLink).toBeVisible();

    // Clicking a link navigates to that admin page
    await emailLink.click();
    await expect(page).toHaveURL(/\/admin\/email$/);

    // On the new page, the mobile navigation bar is still present
    await expect(menuBtn).toBeVisible();
  });
});
