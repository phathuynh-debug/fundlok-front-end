import type { ApiError } from "./types";

/**
 * Step-up for adding a sign-in method (an authenticator app or a passkey).
 *
 * A session alone no longer starts either enrolment: whoever held a stolen
 * one could register their own passkey, which kept signing them in after the
 * owner changed the password. POST /auth/2fa/setup and
 * /auth/passkeys/register/options now need the account password. Accounts
 * with none (Google/Microsoft sign-in only) instead need a session that
 * signed in within the last few minutes.
 */
export const PASSWORD_REQUIRED = "PASSWORD_REQUIRED";
/** No password to check and the session's sign-in is too old: sign in again. */
export const REAUTH_REQUIRED = "REAUTH_REQUIRED";
/** Too many wrong passwords; the backend waits 15 minutes. */
export const STEP_UP_LOCKED = "STEP_UP_LOCKED";

function codeOf(error: unknown): string | undefined {
  return (error as Partial<ApiError> | null | undefined)?.code;
}

export function isReauthRequired(error: unknown): boolean {
  return codeOf(error) === REAUTH_REQUIRED;
}

export function isStepUpLocked(error: unknown): boolean {
  return codeOf(error) === STEP_UP_LOCKED;
}

/**
 * Whether enrolment must ask for the password first. Unknown (the profile has
 * not loaded, or an older backend omits the field) asks, since a password
 * the backend does not need is ignored, while a missing one is refused.
 */
export function needsPasswordForStepUp(
  user: { has_password?: boolean } | null | undefined,
): boolean {
  return user?.has_password ?? true;
}
