import { test, expect, type BrowserContext, type Page } from "@playwright/test";

import { signInAs } from "../support/auth";
import { t } from "../support/i18n";
import { addVirtualAuthenticator } from "../support/webauthn";

// Passkeys, driven by a real (virtual) authenticator rather than a mock of
// navigator.credentials — see e2e/support/webauthn.ts for why, and for what
// this does and does not prove.
//
// These specs address the app as `localhost`, unlike the rest of the suite.
// WebAuthn refuses a bare IP as a Relying Party ID — "SecurityError: This is
// an invalid domain" — so on 127.0.0.1 the ceremony fails before it reaches
// the authenticator. Same server, same port, different spelling of the host.
const APP = "http://localhost:3100";

/**
 * The protection row, matched on its description rather than its title.
 *
 * "Passkey" alone is ambiguous: the success toast is also a list item and
 * contains the word, as does each registered device inside the dialog. The
 * description belongs to this row and nothing else.
 */
const passkeyRow = (page: Page) =>
  page.getByRole("listitem").filter({
    hasText: t("dashboard.security.protections.desc.passkey"),
  });

/** Gives each test its own bucket of registered passkeys in the stub. */
async function isolate(context: BrowserContext, scope: string) {
  await context.addCookies([
    {
      name: "stub_scope",
      value: scope,
      domain: "localhost",
      path: "/",
      sameSite: "Lax",
    },
  ]);
}

test.describe("managing passkeys", () => {
  test.beforeEach(async ({ context }, testInfo) => {
    await signInAs(context, "investor", { domain: "localhost" });
    await isolate(context, testInfo.title);
  });

  test("registers one from the security screen and lists it", async ({
    page,
  }) => {
    const authenticator = await addVirtualAuthenticator(page);
    await page.goto(`${APP}/dashboard/security`);

    const row = passkeyRow(page);
    await row
      .getByRole("button", {
        name: t("dashboard.security.protections.action.turnOn"),
      })
      .click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText(t("dashboard.security.passkeys.empty"));

    await dialog
      .getByLabel(t("dashboard.security.passkeys.nameLabel"))
      .fill("MacBook Touch ID");
    await dialog
      .getByRole("button", { name: t("dashboard.security.passkeys.add") })
      .click();

    // The device now appears in the list, named as typed.
    await expect(dialog.getByText("MacBook Touch ID")).toBeVisible();
    await expect(dialog).not.toContainText(
      t("dashboard.security.passkeys.empty"),
    );

    await authenticator.detach();
  });

  test("flips the protection row on once a passkey exists", async ({
    page,
  }) => {
    // The row is the whole reason the score can now reach 100.
    const authenticator = await addVirtualAuthenticator(page);
    await page.goto(`${APP}/dashboard/security`);

    const row = passkeyRow(page);
    await expect(row).toContainText(
      t("dashboard.security.protections.state.off"),
    );

    await row
      .getByRole("button", {
        name: t("dashboard.security.protections.action.turnOn"),
      })
      .click();
    const dialog = page.getByRole("dialog");
    await dialog
      .getByRole("button", { name: t("dashboard.security.passkeys.add") })
      .click();
    // Scoped to the list: in Vietnamese the dialog title is also "Passkey",
    // so an unscoped match is ambiguous once the new device renders.
    await expect(
      dialog.getByRole("listitem").getByText("Passkey", { exact: true }),
    ).toBeVisible();

    // Close first and wait for it: the dialog lists the registered device in
    // its own <li>, so while it is open the protection-row locator matches two
    // elements and resolves to the wrong one.
    // `.first()` because the dialog carries two controls labelled "Close" —
    // the footer action and shadcn's built-in X. Escape is unreliable here:
    // the success toast takes focus as it appears.
    await dialog
      .getByRole("button", { name: t("common.close") })
      .first()
      .click();
    await expect(dialog).toBeHidden();

    await expect(row).toContainText(
      t("dashboard.security.protections.state.on"),
    );
    await expect(
      row.getByRole("button", {
        name: t("dashboard.security.protections.action.turnOff"),
      }),
    ).toBeVisible();

    await authenticator.detach();
  });

  test("removes one again", async ({ page }) => {
    const authenticator = await addVirtualAuthenticator(page);
    await page.goto(`${APP}/dashboard/security`);

    const row = passkeyRow(page);
    await row
      .getByRole("button", {
        name: t("dashboard.security.protections.action.turnOn"),
      })
      .click();

    const dialog = page.getByRole("dialog");
    await dialog
      .getByLabel(t("dashboard.security.passkeys.nameLabel"))
      .fill("Old phone");
    await dialog
      .getByRole("button", { name: t("dashboard.security.passkeys.add") })
      .click();
    await expect(dialog.getByText("Old phone")).toBeVisible();

    // Losing a device is the reason this button exists.
    await dialog
      .getByRole("button", {
        name: t("dashboard.security.passkeys.remove", { name: "Old phone" }),
      })
      .click();
    await expect(dialog).toContainText(t("dashboard.security.passkeys.empty"));

    await authenticator.detach();
  });
});

test.describe("signing in with a passkey", () => {
  test("is offered on the login screen", async ({ page }) => {
    await page.goto(`${APP}/login`);
    await expect(
      page.getByRole("button", { name: t("auth.login.signInWithPasskey") }),
    ).toBeVisible();
  });

  test("registers a passkey, then signs in with it and no password", async ({
    page,
    context,
  }) => {
    // One journey rather than two tests, because the second half cannot exist
    // without the first: a virtual authenticator holds no credential until
    // something registers one, and `credentials.get` with nothing to offer
    // fails exactly like a cancelled prompt.
    await signInAs(context, "investor", { domain: "localhost" });
    await isolate(context, "signin-journey");
    await context.addCookies([
      {
        // The stub cannot identify an account from a credential id the way
        // the real backend does, so the spec names it. Everything before that
        // point — options, ceremony, encoded assertion — is real.
        name: "stub_passkey_user",
        value: "investor",
        domain: "localhost",
        path: "/",
        sameSite: "Lax",
      },
    ]);
    const authenticator = await addVirtualAuthenticator(page);

    // 1. Register, so the authenticator actually holds a resident credential.
    await page.goto(`${APP}/dashboard/security`);
    await passkeyRow(page)
      .getByRole("button", {
        name: t("dashboard.security.protections.action.turnOn"),
      })
      .click();
    const dialog = page.getByRole("dialog");
    await dialog
      .getByRole("button", { name: t("dashboard.security.passkeys.add") })
      .click();
    // Scoped to the list: in Vietnamese the dialog title is also "Passkey",
    // so an unscoped match is ambiguous once the new device renders.
    await expect(
      dialog.getByRole("listitem").getByText("Passkey", { exact: true }),
    ).toBeVisible();

    // 2. Sign out, and back in with nothing but the passkey.
    await context.clearCookies({ name: "access_token" });
    await page.goto(`${APP}/login`);
    await page
      .getByRole("button", { name: t("auth.login.signInWithPasskey") })
      .click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole("heading", { name: t("dashboard.investor.title") }),
    ).toBeVisible();

    await authenticator.detach();
  });
});
