import { test, expect } from "@playwright/test";

import {
  STUB_ADMIN_STATS,
  STUB_ADMIN_USERS,
  STUB_USERS,
} from "../stub-api/fixtures";
import { signInAs } from "../support/auth";
import { t } from "../support/i18n";

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

  test("the overview lists users from the API", async ({ page }) => {
    await page.goto("/admin");

    for (const row of STUB_ADMIN_USERS) {
      await expect(page.getByText(row.email)).toBeVisible();
    }
  });

  test("audit logs render with actor and action", async ({ page }) => {
    await page.goto("/admin/audit-logs");

    await expect(
      page.getByRole("heading", { name: t("admin.auditLogs.title") }),
    ).toBeVisible();
    await expect(page.getByText("SIGN_IN").first()).toBeVisible();
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
// A funding request needs BOTH the verification engine's approval and an
// operator's. The preview is where an operator sees which half is missing and
// supplies theirs.
//
// The stub records DECISIONS, and that state is mutable and shared by every
// test in a worker (same caveat as the 2FA fixture). So each test that decides
// something owns a different project — otherwise one test's approval is the
// next test's starting state.

test.describe("the admin project preview", () => {
  const openPreview = async (
    page: import("@playwright/test").Page,
    company: string,
  ) => {
    await page.goto("/admin");
    await page.getByRole("button", { name: t("admin.table.projects") }).click();
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
      page.getByText(t("admin.preview.engineHeading")),
    ).toBeVisible();
    await expect(
      page.getByText(t("admin.preview.applicationsHeading")),
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
    await expect(page.getByText("PENDING").last()).toBeVisible();
  });

  test("approving the funding request records the operator's half", async ({
    page,
  }) => {
    await openPreview(page, "Delta Foods JSC");

    const approve = page.getByRole("button", {
      name: t("admin.preview.approve"),
    });

    // Both halves are outstanding to begin with, so both offer a decision.
    // Asserted on the CONTROLS rather than on badge text: "PENDING" also
    // labels a document whose upload never completed, and matching on the
    // word alone would conflate the two.
    await expect(page.getByText("MANUAL_REVIEW")).toBeVisible();
    await expect(approve).toHaveCount(2);

    // The last belongs to the funding request; the first is the engine's.
    await approve.last().click();

    await expect(page.getByText("APPROVED")).toBeVisible();
    // One-way: the funding request's controls retire, leaving only the
    // engine's, so it cannot be re-decided from the panel.
    await expect(approve).toHaveCount(1);
  });

  test("resolving the parked verification flips the engine half", async ({
    page,
  }) => {
    // Its own company, so the approval above cannot pre-empt this.
    await openPreview(page, "Northwind IT");
    await expect(page.getByText("MANUAL_REVIEW")).toBeVisible();

    await page
      .getByRole("button", { name: t("admin.preview.approve") })
      .first()
      .click();

    await expect(page.getByText("MANUAL_REVIEW")).toHaveCount(0);
  });

  test("user rows stay inert — there is no preview for them", async ({
    page,
  }) => {
    // onRowClick is passed only to the projects table. A row that looks
    // clickable and does nothing is worse than no affordance at all.
    await page.goto("/admin");
    await page.getByRole("button", { name: t("admin.table.users") }).click();
    await expect(page.locator('tbody tr[role="button"]')).toHaveCount(0);
  });
});

// --- Account status ---------------------------------------------------------
// SUSPENDED is a real deny server-side: the backend rejects the account on
// every request and refuses a new session. So this panel is a security
// control, and the guards on it matter as much as the happy path.

test.describe("the admin user preview", () => {
  const openUser = async (
    page: import("@playwright/test").Page,
    email: string,
  ) => {
    await page.goto("/admin");
    await page.getByRole("button", { name: new RegExp(email) }).click();
  };

  test("a user row opens the account panel", async ({ context, page }) => {
    await signInAs(context, "admin");
    await openUser(page, STUB_USERS.investor.email);

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
    await openUser(page, STUB_USERS.sme.email);

    await page
      .getByRole("button", { name: t("admin.userPreview.statuses.SUSPENDED") })
      .click();

    // The panel closes and the row reflects the new status.
    await expect(
      page.getByText(t("admin.userPreview.statusHeading")),
    ).toHaveCount(0);
    await expect(page.getByText("SUSPENDED").first()).toBeVisible();
  });

  test("an admin cannot change their own status", async ({ context, page }) => {
    // Self-suspension is unrecoverable, so the controls are withheld rather
    // than offered and then refused by the server.
    await signInAs(context, "admin");
    await openUser(page, STUB_USERS.admin.email);

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
