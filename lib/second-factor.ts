import type { ApiError } from "./types";

/**
 * The admin second-factor rule (audit finding SEC-01).
 *
 * The backend refuses every request from an ADMIN or SYSTEM_ADMIN whose
 * session was opened without a second factor: 403 with
 * `X-Error-Code: MFA_REQUIRED`. Only the calls an admin needs to get one keep
 * answering: GET /users/me, GET /auth/2fa, GET /auth/passkeys, and enrolling a
 * FIRST authenticator app or passkey. Enrolling does not upgrade the session;
 * the admin has to sign out and sign in again with the new factor.
 */
export const MFA_REQUIRED = "MFA_REQUIRED";

/**
 * Where an admin on such a session is sent: their own security page, which
 * hosts the authenticator-app and passkey setup dialogs.
 */
export const SECOND_FACTOR_SETUP_PATH = "/admin/security";

/** Whether a failed call was refused for want of a second factor. */
export function isSecondFactorRequired(error: unknown): boolean {
  return (error as Partial<ApiError> | null | undefined)?.code === MFA_REQUIRED;
}

/**
 * Whether a refusal on `pathname` should send the admin to the setup page.
 *
 * Never from the setup page itself. Its own calls (sessions, activity,
 * preferences) are refused too, and it reads those refusals to show its
 * notice. Sending it to itself would reload it forever.
 */
export function shouldRedirectToSecondFactorSetup(pathname: string): boolean {
  return (
    pathname !== SECOND_FACTOR_SETUP_PATH &&
    !pathname.startsWith(`${SECOND_FACTOR_SETUP_PATH}/`)
  );
}
