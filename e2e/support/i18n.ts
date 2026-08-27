import en from "../../lib/i18n/en.json";
import vi from "../../lib/i18n/vi.json";

const dictionaries = { en, vi } as const;

export type TestLocale = keyof typeof dictionaries;

/**
 * Look a string up the way the app does, instead of pasting English copy into
 * assertions.
 *
 * Two reasons: a copy edit shouldn't break the suite, and a DELETED key should
 * — this throws rather than silently asserting on the literal key, which is
 * exactly the failure a hardcoded string would hide.
 */
export function t(
  key: string,
  values?: Record<string, string | number>,
  locale: TestLocale = "en",
): string {
  const resolved = key
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === "object"
          ? (node as Record<string, unknown>)[part]
          : undefined,
      dictionaries[locale],
    );

  if (typeof resolved !== "string") {
    throw new Error(
      `i18n key "${key}" is missing from ${locale}.json — the assertion using it is stale.`,
    );
  }

  return values
    ? resolved.replace(/\{(\w+)\}/g, (match, name) =>
        name in values ? String(values[name]) : match,
      )
    : resolved;
}

/**
 * Playwright collapses whitespace runs when matching text, and `\s` includes
 * the U+00A0 that Intl puts before "₫". Normalising the expected string the
 * same way keeps money assertions from failing on an invisible character.
 */
export function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
