import type { ApiError } from "@/lib/types";

// Mirrors app/phone_verification/phone.py: Vietnamese mobiles only (03x, 05x,
// 07x, 08x, 09x), in any of the spellings people type. The backend is the
// judge; this only saves a round trip on an obvious typo.
const VN_MOBILE = /^(?:\+84|84|0)[35789][0-9]{8}$/;
const SEPARATORS = /[\s().-]/g;

export function isVietnameseMobile(value: string): boolean {
  return VN_MOBILE.test(value.trim().replace(SEPARATORS, ""));
}

/** "+84912345678" → "+84 912 345 678", for showing where a code went. */
export function formatVietnameseMobile(canonical: string): string {
  const match = /^\+84([0-9]{3})([0-9]{3})([0-9]{3})$/.exec(canonical);
  return match ? `+84 ${match[1]} ${match[2]} ${match[3]}` : canonical;
}

// The backend's English `detail` strings for the refusals a user can act on
// (app/phone_verification/service.py). Matched exactly, so a reworded message
// falls back to the generic text rather than to the wrong advice.
const DETAIL_KEYS: Record<string, string> = {
  "Incorrect code": "auth.verifyPhone.errors.incorrectCode",
  "This code has expired. Request a new one.":
    "auth.verifyPhone.errors.codeExpired",
  "Too many incorrect attempts. Request a new code.":
    "auth.verifyPhone.errors.tooManyAttempts",
  "Phone number already registered": "auth.verifyPhone.errors.phoneTaken",
  "This number has no Zalo account that can receive the code":
    "auth.verifyPhone.errors.noZalo",
};

/** i18n key for a failed send or verify. */
export function phoneVerificationErrorKey(
  error: ApiError | null | undefined,
): string {
  const byDetail = error?.message ? DETAIL_KEYS[error.message] : undefined;
  if (byDetail) return byDetail;
  switch (error?.status) {
    case 422:
      return "auth.verifyPhone.errors.phoneInvalid";
    case 429:
      return "auth.verifyPhone.errors.tooManyRequests";
    case 502:
      return "auth.verifyPhone.errors.sendFailed";
    case 503:
      return "auth.verifyPhone.errors.unavailable";
    default:
      return "auth.verifyPhone.errors.generic";
  }
}

/** Refusals after which the current code can no longer be used. */
export function codeIsSpent(errorKey: string): boolean {
  return (
    errorKey === "auth.verifyPhone.errors.codeExpired" ||
    errorKey === "auth.verifyPhone.errors.tooManyAttempts"
  );
}
