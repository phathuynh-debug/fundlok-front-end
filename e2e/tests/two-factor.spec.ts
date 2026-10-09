import { test, expect } from "@playwright/test";

import { STUB_PASSWORD, STUB_USERS } from "../stub-api/fixtures";
import { signInAs } from "../support/auth";
import { t } from "../support/i18n";
import { settle, toast } from "../support/ui";

/**
 * Two-factor authentication, end to end.
 *
 * The stub API accepts a fixed code (123456) and a fixed recovery code
 * (RECOVERY01) — the browser cannot compute an RFC 6238 code, and importing a
 * TOTP library into the suite would test that library rather than this UI. The
 * real code path is covered by tests/auth/test_totp.py on the backend.
 *
 * What these tests are for is the part only a browser can prove: that the
 * password step stops, that the code step appears, and that no session exists
 * until the code is accepted.
 */

// Serial: enrolment is a state machine in the stub, and these tests walk it
// through its states. Running them against each other in parallel would have
// them fighting over one process's state.
test.describe.configure({ mode: "serial" });

const CODE = "123456";
const RECOVERY_CODE = "RECOVERY01";
// Its own identity — see the note on STUB_USERS.twoFactor.
const USER = "twoFactor" as const;

/** Put the stub back to "2FA off" before each test. */
const resetTwoFactor = async (page: import("@playwright/test").Page) => {
  const response = await page.request.post("/api/_test/2fa/reset", {
    data: { user: USER },
  });
  expect(response.ok(), "stub reset failed").toBe(true);
};

/**
 * The protections row, scoped to the protections list.
 *
 * Not a bare getByRole("listitem"): Radix renders a toast as an <li>, and the
 * success toast reads "Two-factor authentication is on" — which matched the row
 * filter and made the query ambiguous.
 */
const totpRow = (page: import("@playwright/test").Page) =>
  page
    .locator("ul")
    .filter({
      hasText: t("dashboard.security.protections.items.password"),
    })
    .getByRole("listitem")
    .filter({ hasText: t("dashboard.security.protections.items.totp") });

const enrol = async (page: import("@playwright/test").Page) => {
  await page.goto("/dashboard/security");
  await settle(page);

  await totpRow(page)
    .getByRole("button", {
      name: t("dashboard.security.protections.action.turnOn"),
    })
    .click();

  const dialog = page.getByRole("dialog", {
    name: t("security.twoFactor.title"),
  });
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("button", { name: t("security.twoFactor.next") })
    .click();
  await dialog.getByLabel(t("security.twoFactor.codeLabel")).fill(CODE);
  await dialog
    .getByRole("button", { name: t("security.twoFactor.verifyAndEnable") })
    .click();

  return dialog;
};

