import { apiErrorMessage } from "@/lib/api-error-message";
import type { ApiError } from "@/lib/types";

// Failures staff can act on, by X-Error-Code.
const KNOWN = new Set([
  "ALREADY_DECIDED",
  "NOTHING_TO_DECIDE",
  "DISPUTE_ALREADY_DECIDED",
  "CAPACITY_EXCEEDED",
]);

export function transferErrorMessage(
  error: ApiError,
  t: (key: string) => string,
  locale: string,
): string {
  if (error.code && KNOWN.has(error.code)) {
    return t(`admin.transactions.errors.${error.code}`);
  }
  if (error.status === 403) return t("admin.transactions.sheet.ownTransfer");
  return apiErrorMessage(error, locale, t("common.tryAgain"));
}
