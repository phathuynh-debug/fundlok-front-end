/**
 * Text the backend wrote, shown only where it can be read.
 *
 * The backend writes its messages in English only. On the English site its
 * specific wording is shown when there is some; on any other locale the
 * caller's translated fallback is shown instead, so the Vietnamese site never
 * carries an English sentence.
 */
export function backendText(
  text: unknown,
  locale: string,
  fallback: string,
): string {
  if (locale !== "en") return fallback;
  return typeof text === "string" && text.trim() ? text : fallback;
}

/**
 * The message to show for a failed API call.
 *
 * Showing the backend detail first (`error.message || t(...)`) put English
 * sentences in toasts on the Vietnamese site; see backendText.
 */
export function apiErrorMessage(
  error: unknown,
  locale: string,
  fallback: string,
): string {
  return backendText(
    (error as { message?: unknown } | null | undefined)?.message,
    locale,
    fallback,
  );
}