test.describe("enrolment", () => {
  test.beforeEach(async ({ context, page }) => {
    await signInAs(context, USER);
    await resetTwoFactor(page);
  });

  test("the security row is no longer 'coming soon'", async ({ page }) => {
    // It was hardcoded unavailable while there was no backend. This is the
    // regression guard for that: the row must be actionable.
    await page.goto("/dashboard/security");
    await settle(page);

    const row = totpRow(page);

    await expect(row).toContainText(
      t("dashboard.security.protections.state.off"),
    );
    await expect(
      row.getByRole("button", {
        name: t("dashboard.security.protections.action.turnOn"),
      }),
    ).toBeEnabled();
    await expect(
      row.getByRole("button", {
        name: t("dashboard.security.protections.action.unavailable"),
      }),
    ).toHaveCount(0);
  });

  test("shows a scannable QR and the secret for manual entry", async ({
    page,
  }) => {
    await page.goto("/dashboard/security");
    await settle(page);
    await totpRow(page)
      .getByRole("button", {
        name: t("dashboard.security.protections.action.turnOn"),
      })
      .click();

    const dialog = page.getByRole("dialog", {
      name: t("security.twoFactor.title"),
    });
    // react-qr-code renders an <svg>; its presence is what proves the URI
    // arrived and was encoded, not just that the dialog opened.
    await expect(dialog.locator("svg").first()).toBeVisible();
    // The manual key matters for anyone whose camera cannot see the screen.
    await expect(dialog.getByText("JBSWY3DPEHPK3PXP")).toBeVisible();
  });

  test("rejects a wrong code without enabling anything", async ({ page }) => {
    await page.goto("/dashboard/security");
    await settle(page);
    await totpRow(page)
      .getByRole("button", {
        name: t("dashboard.security.protections.action.turnOn"),
      })
      .click();

    const dialog = page.getByRole("dialog", {
      name: t("security.twoFactor.title"),
    });
    await dialog
      .getByRole("button", { name: t("security.twoFactor.next") })
      .click();
    await dialog.getByLabel(t("security.twoFactor.codeLabel")).fill("000000");
    await dialog
      .getByRole("button", { name: t("security.twoFactor.verifyAndEnable") })
      .click();

    await expect(
      dialog.getByText(t("security.twoFactor.codeInvalid")),
    ).toBeVisible();
    // Still on the code step, nothing enabled.
    await expect(
      dialog.getByText(t("security.twoFactor.recoveryWarning")),
    ).toHaveCount(0);
  });

  test("only accepts six digits, and ignores anything else typed", async ({
    page,
  }) => {
    await page.goto("/dashboard/security");
    await settle(page);
    await totpRow(page)
      .getByRole("button", {
        name: t("dashboard.security.protections.action.turnOn"),
      })
      .click();

    const dialog = page.getByRole("dialog", {
      name: t("security.twoFactor.title"),
    });
    await dialog
      .getByRole("button", { name: t("security.twoFactor.next") })
      .click();

    const input = dialog.getByLabel(t("security.twoFactor.codeLabel"));
    await input.fill("");
    await input.pressSequentially("12ab34cd5678");

    // Letters dropped, capped at 6 — a field that silently accepts letters
    // produces a "why is my code wrong" support ticket.
    await expect(input).toHaveValue("123456");
  });

  test("shows recovery codes exactly once, and says so", async ({ page }) => {
    const dialog = await enrol(page);

    await expect(
      dialog.getByText(t("security.twoFactor.recoveryWarning")),
    ).toBeVisible();
    // Eight codes, and the fixed one the stub will accept later.
    await expect(dialog.getByText(RECOVERY_CODE)).toBeVisible();
    await expect(dialog.getByRole("listitem")).toHaveCount(8);
  });

  test("the row reflects the new state after enrolling", async ({ page }) => {
    const dialog = await enrol(page);
    await dialog
      .getByRole("button", { name: t("security.twoFactor.savedThem") })
      .click();

    await expect(
      toast(page, t("security.twoFactor.enabledTitle")),
    ).toBeVisible();

    const row = totpRow(page);
    await expect(row).toContainText(
      t("dashboard.security.protections.state.on"),
    );
  });

  test("enabling raises the security posture score", async ({ page }) => {
    // 2FA carries the heaviest weight on the list (30), so the score has to
    // move — a row that flips without changing the score would mean the posture
    // card is decorative.
    await page.goto("/dashboard/security");
    await settle(page);
    const before = await page.locator("main").last().innerText();

    const dialog = await enrol(page);
    await dialog
      .getByRole("button", { name: t("security.twoFactor.savedThem") })
      .click();
    await settle(page);

    const after = await page.locator("main").last().innerText();
    expect(after).not.toBe(before);
    expect(after).toContain("69");
  });
});

