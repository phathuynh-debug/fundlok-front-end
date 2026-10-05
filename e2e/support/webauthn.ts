import type { Page } from "@playwright/test";

/**
 * Attach a Chrome DevTools virtual authenticator to the page.
 *
 * WebAuthn cannot be faked from page scripts — `navigator.credentials` is not
 * patchable in a way the browser will accept, and there is no real Touch ID in
 * CI. CDP's virtual authenticator is the supported answer: Chrome runs the
 * genuine ceremony against a software authenticator, so the credential the app
 * receives has the real shape, with real signatures and a real credential id.
 *
 * What this proves is the FRONTEND path end to end: options reaching the
 * browser in a shape it accepts, and the response being encoded back into what
 * the API expects. Signature verification is proven separately against the
 * real Python backend, where a replayed assertion is also shown to be refused
 * — the stub API here has no crypto at all.
 */
export async function addVirtualAuthenticator(page: Page): Promise<{
  authenticatorId: string;
  detach: () => Promise<void>;
}> {
  const client = await page.context().newCDPSession(page);
  await client.send("WebAuthn.enable");

  const { authenticatorId } = await client.send(
    "WebAuthn.addVirtualAuthenticator",
    {
      options: {
        protocol: "ctap2",
        // "internal" is a platform authenticator — Touch ID, Windows Hello.
        transport: "internal",
        // Both required for a discoverable credential, which is what makes
        // sign-in work with no email typed first.
        hasResidentKey: true,
        hasUserVerification: true,
        // Stands in for the fingerprint: without it every ceremony would hang
        // waiting for a gesture that never comes in a headless browser.
        isUserVerified: true,
        automaticPresenceSimulation: true,
      },
    },
  );

  return {
    authenticatorId,
    detach: async () => {
      await client.send("WebAuthn.removeVirtualAuthenticator", {
        authenticatorId,
      });
      await client.detach();
    },
  };
}
