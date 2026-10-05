/**
 * Browser-side WebAuthn plumbing.
 *
 * The whole job of this file is translation. The server speaks the WebAuthn
 * spec's JSON, where every binary field is base64url text; `navigator
 * .credentials` speaks ArrayBuffers. Neither will accept the other's shape, and
 * getting a single field wrong fails with a `NotAllowedError` that says nothing
 * about which one — hence one place that does the conversion, rather than it
 * being spread across the screens that trigger a ceremony.
 *
 * Nothing here is a security boundary. The browser and the server both verify;
 * this only moves bytes between them.
 */

/** Whether this browser can do WebAuthn at all. */
export function isPasskeySupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined" &&
    typeof navigator?.credentials?.create === "function"
  );
}

/**
 * Whether the device has a built-in authenticator (Face ID, Touch ID, Windows
 * Hello). Distinct from `isPasskeySupported`: a desktop Chrome with no platform
 * authenticator still supports WebAuthn via a USB security key, so this only
 * decides how the offer is WORDED, never whether it is shown.
 */
export async function hasPlatformAuthenticator(): Promise<boolean> {
  if (!isPasskeySupported()) return false;
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

function base64UrlToBuffer(value: string): ArrayBuffer {
  // Restore the padding the server strips, and swap the URL-safe alphabet back.
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

type Json = Record<string, unknown>;

/**
 * Turn the server's registration options into what `credentials.create` wants,
 * run the ceremony, and turn the result back into JSON.
 *
 * Throws whatever the browser throws. Callers translate: a `NotAllowedError`
 * means the person cancelled or timed out, which is not an error worth a red
 * toast.
 */
export async function createPasskey(options: Json): Promise<Json> {
  const publicKey = {
    ...options,
    challenge: base64UrlToBuffer(options.challenge as string),
    user: {
      ...(options.user as Json),
      id: base64UrlToBuffer((options.user as Json).id as string),
    },
    excludeCredentials: ((options.excludeCredentials as Json[]) ?? []).map(
      (credential) => ({
        ...credential,
        id: base64UrlToBuffer(credential.id as string),
      }),
    ),
  } as PublicKeyCredentialCreationOptions;

  const credential = (await navigator.credentials.create({
    publicKey,
  })) as PublicKeyCredential | null;

  if (!credential) throw new Error("No credential returned");
  const response = credential.response as AuthenticatorAttestationResponse;

  return {
    id: credential.id,
    rawId: bufferToBase64Url(credential.rawId),
    type: credential.type,
    // Reported by the authenticator ("internal", "hybrid", "usb"…). The server
    // stores them so a later sign-in can hint the right transport.
    transports:
      typeof response.getTransports === "function"
        ? response.getTransports()
        : [],
    response: {
      clientDataJSON: bufferToBase64Url(response.clientDataJSON),
      attestationObject: bufferToBase64Url(response.attestationObject),
    },
  };
}

/** The sign-in half: `credentials.get`, then back to JSON. */
export async function getPasskeyAssertion(options: Json): Promise<Json> {
  const publicKey = {
    ...options,
    challenge: base64UrlToBuffer(options.challenge as string),
    allowCredentials: ((options.allowCredentials as Json[]) ?? []).map(
      (credential) => ({
        ...credential,
        id: base64UrlToBuffer(credential.id as string),
      }),
    ),
  } as PublicKeyCredentialRequestOptions;

  const credential = (await navigator.credentials.get({
    publicKey,
  })) as PublicKeyCredential | null;

  if (!credential) throw new Error("No credential returned");
  const response = credential.response as AuthenticatorAssertionResponse;

  return {
    id: credential.id,
    rawId: bufferToBase64Url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: bufferToBase64Url(response.clientDataJSON),
      authenticatorData: bufferToBase64Url(response.authenticatorData),
      signature: bufferToBase64Url(response.signature),
      // Null for a non-discoverable credential; the server does not need it,
      // since it finds the account from the credential id.
      userHandle: response.userHandle
        ? bufferToBase64Url(response.userHandle)
        : null,
    },
  };
}

/**
 * True when the person dismissed the system prompt rather than something
 * failing. The browser reports both as `NotAllowedError`, and a cancel is the
 * overwhelmingly common case — so screens treat it as "nothing happened"
 * rather than showing an error.
 */
export function isPasskeyCancellation(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "NotAllowedError" || error.name === "AbortError")
  );
}
