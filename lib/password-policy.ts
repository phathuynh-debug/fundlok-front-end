import type { ApiError } from "./types";

/**
 * What a new password must meet (audit finding SEC-03): at least 8
 * characters, at most 72 bytes, with a lowercase letter, an uppercase letter,
 * a digit and a symbol. Used by sign-up, reset, first password and change.
 *
 * Checked here so the user is told before a round trip; the backend
 * (app/auth/password_policy.py) re-checks all of it. It also refuses a
 * password found in Have I Been Pwned with 400 and
 * `X-Error-Code: PASSWORD_BREACHED`, which only the server can know.
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_BYTES = 72;
export const PASSWORD_BREACHED = "PASSWORD_BREACHED";

export type PasswordRule =
  "length" | "lowercase" | "uppercase" | "digit" | "symbol";

type Translate = (key: string) => string;

// Unicode classes, like the backend's str.islower()/isupper()/isdigit(), so
// Vietnamese letters count as letters.
const RULE_TESTS: [PasswordRule, (password: string) => boolean][] = [
  ["length", (p) => [...p].length >= PASSWORD_MIN_LENGTH],
  ["lowercase", (p) => /\p{Ll}/u.test(p)],
  ["uppercase", (p) => /\p{Lu}/u.test(p)],
  ["digit", (p) => /\p{Nd}/u.test(p)],
  ["symbol", (p) => /[^\p{L}\p{N}\s]/u.test(p)],
];

/** The rules `password` does not meet yet, in display order. */
export function unmetPasswordRules(password: string): PasswordRule[] {
  return RULE_TESTS.filter(([, passes]) => !passes(password)).map(
    ([rule]) => rule,
  );
}

export function isPasswordTooLong(password: string): boolean {
  return new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES;
}

/** What is wrong with `password`, in the user's language, or null if nothing. */
export function passwordProblem(password: string, t: Translate): string | null {
  if (isPasswordTooLong(password)) return t("auth.passwordPolicy.tooLong");
  const unmet = unmetPasswordRules(password);
  if (!unmet.length) return null;
  return t("auth.passwordPolicy.missing").replace(
    "{rules}",
    unmet.map((rule) => t(`auth.passwordPolicy.rules.${rule}`)).join(", "),
  );
}

/** Whether a failed call was the server refusing a breached password. */
export function isPasswordBreached(error: unknown): boolean {
  return (
    (error as Partial<ApiError> | null | undefined)?.code === PASSWORD_BREACHED
  );
}
