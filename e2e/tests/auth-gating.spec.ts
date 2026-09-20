import { test, expect } from "@playwright/test";

import { signInAs } from "../support/auth";
import { t } from "../support/i18n";

/**
 * The proxy.ts route matrix.
 *
 * This is the suite's highest-value file: every rule here is enforced only on
 * the server, in a single 337-line function, and nothing else in the repo tests
 * it. Several of the rules are security boundaries (role separation, the
 * Decree 94 verification gate), and the ordering between them is load-bearing —
 * the comments in proxy.ts call out gates that must not "ping-pong".
 *
 * Unit tests cannot cover this: the decisions depend on server-side fetches to
 * /users/me and /gverify/*\/status, which only exist end to end.
 */

test.describe("unauthenticated visitors", () => {
  test("are redirected from a protected route to login, with a return path", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(
      /\/login\?from=%2Fdashboard|\/login\?from=\/dashboard/,
    );
  });

  for (const route of [
    "/dashboard/transactions",
    "/dashboard/analytics",
    "/dashboard/security",
    "/project-application",
    "/admin",
    "/select-role",
  ]) {
    test(`cannot reach ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
    });
  }

  test("can still reach the public landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/");
  });

  test("are sent to login from /verify-email without a token", async ({
    page,
  }) => {
    await page.goto("/verify-email");
    await expect(page).toHaveURL(/\/login\?from=/);
  });

  test("keep the emailed verification link, which carries its own credential", async ({
    page,
  }) => {
    // Regression: redirecting this to /login threw the token away, so the first
    // verification email appeared to do nothing. See proxy.ts.
    await page.goto("/verify-email?token=abc123");
    await expect(page).toHaveURL(/\/verify-email\?token=abc123/);
  });
});

test.describe("role-based landing", () => {
  test("an investor on /login is sent to the dashboard", async ({
    page,
    context,
  }) => {
    await signInAs(context, "investor");
    await page.goto("/login");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("an admin lands on /admin rather than /dashboard", async ({
    page,
    context,
  }) => {
    await signInAs(context, "admin");
    await page.goto("/");
    await expect(page).toHaveURL(/\/admin$/);
  });

  test("a user with no role must pick one first", async ({ page, context }) => {
    await signInAs(context, "noRole");
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/select-role$/);
  });

  test("a user who already has a role is kept off /select-role", async ({
    page,
    context,
  }) => {
    await signInAs(context, "sme");
    await page.goto("/select-role");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("an unverified email is diverted to /verify-email and held there", async ({
    page,
    context,
  }) => {
    await signInAs(context, "unverifiedEmail");
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/verify-email$/);

    // The gate must not fight the select-role gate — an unverified user stays
    // put instead of bouncing between the two.
    await page.goto("/dashboard/transactions");
    await expect(page).toHaveURL(/\/verify-email$/);
  });
});

test.describe("role separation", () => {
  test("an investor cannot enter the admin area", async ({ page, context }) => {
    await signInAs(context, "investor");
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("an SME cannot enter the admin area", async ({ page, context }) => {
    await signInAs(context, "sme");
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("a plain admin cannot reach the system-settings area", async ({
    page,
    context,
  }) => {
    await signInAs(context, "admin");
    await page.goto("/admin/system");
    await expect(page).toHaveURL(/\/admin$/);
  });

  test("a system admin can reach the system-settings area", async ({
    page,
    context,
  }) => {
    await signInAs(context, "systemAdmin");
    await page.goto("/admin/system");
    await expect(page).toHaveURL(/\/admin\/system$/);
  });

  test("an SME cannot browse the investor marketplace", async ({
    page,
    context,
  }) => {
    await signInAs(context, "sme");
    await page.goto("/dashboard/projects");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("an investor can browse the marketplace", async ({ page, context }) => {
    await signInAs(context, "investor");
    await page.goto("/dashboard/projects");
    await expect(page).toHaveURL(/\/dashboard\/projects$/);
  });
});

test.describe("on-demand verification gate", () => {
  // Decree 94: verification is demanded at the value action, not at login.

  test("an unapproved investor is diverted from investing to /kyc, remembering the action", async ({
    page,
    context,
  }) => {
    await signInAs(context, "unapprovedInvestor");
    await page.goto("/dashboard/invest?amount=1000000");
    await expect(page).toHaveURL(/\/kyc\?next=%2Fdashboard%2Finvest/);
  });

  test("an unapproved SME is diverted from applying for funding to /kyc", async ({
    page,
    context,
  }) => {
    await signInAs(context, "unapprovedSme");
    await page.goto("/project-application");
    await expect(page).toHaveURL(/\/kyc\?next=%2Fproject-application/);
  });

  test("an approved investor is not stranded on /kyc", async ({
    page,
    context,
  }) => {
    await signInAs(context, "investor");
    await page.goto("/kyc");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("an approved user reaching /kyc with ?next= is returned to the action", async ({
    page,
    context,
  }) => {
    // Deliberately the SME with NO project: /project-application redirects an
    // SME who already has one back to the dashboard, client-side (see the note
    // at the end of proxy.ts). Using the project-owning fixture here tests the
    // application page's own guard, not the ?next= handoff.
    await signInAs(context, "smeNoProject");
    await page.goto("/kyc?next=/project-application");
    await expect(page).toHaveURL(/\/project-application$/);
  });

  test("an SME that already has a project is kept off the application form", async ({
    page,
    context,
  }) => {
    // The other half of the rule above, asserted on purpose rather than by
    // accident.
    await signInAs(context, "sme");
    await page.goto("/project-application");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("?next= cannot be used as an open redirect", async ({
    page,
    context,
  }) => {
    // safeNextPath() rejects protocol-relative targets; the user must land on
    // their own dashboard instead of an external host.
    await signInAs(context, "investor");
    await page.goto("/kyc?next=//evil.example.com");
    await expect(page).toHaveURL(/127\.0\.0\.1:\d+\/dashboard$/);
  });

  test("ungated routes never demand verification", async ({
    page,
    context,
  }) => {
    // An unapproved investor still browses freely — verification is not a
    // blanket gate after login.
    await signInAs(context, "unapprovedInvestor");
    await page.goto("/dashboard/transactions");
    await expect(page).toHaveURL(/\/dashboard\/transactions$/);
  });
});

// --- Post-verification redirect ---------------------------------------------
// The whole point of the ?next= handoff is that finishing verification returns
// the SME to the action they were blocked on. Reported broken by hand: the
// screen reached "Business verified" and then sat there until a manual refresh.

test.describe("finishing KYB returns the SME to their action", () => {
  test("redirects to ?next= without a manual refresh", async ({
    page,
    context,
  }) => {
    await signInAs(context, "unapprovedSme");

    // Blocked, exactly as auth-gating asserts above.
    await page.goto("/project-application");
    await expect(page).toHaveURL(/\/kyc\?next=%2Fproject-application/);

    // Stage a certificate and submit it. The stub answers APPROVED
    // synchronously, like the real provider.
    await page
      .locator('input[type="file"]')
      .first()
      .setInputFiles({
        name: "certificate.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.4 stub certificate"),
      });
    await page
      .getByRole("button", { name: t("kyc.continueBtn"), exact: true })
      .click();
    await page
      .getByRole("button", { name: t("kyc.gv.submitBtn"), exact: true })
      .click();

    // The confirmation appears...
    await expect(page.getByText(t("kyc.kyb.approvedTitle"))).toBeVisible();

    // ...and then the app moves them on by itself. Asserted as "no longer on
    // /kyc" rather than a specific destination: this SME already has a project
    // (projectsFor), so /project-application bounces them straight on to the
    // dashboard. Pinning the intermediate URL made this race the client-side
    // hop and pass only by luck.
    //
    // No reload here on purpose — a page.reload() would mask the bug, because
    // the proxy redirects correctly on a fresh request. It is the client-side
    // hop that was failing.
    await expect(page).not.toHaveURL(/\/kyc/, { timeout: 10_000 });
  });
});

// --- Suspended accounts -----------------------------------------------------
// The backend refuses a suspended account on every authenticated route, so its
// cookie is valid but useless. Without a dedicated destination the user loops:
// protected route -> /login -> correct password -> refused, with no explanation.

test.describe("a suspended account", () => {
  test("is sent to /suspended instead of the login loop", async ({
    page,
    context,
  }) => {
    await signInAs(context, "suspended");
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/suspended$/);
    // By role: the title is a substring of the body copy ("...while your
    // account is suspended"), so a bare text match hits both.
    await expect(
      page.getByRole("heading", { name: t("suspended.title") }),
    ).toBeVisible();
  });

  test("is told what happened and how to reach someone", async ({
    page,
    context,
  }) => {
    await signInAs(context, "suspended");
    await page.goto("/suspended");

    await expect(page.getByText(t("suspended.body"))).toBeVisible();
    await expect(
      page.getByRole("link", { name: t("suspended.contactBtn") }),
    ).toBeVisible();
  });

  test("cannot reach any other route", async ({ page, context }) => {
    await signInAs(context, "suspended");

    for (const route of ["/dashboard", "/admin", "/kyc", "/select-role"]) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/suspended$/);
    }
  });

  test("an active account cannot reach /suspended", async ({
    page,
    context,
  }) => {
    // A dead end for one account must not be a dead end for everyone else.
    await signInAs(context, "investor");
    await page.goto("/suspended");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("a signed-out visitor cannot reach /suspended", async ({ page }) => {
    await page.goto("/suspended");
    await expect(page).toHaveURL(/\/login/);
  });
});

// --- An expired session -----------------------------------------------------
// The access_token cookie outlives the token inside it. Until this was fixed
// the proxy read "cookie present, user unresolvable" as "signed in with no
// role" and sent the user to /select-role — reported in the field as an admin
// being asked to choose a role again after a while.

test.describe("an expired session", () => {
  test("is sent to login, not to the role picker", async ({
    page,
    context,
  }) => {
    await signInAs(context, "expiredSession");
    await page.goto("/admin");

    await expect(page).toHaveURL(/\/login/);
    await expect(page).not.toHaveURL(/\/select-role/);
  });

  test("keeps where the user was heading", async ({ page, context }) => {
    await signInAs(context, "expiredSession");
    await page.goto("/dashboard/transactions");

    await expect(page).toHaveURL(/from=%2Fdashboard%2Ftransactions/);
  });

  test("clears the stale cookie so the next request is cleanly anonymous", async ({
    page,
    context,
  }) => {
    await signInAs(context, "expiredSession");
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);

    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === "access_token")?.value ?? "").toBe(
      "",
    );
  });
});