test.describe("sign-in with 2FA", () => {
  // A fresh context per test: these drive the real login form, so a seeded
  // cookie would skip the very thing under test.
  test.beforeEach(async ({ context, page }) => {
    await signInAs(context, USER);
    await resetTwoFactor(page);
    const dialog = await enrol(page);
    await dialog
      .getByRole("button", { name: t("security.twoFactor.savedThem") })
      .click();
    await settle(page);
    await context.clearCookies();
  });

  const signIn = async (page: import("@playwright/test").Page) => {
    await page.goto("/login");
    await page
      .getByLabel(t("auth.login.emailLabel"))
      .fill(STUB_USERS.twoFactor.email);
    await page.getByLabel(t("auth.login.passwordLabel")).fill(STUB_PASSWORD);
    await page
      .getByRole("button", { name: t("auth.login.submit"), exact: true })
      .click();
  };

  test("a correct password is not enough to get in", async ({
    page,
    context,
  }) => {
    await signIn(page);

    await expect(
      page.getByText(t("auth.login.twoFactorTitle"), { exact: true }),
    ).toBeVisible();

    // The decisive assertion: no session cookie exists yet.
    const cookie = (await context.cookies()).find(
      (c) => c.name === "access_token",
    );
    expect(cookie, "a session was created before the second factor").toBe(
      undefined,
    );
  });

  test("the password fields are replaced, not left on screen", async ({
    page,
  }) => {
    await signIn(page);
    await expect(
      page.getByText(t("auth.login.twoFactorTitle"), { exact: true }),
    ).toBeVisible();

    // Re-submitting the password would burn the five-minute challenge.
    await expect(page.getByLabel(t("auth.login.emailLabel"))).toHaveCount(0);
  });

  test("a valid code completes the sign-in", async ({ page, context }) => {
    await signIn(page);
    await page.getByLabel(t("auth.login.twoFactorCodeLabel")).fill(CODE);
    await page
      .getByRole("button", { name: t("auth.login.twoFactorVerify") })
      .click();

    await expect(page).toHaveURL(/\/dashboard$/);
    const cookie = (await context.cookies()).find(
      (c) => c.name === "access_token",
    );
    expect(cookie).toBeTruthy();
  });

  test("a wrong code keeps the user out and explains why", async ({
    page,
    context,
  }) => {
    await signIn(page);
    await page.getByLabel(t("auth.login.twoFactorCodeLabel")).fill("999999");
    await page
      .getByRole("button", { name: t("auth.login.twoFactorVerify") })
      .click();

    await expect(page.getByText(t("auth.login.twoFactorFailed"))).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
    expect(
      (await context.cookies()).find((c) => c.name === "access_token"),
    ).toBe(undefined);
  });

  test("a recovery code works when the phone is gone", async ({ page }) => {
    await signIn(page);
    await page
      .getByLabel(t("auth.login.twoFactorCodeLabel"))
      .fill(RECOVERY_CODE);
    await page
      .getByRole("button", { name: t("auth.login.twoFactorVerify") })
      .click();

    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("going back returns to the password form", async ({ page }) => {
    await signIn(page);
    await page
      .getByRole("button", { name: t("auth.login.twoFactorBack") })
      .click();

    await expect(page.getByLabel(t("auth.login.emailLabel"))).toBeVisible();
    await expect(
      page.getByText(t("auth.login.twoFactorTitle"), { exact: true }),
    ).toHaveCount(0);
  });
});

test.describe("turning it off", () => {
  test.beforeEach(async ({ context, page }) => {
    await signInAs(context, USER);
    await resetTwoFactor(page);
    const dialog = await enrol(page);
    await dialog
      .getByRole("button", { name: t("security.twoFactor.savedThem") })
      .click();
    await settle(page);
  });

  const openDisable = async (page: import("@playwright/test").Page) => {
    await totpRow(page)
      .getByRole("button", {
        name: t("dashboard.security.protections.action.turnOff"),
      })
      .click();

    const dialog = page.getByRole("dialog", {
      name: t("security.twoFactor.disableTitle"),
    });
    await expect(dialog).toBeVisible();
    return dialog;
  };

  test("asks for the password as well as a code", async ({ page }) => {
    // A session alone must not be able to strip the control that protects the
    // account when a session leaks.
    const dialog = await openDisable(page);

    await expect(
      dialog.getByLabel(t("security.changePassword.currentLabel")),
    ).toBeVisible();
    await expect(
      dialog.getByLabel(t("security.twoFactor.disableCodeLabel")),
    ).toBeVisible();
    // Nothing submittable until both are filled.
    await expect(
      dialog.getByRole("button", {
        name: t("security.twoFactor.confirmDisable"),
      }),
    ).toBeDisabled();
  });

  test("refuses a wrong password", async ({ page }) => {
    const dialog = await openDisable(page);
    await dialog
      .getByLabel(t("security.changePassword.currentLabel"))
      .fill("not-my-password");
    await dialog
      .getByLabel(t("security.twoFactor.disableCodeLabel"))
      .fill(CODE);
    await dialog
      .getByRole("button", { name: t("security.twoFactor.confirmDisable") })
      .click();

    await expect(
      dialog.getByText(t("security.twoFactor.disableWrongPassword")),
    ).toBeVisible();
  });

  test("turns it off with the password and a code", async ({ page }) => {
    const dialog = await openDisable(page);
    await dialog
      .getByLabel(t("security.changePassword.currentLabel"))
      .fill(STUB_PASSWORD);
    await dialog
      .getByLabel(t("security.twoFactor.disableCodeLabel"))
      .fill(CODE);
    await dialog
      .getByRole("button", { name: t("security.twoFactor.confirmDisable") })
      .click();

    await expect(
      toast(page, t("security.twoFactor.disabledTitle")),
    ).toBeVisible();

    const row = totpRow(page);
    await expect(row).toContainText(
      t("dashboard.security.protections.state.off"),
    );
  });
});

test.describe("when the server cannot offer 2FA", () => {
  test.beforeEach(async ({ context, page }) => {
    await signInAs(context, USER);
    await resetTwoFactor(page);
  });

  test("says so instead of showing a dialog that never loads", async ({
    page,
  }) => {
    // The regression this guards: with TOTP_ENCRYPTION_KEY unset the backend
    // answers 503, and the dialog used to sit on a loading skeleton with the
    // secret rendered as "…" — indistinguishable from a hang.
    const response = await page.request.post("/api/_test/2fa/unavailable", {
      data: { unavailable: true },
    });
    expect(response.ok()).toBe(true);

    await page.goto("/dashboard/security");
    await settle(page);
    await totpRow(page)
      .getByRole("button", {
        name: t("dashboard.security.protections.action.turnOn"),
      })
      .click();

    const dialog = page.getByRole("dialog", {
      name: t("security.twoFactor.title"),
    });
    await expect(
      dialog.getByText(t("security.twoFactor.setupFailedTitle")),
    ).toBeVisible();

    // And the step cannot be advanced past a secret that does not exist.
    await expect(
      dialog.getByRole("button", { name: t("security.twoFactor.next") }),
    ).toHaveCount(0);
    await expect(
      dialog.getByRole("button", { name: t("security.twoFactor.retry") }),
    ).toBeVisible();
  });

  test("retrying works once the server is configured", async ({ page }) => {
    await page.request.post("/api/_test/2fa/unavailable", {
      data: { unavailable: true },
    });
    await page.goto("/dashboard/security");
    await settle(page);
    await totpRow(page)
      .getByRole("button", {
        name: t("dashboard.security.protections.action.turnOn"),
      })
      .click();

    const dialog = page.getByRole("dialog", {
      name: t("security.twoFactor.title"),
    });
    await expect(
      dialog.getByText(t("security.twoFactor.setupFailedTitle")),
    ).toBeVisible();

    await page.request.post("/api/_test/2fa/unavailable", {
      data: { unavailable: false },
    });
    await dialog
      .getByRole("button", { name: t("security.twoFactor.retry") })
      .click();

    // Back to the scan step, with a real secret.
    await expect(dialog.getByText("JBSWY3DPEHPK3PXP")).toBeVisible();
  });
});
