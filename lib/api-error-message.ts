/**
 * The message to show for a failed API call.
 *
 * The backend writes its error details in English only. Showing them first
 * (`error.message || t(...)`) put English sentences in toasts on the
 * Vietnamese site. So: on the English site the backend's specific reason is
 * still shown when there is one; on any other locale the caller's translated
 * fallback is shown instead.
 */
export function apiErrorMessage(
  error: unknown,
  locale: string,
  fallback: string,
): string {
  if (locale !== "en") return fallback;
  const message = (error as { message?: unknown } | null | undefined)?.message;
  return typeof message === "string" && message.trim() ? message : fallback;
}
